import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ParentInvite, ParentRelationship } from '../entities/parent-invite.entity';
import { ParentStudent } from '../entities/parent-student.entity';
import { Student } from '../../students/entities/student.entity';
import { User } from '../../users/entities/user.entity';
import type { TelegramAuthPayload } from '../../auth/services/telegram-auth.service';
import { RoleName, isParent } from '../../../common/enums/role.enum';

interface CreateInviteInput {
  studentId: string;
  parentName?: string | null;
  relationship?: ParentRelationship | null;
  createdById: string;
}

interface AcceptInviteInput {
  token: string;
  telegramPayload: TelegramAuthPayload;
}

interface AcceptInviteResult {
  user: User;
  parentStudent: ParentStudent;
  invite: ParentInvite;
}

interface ListInvitesFilter {
  studentId?: string;
  createdById?: string;
  usedOnly?: boolean;
  pendingOnly?: boolean;
}

/**
 * Manages the full lifecycle of parent invites.
 *
 * Security contract:
 * - acceptInvite runs entirely inside a single DataSource transaction with a
 *   SELECT ... FOR UPDATE lock on the invite row to prevent TOCTOU races.
 * - User creation (including the throwaway bcrypt hash) is inside the same
 *   transaction so no orphaned user rows can be left if the invite burn fails.
 * - Telegram hash verification is always delegated to TelegramAuthService.
 * - The invite token is never logged — only the invite UUID / studentId.
 */
@Injectable()
export class ParentInviteService {
  private readonly logger = new Logger(ParentInviteService.name);
  private readonly bcryptCost: number;

  constructor(
    @InjectRepository(ParentInvite)
    private readonly invites: Repository<ParentInvite>,
    @InjectRepository(ParentStudent)
    private readonly parentStudents: Repository<ParentStudent>,
    @InjectRepository(Student)
    private readonly students: Repository<Student>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    config: ConfigService,
  ) {
    this.bcryptCost = config.getOrThrow<number>('BCRYPT_COST');
  }

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------

  /**
   * Issues a new invite for a student. The caller (controller) is responsible
   * for constructing the invite URL from the returned entity's `token`.
   *
   * The token is never logged — only the invite id and studentId are safe to emit.
   */
  async createInvite(input: CreateInviteInput): Promise<ParentInvite> {
    const student = await this.students.findOne({
      where: { id: input.studentId },
    });
    if (!student) {
      throw new NotFoundException(`Student ${input.studentId} not found`);
    }

    // 256 bits of entropy — not a password, stored in plaintext because the
    // column already has a UNIQUE constraint and it is random, not derivative.
    const token = randomBytes(32).toString('hex');

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7d

    const invite = await this.invites.save(
      this.invites.create({
        token,
        studentId: input.studentId,
        parentName: input.parentName ?? null,
        relationship: input.relationship ?? null,
        createdById: input.createdById,
        expiresAt,
        usedAt: null,
        usedByUserId: null,
      }),
    );

    this.logger.log(`Invite created id=${invite.id} studentId=${invite.studentId}`);
    return invite;
  }

  // ---------------------------------------------------------------------------
  // Accept (critical transactional path)
  // ---------------------------------------------------------------------------

  /**
   * Accepts a parent invite. Runs all writes inside a single transaction with
   * a FOR UPDATE lock on the invite row.
   *
   * Steps (matching spec §9.1):
   * 1. Verify Telegram payload hash + freshness.
   * 2. Open transaction.
   * 3. Load invite FOR UPDATE — 404, 400, or 400 on invalid state.
   * 4. Look up user by telegramChatId.
   * 5. If absent: create user (PARENT role, throwaway password hash).
   * 6. Upsert parent_students link (NO-OP on duplicate).
   * 7. Burn the invite (usedAt + usedByUserId).
   * 8. Commit.
   */
  async acceptInvite(input: AcceptInviteInput): Promise<AcceptInviteResult> {
    // Telegram hash verification is the caller's responsibility: see
    // TelegramLoginService.acceptInviteAndLogin. Doing it here would require
    // this module to import AuthModule (for TelegramAuthService), which would
    // create a circular dependency with AuthModule importing ParentsModule.
    return this.dataSource.transaction(async (manager) => {
      // --- Step 3: Load + lock invite row ---
      // TypeORM's QueryRunner.manager does not expose a clean FOR UPDATE API;
      // we use a raw query through the same manager to ensure we share the
      // transaction context. The invite_id is then used to reload via the ORM.
      const rawRows = await manager.query<{ id: string }[]>(
        `SELECT id FROM parent_invites WHERE token = $1 AND deleted_at IS NULL FOR UPDATE`,
        [input.token],
      );

      if (!rawRows.length) {
        throw new NotFoundException('Invite not found or has been revoked');
      }

      const inviteId = rawRows[0]!.id;
      const invite = await manager.findOne(ParentInvite, { where: { id: inviteId } });

      // Narrow — should always be non-null because we just locked the row.
      if (!invite) {
        throw new NotFoundException('Invite not found');
      }

      if (invite.usedAt !== null) {
        throw new BadRequestException('This invite has already been used');
      }

      if (invite.expiresAt < new Date()) {
        throw new BadRequestException('This invite has expired');
      }

      // deletedAt guard is covered by the SQL WHERE clause above, but assert
      // defensively in case TypeORM soft-delete filtering interferes.
      if (invite.deletedAt !== null) {
        throw new NotFoundException('Invite not found or has been revoked');
      }

      // --- Step 4: Look up existing user by Telegram ID ---
      const telegramChatId = String(input.telegramPayload.id);
      let user = await manager.findOne(User, { where: { telegramChatId } });

      if (user) {
        // --- Step 4a: Existing user ---
        if (!isParent(user.role)) {
          throw new ConflictException(
            'This Telegram account is linked to a staff user and cannot accept parent invites',
          );
        }

        // Refresh Telegram display fields in case they changed.
        await manager.update(
          User,
          { id: user.id },
          {
            telegramUsername: input.telegramPayload.username ?? null,
            telegramFirstName: input.telegramPayload.first_name,
            telegramLastName: input.telegramPayload.last_name ?? null,
            telegramPhotoUrl: input.telegramPayload.photo_url ?? null,
          },
        );

        // Reload to pick up updated fields.
        user = (await manager.findOne(User, { where: { id: user.id } }))!;
      } else {
        // --- Step 5: Create new PARENT user ---
        // The password hash is computed from a random value that is immediately
        // discarded — PARENT users authenticate exclusively via Telegram, never
        // via password. Using a real bcrypt cost means this is slow but it runs
        // inside the transaction only once per invite acceptance.
        const throwawayPassword = randomBytes(48).toString('base64');
        const passwordHash = await bcrypt.hash(throwawayPassword, this.bcryptCost);

        const fullName = [input.telegramPayload.first_name, input.telegramPayload.last_name ?? '']
          .join(' ')
          .trim();

        // Placeholder email: unique, never used for login.
        const email = `tg_${input.telegramPayload.id}@nis.parent`;

        const newUser = manager.create(User, {
          email,
          passwordHash,
          fullName,
          phone: null,
          role: RoleName.PARENT,
          telegramChatId,
          telegramUsername: input.telegramPayload.username ?? null,
          telegramFirstName: input.telegramPayload.first_name,
          telegramLastName: input.telegramPayload.last_name ?? null,
          telegramPhotoUrl: input.telegramPayload.photo_url ?? null,
          isActive: true,
          mustChangePassword: false,
          lastLoginAt: null,
        });

        user = await manager.save(User, newUser);
        this.logger.log(`New PARENT user created id=${user.id} via invite id=${inviteId}`);
      }

      // --- Step 6: Upsert parent_students link ---
      // The unique constraint on (parent_user_id, student_id) means a second
      // accept for the same pair would violate it. We detect the existing row
      // and skip the insert — NO-OP per spec.
      const existingLink = await manager.findOne(ParentStudent, {
        where: {
          parentUserId: user.id,
          studentId: invite.studentId,
        },
      });

      let parentStudent: ParentStudent;

      if (existingLink) {
        parentStudent = existingLink;
      } else {
        const link = manager.create(ParentStudent, {
          parentUserId: user.id,
          studentId: invite.studentId,
          relationship: invite.relationship,
          isPrimary: false,
        });
        parentStudent = await manager.save(ParentStudent, link);
      }

      // --- Step 7: Burn the invite ---
      const now = new Date();
      invite.usedAt = now;
      invite.usedByUserId = user.id;
      await manager.save(ParentInvite, invite);

      this.logger.log(`Invite consumed id=${inviteId} parentUserId=${user.id}`);

      return { user, parentStudent, invite };
    });
  }

  // ---------------------------------------------------------------------------
  // List / Revoke
  // ---------------------------------------------------------------------------

  /**
   * Returns invites matching the given filter. Intended for the MANAGER
   * dashboard. Pagination will be added later (spec defers it).
   */
  async listInvites(filter: ListInvitesFilter): Promise<ParentInvite[]> {
    const qb = this.invites.createQueryBuilder('invite');

    if (filter.studentId) {
      qb.andWhere('invite.studentId = :studentId', { studentId: filter.studentId });
    }
    if (filter.createdById) {
      qb.andWhere('invite.createdById = :createdById', {
        createdById: filter.createdById,
      });
    }
    if (filter.usedOnly) {
      qb.andWhere('invite.usedAt IS NOT NULL');
    }
    if (filter.pendingOnly) {
      qb.andWhere('invite.usedAt IS NULL').andWhere('invite.expiresAt > NOW()');
    }

    return qb.orderBy('invite.createdAt', 'DESC').getMany();
  }

  /**
   * Soft-deletes an unused invite. Throws if the invite has already been used
   * (cannot revoke a consumed invite — that would affect the audit trail).
   */
  async revokeInvite(id: string): Promise<void> {
    const invite = await this.invites.findOne({ where: { id } });

    if (!invite) {
      throw new NotFoundException(`Invite ${id} not found`);
    }

    if (invite.usedAt !== null) {
      throw new BadRequestException('Cannot revoke an invite that has already been used');
    }

    await this.invites.softDelete({ id });
    this.logger.log(`Invite revoked id=${id}`);
  }
}
