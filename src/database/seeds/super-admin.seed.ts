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

  if (existing) {
    return existing;
  }

  const passwordHash = await bcrypt.hash(cfg.password, cfg.bcryptCost);
  const user = repo.create({
    email: cfg.email,
    passwordHash,
    fullName: cfg.fullName,
    role: RoleName.SUPER_ADMIN,
    isActive: true,
    mustChangePassword: true,
  });
  return repo.save(user);
}
