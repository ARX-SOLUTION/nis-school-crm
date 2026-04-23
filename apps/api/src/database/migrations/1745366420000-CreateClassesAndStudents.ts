import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClassesAndStudents1745366420000 implements MigrationInterface {
  name = 'CreateClassesAndStudents1745366420000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "students_status_enum" AS ENUM ('ACTIVE', 'INACTIVE', 'GRADUATED')
    `);
    await queryRunner.query(`
      CREATE TYPE "students_gender_enum" AS ENUM ('MALE', 'FEMALE')
    `);

    await queryRunner.query(`
      CREATE TABLE "classes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "name" varchar(20) NOT NULL,
        "grade_level" int NOT NULL,
        "academic_year" varchar(10) NOT NULL,
        "class_teacher_id" uuid,
        "max_students" int NOT NULL DEFAULT 30,
        "room_number" varchar(20),
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "uq_classes_name_year" UNIQUE ("name", "academic_year"),
        CONSTRAINT "chk_classes_grade_level" CHECK ("grade_level" BETWEEN 1 AND 11),
        CONSTRAINT "chk_classes_max_students" CHECK ("max_students" > 0),
        CONSTRAINT "fk_classes_teacher" FOREIGN KEY ("class_teacher_id")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_classes_academic_year" ON "classes" ("academic_year")`,
    );
    await queryRunner.query(`CREATE INDEX "idx_classes_teacher" ON "classes" ("class_teacher_id")`);

    // A monotonic sequence is the simplest atomic counter across concurrent
    // writes; padding + academic-year prefix yield codes like NIS-2026-00001.
    await queryRunner.query(`CREATE SEQUENCE "students_code_seq" START 1 INCREMENT 1`);

    await queryRunner.query(`
      CREATE TABLE "students" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "student_code" varchar(20) NOT NULL,
        "first_name" varchar(100) NOT NULL,
        "last_name" varchar(100) NOT NULL,
        "middle_name" varchar(100),
        "birth_date" date NOT NULL,
        "gender" "students_gender_enum",
        "grade_level" int NOT NULL,
        "class_id" uuid,
        "status" "students_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "parent_full_name" varchar(200),
        "parent_phone" varchar(20),
        "parent_telegram" varchar(100),
        "address" text,
        "blood_group" varchar(5),
        "medical_notes" text,
        "enrolled_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "left_at" TIMESTAMPTZ,
        "left_reason" varchar(500),
        CONSTRAINT "uq_students_code" UNIQUE ("student_code"),
        CONSTRAINT "chk_students_grade_level" CHECK ("grade_level" BETWEEN 1 AND 11),
        CONSTRAINT "fk_students_class" FOREIGN KEY ("class_id")
          REFERENCES "classes"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_students_class" ON "students" ("class_id") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(`CREATE INDEX "idx_students_status" ON "students" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_students_grade" ON "students" ("grade_level")`);

    await queryRunner.query(`
      CREATE TABLE "student_class_history" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "student_id" uuid NOT NULL,
        "class_id" uuid NOT NULL,
        "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "removed_at" TIMESTAMPTZ,
        "assigned_by" uuid,
        "reason" varchar(255),
        CONSTRAINT "fk_sch_student" FOREIGN KEY ("student_id")
          REFERENCES "students"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_sch_class" FOREIGN KEY ("class_id")
          REFERENCES "classes"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_sch_assigned_by" FOREIGN KEY ("assigned_by")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_sch_student" ON "student_class_history" ("student_id")`,
    );
    await queryRunner.query(`CREATE INDEX "idx_sch_class" ON "student_class_history" ("class_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "student_class_history"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "students"`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS "students_code_seq"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "classes"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "students_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "students_gender_enum"`);
  }
}
