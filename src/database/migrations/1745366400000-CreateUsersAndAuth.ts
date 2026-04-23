import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersAndAuth1745366400000 implements MigrationInterface {
  name = 'CreateUsersAndAuth1745366400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'TEACHER')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "email" varchar(150) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "full_name" varchar(200) NOT NULL,
        "phone" varchar(20),
        "role" "users_role_enum" NOT NULL,
        "telegram_chat_id" bigint,
        "telegram_username" varchar(100),
        "is_active" boolean NOT NULL DEFAULT true,
        "must_change_password" boolean NOT NULL DEFAULT true,
        "last_login_at" TIMESTAMPTZ,
        CONSTRAINT "uq_users_email" UNIQUE ("email"),
        CONSTRAINT "uq_users_telegram_chat_id" UNIQUE ("telegram_chat_id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_users_email" ON "users" ("email") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(`CREATE INDEX "idx_users_role" ON "users" ("role")`);

    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "user_id" uuid NOT NULL,
        "token_hash" varchar(64) NOT NULL,
        "family_id" uuid NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "revoked" boolean NOT NULL DEFAULT false,
        "revoked_at" TIMESTAMPTZ,
        "replaced_by" uuid,
        "user_agent" varchar(500),
        "ip_address" varchar(45),
        CONSTRAINT "fk_refresh_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_refresh_token_hash" ON "refresh_tokens" ("token_hash")`,
    );
    await queryRunner.query(`CREATE INDEX "idx_refresh_user" ON "refresh_tokens" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_refresh_family" ON "refresh_tokens" ("family_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}
