/* eslint-disable no-console */
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedSuperAdmin } from './super-admin.seed';

async function main(): Promise<void> {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL;
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
  const fullName = process.env.SEED_SUPER_ADMIN_NAME ?? 'Super Admin';
  const bcryptCost = Number(process.env.BCRYPT_COST ?? 12);

  if (!email || !password) {
    throw new Error(
      'SEED_SUPER_ADMIN_EMAIL and SEED_SUPER_ADMIN_PASSWORD must be set in the environment.',
    );
  }

  await AppDataSource.initialize();
  try {
    const user = await seedSuperAdmin(AppDataSource, { email, password, fullName, bcryptCost });
    console.log(`Super admin ready: ${user.email} (${user.id})`);
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
