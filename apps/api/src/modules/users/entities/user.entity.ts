import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { RoleName } from '../../../common/enums/role.enum';

@Entity({ name: 'users' })
@Index('idx_users_email', ['email'], { where: '"deleted_at" IS NULL' })
@Index('idx_users_role', ['role'])
export class User extends BaseEntity {
  @Column({ name: 'email', type: 'varchar', length: 150, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 200 })
  fullName!: string;

  @Column({ name: 'phone', type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({
    name: 'role',
    type: 'enum',
    enum: RoleName,
  })
  role!: RoleName;

  @Column({ name: 'telegram_chat_id', type: 'bigint', unique: true, nullable: true })
  telegramChatId!: string | null;

  @Column({ name: 'telegram_username', type: 'varchar', length: 100, nullable: true })
  telegramUsername!: string | null;

  /** Given name as returned by Telegram Login Widget / bot getChat. */
  @Column({ name: 'telegram_first_name', type: 'varchar', length: 64, nullable: true })
  telegramFirstName!: string | null;

  /** Family name as returned by Telegram Login Widget / bot getChat. */
  @Column({ name: 'telegram_last_name', type: 'varchar', length: 64, nullable: true })
  telegramLastName!: string | null;

  /** Profile photo URL from Telegram (can change; treat as a hint, not authoritative). */
  @Column({ name: 'telegram_photo_url', type: 'varchar', length: 500, nullable: true })
  telegramPhotoUrl!: string | null;

  /**
   * UI language preference. Stored as a BCP-47-ish short code.
   * Constrained to supported locales at DB level via a CHECK constraint
   * added in migration 1745366440000.
   */
  @Column({ name: 'language', type: 'varchar', length: 5, default: 'uz' })
  language!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'must_change_password', type: 'boolean', default: true })
  mustChangePassword!: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;
}
