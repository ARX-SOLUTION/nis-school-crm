import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Student } from '../../students/entities/student.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Allowed relationship values between a parent and a student.
 * Stored as a varchar with a DB-level CHECK constraint rather than a Postgres
 * enum so that adding new values does not require an ALTER TYPE migration.
 */
export const PARENT_RELATIONSHIP_VALUES = ['FATHER', 'MOTHER', 'GUARDIAN', 'OTHER'] as const;
export type ParentRelationship = (typeof PARENT_RELATIONSHIP_VALUES)[number];

/**
 * A single-use, time-limited invite that allows a guardian to register as a
 * PARENT user and be linked to a specific student.
 *
 * Token generation (service layer, NOT here):
 *   `crypto.randomBytes(32).toString('hex')` — 64 hex characters, 256 bits of entropy.
 *
 * An invite is "consumed" when `usedAt` and `usedByUserId` are both set.
 * The partial index `idx_parent_invites_token_active` covers only unused,
 * non-deleted rows so the invite lookup path stays narrow.
 *
 * Soft-delete (deletedAt) is inherited from BaseEntity and is used to
 * administratively revoke an invite without destroying the audit trail.
 */
@Entity({ name: 'parent_invites' })
@Index('idx_parent_invites_student', ['studentId'])
@Index('idx_parent_invites_expires_at', ['expiresAt'])
export class ParentInvite extends BaseEntity {
  /**
   * Secret token sent to the invitee. Generated as
   * `crypto.randomBytes(32).toString('hex')` (64 hex chars).
   * Stored in plain text because it is already a random high-entropy value
   * (not a password). UNIQUE constraint enforced by the column definition.
   */
  @Column({ name: 'token', type: 'varchar', length: 64, unique: true })
  token!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  /** Optional human-readable name of the parent being invited. */
  @Column({ name: 'parent_name', type: 'varchar', length: 200, nullable: true })
  parentName!: string | null;

  /**
   * Relationship of the invited guardian to the student.
   * Constrained to PARENT_RELATIONSHIP_VALUES by a DB CHECK constraint
   * added in migration 1745366440000.
   */
  @Column({ name: 'relationship', type: 'varchar', length: 30, nullable: true })
  relationship!: ParentRelationship | null;

  /** Staff member who issued the invite. */
  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'created_by_id' })
  createdBy!: User;

  @Column({ name: 'created_by_id', type: 'uuid' })
  createdById!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  /** Set when the invite is accepted; null while the invite is pending. */
  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt!: Date | null;

  /**
   * The PARENT-role User created or linked when this invite was accepted.
   * ON DELETE SET NULL so that deleting the parent user does not cascade-delete
   * the invite audit trail.
   */
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'used_by_user_id' })
  usedByUser!: User | null;

  @Column({ name: 'used_by_user_id', type: 'uuid', nullable: true })
  usedByUserId!: string | null;
}
