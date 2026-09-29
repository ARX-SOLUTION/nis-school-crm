import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { RoleName } from '../../common/enums/role.enum';
import { User } from '../../modules/users/entities/user.entity';

interface SeedConfig {
  email: string;
  password: string;
  fullName: string;
  bcryptCost: number;
}

export async function seedSuperAdmin(dataSource: DataSource, cfg: SeedConfig): Promise<User> {
  const repo = dataSource.getRepository(User);

  const existing = await repo
    .createQueryBuilder('u')
    .where('LOWER(u.email) = LOWER(:email)', { email: cfg.email })
    .getOne();

  const passwordHash = await bcrypt.hash(cfg.password, cfg.bcryptCost);

  if (existing) {
    existing.passwordHash = passwordHash;
    existing.role = RoleName.SUPER_ADMIN;
    existing.isActive = true;
    if (cfg.fullName) {
      existing.fullName = cfg.fullName;
    }
    existing.mustChangePassword = false;
    return repo.save(existing);
  }

  const user = repo.create({
    email: cfg.email,
    passwordHash,
    fullName: cfg.fullName,
    role: RoleName.SUPER_ADMIN,
    isActive: true,
    mustChangePassword: false,
  });
  return repo.save(user);
}
