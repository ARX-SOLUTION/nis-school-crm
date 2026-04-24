import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * V2 Week 1 — Telegram Login & Foundation
 *
 * Applies four additive, backward-compatible changes to a v1.0 database:
 *
 * 1. Extend the `users_role_enum` Postgres type with the value 'PARENT'.
 *    PARENT sits outside the SUPER_ADMIN > ADMIN > MANAGER > TEACHER staff
 *    hierarchy and is used exclusively by the parent portal.
 *
 * 2. Add new nullable / defaulted columns to `users`:
 *    - telegram_first_name  varchar(64)  nullable
 *    - telegram_last_name   varchar(64)  nullable
 *    - telegram_photo_url   varchar(500) nullable
 *    - language             varchar(5)   NOT NULL DEFAULT 'uz'
 *      with a CHECK constraint limiting values to ('uz', 'ru', 'en')
 *
 * 3. Create the `parent_invites` table: single-use time-limited tokens that
 *    a manager issues to invite a guardian and link them to a student. Token
 *    generation belongs in the service layer:
 *      `crypto.randomBytes(32).toString('hex')` → 64 hex chars, 256 bits.
 *
 * 4. Create the `parent_students` table: explicit M:N join between PARENT-role
 *    users and the students they are authorised to see.
 *
 * down() notes
 * ============
 * Removing an enum value in Postgres requires re-creating the type and
 * re-casting the column, which WILL FAIL if any row has role = 'PARENT'.
 * Rather than risk silent data loss, down() leaves the enum value in place
 * and emits a RAISE NOTICE explaining what manual cleanup is required before
 * a re-run can succeed.  All other changes (new columns, new tables) are
 * fully reversible.
 */
export class V2Week1TelegramLoginFoundation1745366440000 implements MigrationInterface {
  name = 'V2Week1TelegramLoginFoundation1745366440000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ------------------------------------------------------------------ //
    // 1. Extend the role enum with PARENT                                  //
    // ------------------------------------------------------------------ //
    // PostgreSQL forbids `ALTER TYPE ... ADD VALUE` inside a transaction
    // block, and TypeORM wraps every migration in one. Rather than split
    // migrations or fight the CLI, recreate the enum via the standard
    // cast-to-text dance — fully transactional.
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE text USING "role"::text`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
    await queryRunner.query(
      `CREATE TYPE "users_role_enum" AS ENUM ('SUPER_ADMIN','ADMIN','MANAGER','TEACHER','PARENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "users_role_enum" USING "role"::"users_role_enum"`,
    );

    // ------------------------------------------------------------------ //
    // 2. New nullable / defaulted columns on users                        //
    // ------------------------------------------------------------------ //
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "telegram_first_name" varchar(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "telegram_last_name" varchar(64)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "telegram_photo_url" varchar(500)`,
    );
    // language: NOT NULL with a default so all existing rows get 'uz' automatically.
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "language" varchar(5) NOT NULL DEFAULT 'uz'`,
    );
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD CONSTRAINT "chk_users_language"
        CHECK ("language" IN ('uz', 'ru', 'en'))
    `);

    // ------------------------------------------------------------------ //
    // 3. parent_invites                                                   //
    // ------------------------------------------------------------------ //
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "parent_invites" (
        "id"               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at"       TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "deleted_at"       TIMESTAMPTZ,

        -- 64-char hex token: crypto.randomBytes(32).toString('hex')
        "token"            varchar(64)  NOT NULL,

        "student_id"       uuid         NOT NULL,
        "parent_name"      varchar(200),
        "relationship"     varchar(30),
        "created_by_id"    uuid         NOT NULL,
        "expires_at"       TIMESTAMPTZ  NOT NULL,
        "used_at"          TIMESTAMPTZ,
        "used_by_user_id"  uuid,

        CONSTRAINT "uq_parent_invites_token"
          UNIQUE ("token"),
        CONSTRAINT "chk_parent_invites_relationship"
          CHECK ("relationship" IN ('FATHER', 'MOTHER', 'GUARDIAN', 'OTHER')),
        CONSTRAINT "fk_parent_invites_student"
          FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_parent_invites_created_by"
          FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_parent_invites_used_by"
          FOREIGN KEY ("used_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // Regular index on student_id (for listing invites per student)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_parent_invites_student"
       ON "parent_invites" ("student_id")`,
    );

    // Index on expires_at (used by cleanup/expiry jobs)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_parent_invites_expires_at"
       ON "parent_invites" ("expires_at")`,
    );

    // Partial index: invite-lookup path only touches unused, non-deleted rows.
    // This keeps the index small and the lookup fast even with a large history
    // of consumed invites.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_parent_invites_token_active"
       ON "parent_invites" ("token")
       WHERE "used_at" IS NULL AND "deleted_at" IS NULL`,
    );

    // ------------------------------------------------------------------ //
    // 4. parent_students                                                  //
    // ------------------------------------------------------------------ //
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "parent_students" (
        "id"              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at"      TIMESTAMPTZ,

        "parent_user_id"  uuid        NOT NULL,
        "student_id"      uuid        NOT NULL,
        "relationship"    varchar(30),
        "is_primary"      boolean     NOT NULL DEFAULT false,

        CONSTRAINT "uq_parent_students_parent_student"
          UNIQUE ("parent_user_id", "student_id"),
        CONSTRAINT "chk_parent_students_relationship"
          CHECK ("relationship" IN ('FATHER', 'MOTHER', 'GUARDIAN', 'OTHER')),
        CONSTRAINT "fk_parent_students_parent_user"
          FOREIGN KEY ("parent_user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_parent_students_student"
          FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_parent_students_parent_user"
       ON "parent_students" ("parent_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_parent_students_student"
       ON "parent_students" ("student_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ------------------------------------------------------------------ //
    // 4. Drop parent_students                                             //
    // ------------------------------------------------------------------ //
    await queryRunner.query(`DROP TABLE IF EXISTS "parent_students"`);

    // ------------------------------------------------------------------ //
    // 3. Drop parent_invites                                              //
    // ------------------------------------------------------------------ //
    await queryRunner.query(`DROP TABLE IF EXISTS "parent_invites"`);

    // ------------------------------------------------------------------ //
    // 2. Remove user columns                                              //
    // ------------------------------------------------------------------ //
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_users_language"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "language"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "telegram_photo_url"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "telegram_last_name"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "telegram_first_name"`);

    // ------------------------------------------------------------------ //
    // 1. PARENT enum value — intentional no-op                           //
    // ------------------------------------------------------------------ //
    // Postgres does not support DROP VALUE on an enum without re-creating the
    // type and re-casting every column that uses it.  Re-creating the type
    // will FAIL if any row still has role = 'PARENT'.  To avoid silent data
    // loss this migration leaves the enum value in place and emits a notice.
    // Manual steps required before this down() can be extended:
    //   1. DELETE FROM users WHERE role = 'PARENT';
    //   2. Re-create users_role_enum without 'PARENT'.
    //   3. ALTER TABLE users ALTER COLUMN role TYPE "users_role_enum" USING role::text::"users_role_enum";
    await queryRunner.query(`
      DO $$
      BEGIN
        RAISE NOTICE
          'V2Week1TelegramLoginFoundation down(): the PARENT value has NOT been '
          'removed from users_role_enum because Postgres cannot drop an enum value '
          'without recreating the type. Manual cleanup required: '
          '(1) DELETE FROM users WHERE role = ''PARENT''; '
          '(2) Recreate the enum type without PARENT; '
          '(3) Re-cast the users.role column.';
      END
      $$
    `);
  }
}
