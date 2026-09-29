import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBranchesAndPaymentGateways1745366480000 implements MigrationInterface {
  name = 'CreateBranchesAndPaymentGateways1745366480000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. branches table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "branches" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "name" varchar(150) NOT NULL,
        "code" varchar(50) NOT NULL UNIQUE,
        "address" varchar(255),
        "phone" varchar(30),
        "is_active" boolean NOT NULL DEFAULT true
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_branches_code" ON "branches" ("code")`,
    );

    // 2. Add branch_id to existing tables
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "branch_id" uuid REFERENCES "branches"("id") ON DELETE SET NULL;
      ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "branch_id" uuid REFERENCES "branches"("id") ON DELETE SET NULL;
      ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "branch_id" uuid REFERENCES "branches"("id") ON DELETE SET NULL;
      ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "branch_id" uuid REFERENCES "branches"("id") ON DELETE SET NULL;
      ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "branch_id" uuid REFERENCES "branches"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_students_branch" ON "students" ("branch_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_classes_branch" ON "classes" ("branch_id")`,
    );

    // 3. Seed default branches
    await queryRunner.query(`
      INSERT INTO "branches" ("id", "name", "code", "address", "phone", "is_active")
      VALUES
        ('11111111-1111-1111-1111-111111111111', 'Nordic International School - Bosh Bino', 'MAIN', 'Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko''chasi', '+998 71 200 00 00', true),
        ('22222222-2222-2222-2222-222222222222', 'Nordic International School - Yunusobod Filiali', 'YUNUSOBOD', 'Toshkent sh., Yunusobod tumani, Amir Temur ko''chasi', '+998 71 200 00 01', true)
      ON CONFLICT ("code") DO NOTHING;
    `);

    // Assign existing data to MAIN branch
    await queryRunner.query(`
      UPDATE "students" SET "branch_id" = '11111111-1111-1111-1111-111111111111' WHERE "branch_id" IS NULL;
      UPDATE "classes" SET "branch_id" = '11111111-1111-1111-1111-111111111111' WHERE "branch_id" IS NULL;
      UPDATE "rooms" SET "branch_id" = '11111111-1111-1111-1111-111111111111' WHERE "branch_id" IS NULL;
      UPDATE "payments" SET "branch_id" = '11111111-1111-1111-1111-111111111111' WHERE "branch_id" IS NULL;
    `);

    // 4. payment_transactions (Payme, Click)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_transactions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "provider" varchar(20) NOT NULL,
        "provider_trans_id" varchar(100) NOT NULL,
        "student_id" uuid NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
        "student_code" varchar(20) NOT NULL,
        "amount" numeric(14, 2) NOT NULL,
        "state" int NOT NULL DEFAULT 0,
        "status" varchar(20) NOT NULL DEFAULT 'PENDING',
        "payment_record_id" uuid REFERENCES "payments"("id") ON DELETE SET NULL,
        "perform_time" TIMESTAMPTZ,
        "cancel_time" TIMESTAMPTZ,
        "reason" int,
        "meta" jsonb
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_payment_transactions_provider_trans"
        ON "payment_transactions" ("provider", "provider_trans_id");
      CREATE INDEX IF NOT EXISTS "idx_payment_transactions_student"
        ON "payment_transactions" ("student_id");
      CREATE INDEX IF NOT EXISTS "idx_payment_transactions_status"
        ON "payment_transactions" ("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_transactions" CASCADE`);
    await queryRunner.query(`
      ALTER TABLE "payments" DROP COLUMN IF EXISTS "branch_id";
      ALTER TABLE "rooms" DROP COLUMN IF EXISTS "branch_id";
      ALTER TABLE "classes" DROP COLUMN IF EXISTS "branch_id";
      ALTER TABLE "students" DROP COLUMN IF EXISTS "branch_id";
      ALTER TABLE "users" DROP COLUMN IF EXISTS "branch_id";
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "branches" CASCADE`);
  }
}
