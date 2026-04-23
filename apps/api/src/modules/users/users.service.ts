import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, EntityManager, QueryFailedError, Repository } from 'typeorm';
import {
  EVENT_USER_CREATED,
  EVENT_USER_PASSWORD_RESET,
  UserCreatedEvent,
  UserPasswordResetEvent,
} from '../../common/events/contracts';
import { EventBusService } from '../../common/events/event-bus.service';
import { canCreateRole, canManageRole, RoleName } from '../../common/enums/role.enum';
import { generateRandomPassword } from '../../common/utils/random-password';
import { escapeLikePattern } from '../../common/utils/sql-like';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { ActorContext } from '../../common/types/actor-context';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { User } from './entities/user.entity';

const PG_UNIQUE_VIOLATION = '23505';

export interface CreatedUserResult {
  user: User;
  generatedPassword: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly bcryptCost: number;

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly eventBus: EventBusService,
    config: ConfigService,
  ) {
    this.bcryptCost = config.getOrThrow<number>('BCRYPT_COST');
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  async getById(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Case-insensitive lookup by email; returns null when not found. */
  findByEmail(email: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('u')
      .where('LOWER(u.email) = LOWER(:email)', { email })
      .getOne();
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.users.update({ id: userId }, { passwordHash, mustChangePassword: false });
  }

  async touchLastLogin(userId: string): Promise<void> {
    await this.users.update({ id: userId }, { lastLoginAt: new Date() });
  }

  /**
   * Create a new user inside a transaction. The caller may pass an `extra`
   * callback that runs against the same EntityManager — used by the teachers
   * module to persist a TeacherProfile in the same transaction. The
   * `user.created` event is published only after the commit succeeds.
   *
   * Note on at-least-once delivery: amqp-connection-manager buffers publishes
   * during a broker outage, but a hard process crash between the DB commit
   * and the publish will lose the event. A transactional outbox lands in
   * Stage 5 (RabbitMQ + Audit). Until then we log the lost payload (sans
   * password) to make manual replay possible.
   */
  async create(
    actor: ActorContext,
    dto: CreateUserDto,
    extra?: (manager: EntityManager, user: User) => Promise<void>,
  ): Promise<CreatedUserResult> {
    if (dto.role === RoleName.SUPER_ADMIN) {
      throw new ForbiddenException('SUPER_ADMIN cannot be created via the API');
    }
    if (!canCreateRole(actor.role, dto.role)) {
      throw new ForbiddenException(`${actor.role} cannot create users with role ${dto.role}`);
    }

    const generatedPassword = generateRandomPassword(14);
    const passwordHash = await bcrypt.hash(generatedPassword, this.bcryptCost);

    let user: User;
    try {
      user = await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(User);
        const created = await repo.save(
          repo.create({
            email: dto.email,
            passwordHash,
            fullName: dto.fullName,
            phone: dto.phone ?? null,
            role: dto.role,
            telegramUsername: dto.telegramUsername ?? null,
            telegramChatId: null,
            isActive: true,
            mustChangePassword: true,
            lastLoginAt: null,
          }),
        );
        if (extra) {
          await extra(manager, created);
        }
        return created;
      });
    } catch (err) {
      if (this.isUniqueViolation(err)) {
        throw new ConflictException('A user with this email already exists');
      }
      throw err;
    }

    const event: UserCreatedEvent = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      telegramUsername: user.telegramUsername,
      generatedPassword,
      createdByUserId: actor.id,
    };
    await this.publishOrLog(EVENT_USER_CREATED, event, { userId: user.id });

    return { user, generatedPassword };
  }

  async list(query: UsersQueryDto): Promise<PaginatedResponseDto<User>> {
    const qb = this.users.createQueryBuilder('u');
    if (query.role) qb.andWhere('u.role = :role', { role: query.role });
    if (query.isActive !== undefined) {
      qb.andWhere('u.is_active = :active', { active: query.isActive });
    }
    if (query.search) {
      const escaped = escapeLikePattern(query.search.toLowerCase());
      qb.andWhere(
        "(LOWER(u.email) LIKE :q ESCAPE '\\' OR LOWER(u.full_name) LIKE :q ESCAPE '\\')",
        { q: `%${escaped}%` },
      );
    }
    qb.orderBy('u.created_at', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.of(
      data,
      PaginatedResponseDto.buildMeta(total, query.page, query.limit),
    );
  }

  async update(actor: ActorContext, id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.getById(id);
    if (user.role === RoleName.SUPER_ADMIN && actor.role !== RoleName.SUPER_ADMIN) {
      throw new ForbiddenException('SUPER_ADMIN can only be edited by SUPER_ADMIN');
    }
    if (!canManageRole(actor.role, user.role) && user.id !== actor.id) {
      throw new ForbiddenException(`${actor.role} cannot edit users with role ${user.role}`);
    }
    Object.assign(user, {
      ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone || null } : {}),
      ...(dto.telegramUsername !== undefined
        ? { telegramUsername: dto.telegramUsername || null }
        : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });
    return this.users.save(user);
  }

  async softDelete(actor: ActorContext, id: string): Promise<void> {
    if (id === actor.id) {
      throw new ForbiddenException('You cannot delete your own account');
    }
    const user = await this.getById(id);
    if (user.role === RoleName.SUPER_ADMIN) {
      throw new ForbiddenException('SUPER_ADMIN cannot be deleted');
    }
    if (!canManageRole(actor.role, user.role)) {
      throw new ForbiddenException(`${actor.role} cannot delete users with role ${user.role}`);
    }
    await this.users.softDelete({ id });
  }

  async resetPassword(actor: ActorContext, id: string): Promise<{ user: User; password: string }> {
    const user = await this.getById(id);
    if (user.role === RoleName.SUPER_ADMIN && actor.role !== RoleName.SUPER_ADMIN) {
      throw new ForbiddenException('SUPER_ADMIN password can only be reset by SUPER_ADMIN');
    }
    if (!canManageRole(actor.role, user.role) && user.id !== actor.id) {
      throw new ForbiddenException(
        `${actor.role} cannot reset password for users with role ${user.role}`,
      );
    }
    const password = generateRandomPassword(14);
    const hash = await bcrypt.hash(password, this.bcryptCost);
    await this.users.update({ id: user.id }, { passwordHash: hash, mustChangePassword: true });
    user.passwordHash = hash;
    user.mustChangePassword = true;

    const event: UserPasswordResetEvent = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      telegramUsername: user.telegramUsername,
      generatedPassword: password,
      resetByUserId: actor.id,
    };
    await this.publishOrLog(EVENT_USER_PASSWORD_RESET, event, { userId: user.id });

    return { user, password };
  }

  private isUniqueViolation(err: unknown): boolean {
    if (!(err instanceof QueryFailedError)) return false;
    const candidate = err as unknown as { code?: unknown };
    return typeof candidate.code === 'string' && candidate.code === PG_UNIQUE_VIOLATION;
  }

  /**
   * Publish best-effort. If publish throws, log a structured marker without
   * the password so operators can manually replay from the audit log (Stage 5)
   * once it lands. We swallow the error rather than fail the HTTP request
   * because the primary write (DB commit) has already succeeded — surfacing
   * a 5xx would mislead the caller into thinking nothing happened.
   */
  private async publishOrLog(
    routingKey: string,
    payload: { userId: string },
    safeContext: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.eventBus.publish(routingKey, payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown';
      this.logger.error(
        `EVENT_LOST routingKey=${routingKey} ${JSON.stringify(safeContext)} reason=${message}`,
      );
    }
  }
}
