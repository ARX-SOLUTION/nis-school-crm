import { MigrationInterface, QueryRunner } from 'typeorm';

export class V2Week2SubjectsAndRooms1745366450000 implements MigrationInterface {
  name = 'V2Week2SubjectsAndRooms1745366450000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subjects" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "code" varchar(20) NOT NULL,
        "name" varchar(200) NOT NULL,
        "grade_levels" int[] NOT NULL DEFAULT '{}',
        "default_hours_per_week" int NOT NULL DEFAULT 2,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "uq_subjects_code" UNIQUE ("code"),
        CONSTRAINT "chk_subjects_grade_levels" CHECK (
          array_length("grade_levels", 1) IS NULL
          OR (SELECT bool_and(g BETWEEN 1 AND 11) FROM unnest("grade_levels") AS g)
        ),
        CONSTRAINT "chk_subjects_hours_per_week" CHECK ("default_hours_per_week" BETWEEN 1 AND 40)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_subjects_active" ON "subjects" ("is_active") WHERE "deleted_at" IS NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rooms" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "room_number" varchar(20) NOT NULL,
        "name" varchar(100),
        "capacity" int NOT NULL DEFAULT 30,
        "type" varchar(30) NOT NULL DEFAULT 'CLASSROOM',
        "floor" int,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "uq_rooms_room_number" UNIQUE ("room_number"),
        CONSTRAINT "chk_rooms_capacity" CHECK ("capacity" BETWEEN 1 AND 500),
        CONSTRAINT "chk_rooms_type" CHECK ("type" IN ('CLASSROOM','LAB','SPORTS','AUDITORIUM','OTHER'))
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_rooms_active" ON "rooms" ("is_active") WHERE "deleted_at" IS NULL`,
    );

    // class_subjects depends on subjects, classes, and users — created last.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "class_subjects" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "class_id" uuid NOT NULL,
        "subject_id" uuid NOT NULL,
        "teacher_id" uuid NOT NULL,
        "hours_per_week" int NOT NULL DEFAULT 2,
        "academic_year" varchar(10) NOT NULL,
        CONSTRAINT "uq_class_subjects_class_subject_year" UNIQUE ("class_id", "subject_id", "academic_year"),
        CONSTRAINT "chk_class_subjects_hours_per_week" CHECK ("hours_per_week" BETWEEN 1 AND 40),
        CONSTRAINT "chk_class_subjects_academic_year" CHECK ("academic_year" ~ '^[0-9]{4}-[0-9]{4}$'),
        CONSTRAINT "fk_class_subjects_class" FOREIGN KEY ("class_id")
          REFERENCES "classes"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_class_subjects_subject" FOREIGN KEY ("subject_id")
          REFERENCES "subjects"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_class_subjects_teacher" FOREIGN KEY ("teacher_id")
          REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_class_subjects_class" ON "class_subjects" ("class_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_class_subjects_teacher" ON "class_subjects" ("teacher_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_class_subjects_subject_year" ON "class_subjects" ("subject_id", "academic_year")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse dependency order.
    await queryRunner.query(`DROP TABLE IF EXISTS "class_subjects"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subjects"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rooms"`);
  }
}
