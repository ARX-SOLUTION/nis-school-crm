import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSchoolifyModules1745366470000 implements MigrationInterface {
  name = 'CreateSchoolifyModules1745366470000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. attendance_records
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "attendance_records" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "student_id" uuid NOT NULL,
        "class_id" uuid NOT NULL,
        "date" date NOT NULL,
        "status" varchar(15) NOT NULL DEFAULT 'PRESENT',
        "remarks" varchar(255),
        "recorded_by_id" uuid,
        CONSTRAINT "fk_attendance_student" FOREIGN KEY ("student_id")
          REFERENCES "students"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_attendance_class" FOREIGN KEY ("class_id")
          REFERENCES "classes"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_attendance_recorded_by" FOREIGN KEY ("recorded_by_id")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_attendance_class_date" ON "attendance_records" ("class_id", "date")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_attendance_student_date" ON "attendance_records" ("student_id", "date")`,
    );

    // 2. grades
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "grades" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "student_id" uuid NOT NULL,
        "class_id" uuid NOT NULL,
        "subject_id" uuid NOT NULL,
        "date" date NOT NULL,
        "score" numeric(5, 2) NOT NULL,
        "max_score" numeric(5, 2) NOT NULL DEFAULT 5,
        "grade_type" varchar(20) NOT NULL DEFAULT 'CLASSWORK',
        "comment" varchar(255),
        "teacher_id" uuid,
        CONSTRAINT "fk_grades_student" FOREIGN KEY ("student_id")
          REFERENCES "students"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_grades_class" FOREIGN KEY ("class_id")
          REFERENCES "classes"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_grades_subject" FOREIGN KEY ("subject_id")
          REFERENCES "subjects"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_grades_teacher" FOREIGN KEY ("teacher_id")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_grades_student_subject" ON "grades" ("student_id", "subject_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_grades_class_date" ON "grades" ("class_id", "date")`,
    );

    // 3. payments
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "student_id" uuid NOT NULL,
        "amount" numeric(14, 2) NOT NULL,
        "method" varchar(20) NOT NULL DEFAULT 'CASH',
        "status" varchar(20) NOT NULL DEFAULT 'CONFIRMED',
        "receipt_number" varchar(50) NOT NULL UNIQUE,
        "month" varchar(7) NOT NULL,
        "paid_at" TIMESTAMPTZ NOT NULL,
        "comment" text,
        CONSTRAINT "fk_payments_student" FOREIGN KEY ("student_id")
          REFERENCES "students"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_payments_student_month" ON "payments" ("student_id", "month")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_payments_month_status" ON "payments" ("month", "status")`,
    );

    // 4. leads
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "leads" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "full_name" varchar(150) NOT NULL,
        "phone" varchar(25) NOT NULL,
        "parent_name" varchar(150),
        "target_grade_level" int,
        "source" varchar(30) NOT NULL DEFAULT 'TELEGRAM',
        "stage" varchar(30) NOT NULL DEFAULT 'NEW',
        "notes" text,
        "converted_student_id" uuid
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_leads_stage" ON "leads" ("stage")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_leads_phone" ON "leads" ("phone")`);

    // 5. notification_logs
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" varchar(255) NOT NULL,
        "message" text NOT NULL,
        "type" varchar(50) NOT NULL DEFAULT 'ANNOUNCEMENT',
        "target" varchar(50) NOT NULL DEFAULT 'ALL_USERS',
        "channel" varchar(50) NOT NULL DEFAULT 'TELEGRAM',
        "recipient_count" int NOT NULL DEFAULT 0,
        "class_id" uuid,
        "sent_by_user_id" uuid,
        "sent_by_name" varchar(255),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_notification_logs_created_at" ON "notification_logs" ("created_at" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "leads"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "grades"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attendance_records"`);
  }
}
