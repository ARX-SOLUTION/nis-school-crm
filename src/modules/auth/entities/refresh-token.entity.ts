import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'refresh_tokens' })
@Index('idx_refresh_user', ['user'])
@Index('idx_refresh_token_hash', ['tokenHash'], { unique: true })
@Index('idx_refresh_family', ['familyId'])
export class RefreshToken extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  /** SHA-256 hex digest of the opaque refresh token. */
  @Column({ name: 'token_hash', type: 'varchar', length: 64 })
  tokenHash!: string;

  /**
   * All tokens that share a family descend from a single login.
   * If a revoked token is presented, every token in the family is revoked
   * to defend against refresh-token theft (reuse detection).
   */
  @Column({ name: 'family_id', type: 'uuid' })
  familyId!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'revoked', type: 'boolean', default: false })
  revoked!: boolean;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({ name: 'replaced_by', type: 'uuid', nullable: true })
  replacedBy!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent!: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;
}
