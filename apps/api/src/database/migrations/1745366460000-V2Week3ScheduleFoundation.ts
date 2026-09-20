import { MigrationInterface, QueryRunner } from 'typeorm';

export class V2Week3ScheduleFoundation1745366460000 implements MigrationInterface {
  name = 'V2Week3ScheduleFoundation1745366460000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "schedule_entries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "class_id" uuid NOT NULL,
        "subject_id" uuid NOT NULL,
        "teacher_id" uuid NOT NULL,
        "room_id" uuid NOT NULL,
        "day_of_week" varchar(10) NOT NULL,
        "lesson_number" int NOT NULL,
        "start_time" time NOT NULL,
        "end_time" time NOT NULL,
        "effective_from" date NOT NULL,
        "effective_to" date,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "chk_schedule_entries_day_of_week" CHECK (
          "day_of_week" IN ('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY')
        ),
        CONSTRAINT "chk_schedule_entries_lesson_number" CHECK ("lesson_number" BETWEEN 1 AND 10),
        CONSTRAINT "chk_schedule_entries_time_order" CHECK ("start_time" < "end_time"),
        CONSTRAINT "fk_schedule_entries_class" FOREIGN KEY ("class_id")
          REFERENCES "classes"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_schedule_entries_subject" FOREIGN KEY ("subject_id")
          REFERENCES "subjects"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_schedule_entries_teacher" FOREIGN KEY ("teacher_id")
          REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_schedule_entries_room" FOREIGN KEY ("room_id")
          REFERENCES "rooms"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_schedule_entries_class" ON "schedule_entries" ("class_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_schedule_entries_teacher_day" ON "schedule_entries" ("teacher_id", "day_of_week")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_schedule_entries_room_day" ON "schedule_entries" ("room_id", "day_of_week")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_schedule_entries_active" ON "schedule_entries" ("is_active") WHERE "deleted_at" IS NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "schedule_substitutions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "original_entry_id" uuid NOT NULL,
        "substitute_teacher_id" uuid NOT NULL,
        "date" date NOT NULL,
        "reason" varchar(500),
        "status" varchar(20) NOT NULL DEFAULT 'CONFIRMED',
        "created_by" uuid,
        CONSTRAINT "uq_schedule_substitutions_entry_date" UNIQUE ("original_entry_id", "date"),
        CONSTRAINT "chk_schedule_substitutions_status" CHECK ("status" IN ('CONFIRMED','CANCELLED')),
        CONSTRAINT "fk_schedule_substitutions_entry" FOREIGN KEY ("original_entry_id")
          REFERENCES "schedule_entries"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_schedule_substitutions_substitute_teacher" FOREIGN KEY ("substitute_teacher_id")
          REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_schedule_substitutions_created_by" FOREIGN KEY ("created_by")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_schedule_substitutions_date" ON "schedule_substitutions" ("date")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_schedule_substitutions_teacher" ON "schedule_substitutions" ("substitute_teacher_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_schedule_substitutions_entry" ON "schedule_substitutions" ("original_entry_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "schedule_substitutions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "schedule_entries"`);
  }
}
