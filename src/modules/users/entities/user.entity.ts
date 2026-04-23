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

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'must_change_password', type: 'boolean', default: true })
  mustChangePassword!: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;
}
