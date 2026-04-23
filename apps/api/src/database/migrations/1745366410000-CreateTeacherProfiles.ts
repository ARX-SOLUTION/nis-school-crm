import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTeacherProfiles1745366410000 implements MigrationInterface {
  name = 'CreateTeacherProfiles1745366410000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "teacher_profiles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "user_id" uuid NOT NULL,
        "subject" varchar(100),
        "experience_years" int NOT NULL DEFAULT 0,
        "education" varchar(500),
        "bio" text,
        CONSTRAINT "fk_teacher_profiles_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_teacher_profiles_user" ON "teacher_profiles" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "teacher_profiles"`);
  }
}
