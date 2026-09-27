import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClubsAndActivities1745366490000 implements MigrationInterface {
  name = 'CreateClubsAndActivities1745366490000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. clubs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clubs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "name" varchar(150) NOT NULL,
        "category" varchar(50) NOT NULL,
        "description" text,
        "branch_id" uuid REFERENCES "branches"("id") ON DELETE SET NULL,
        "instructor_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "instructor_name" varchar(150),
        "instructor_phone" varchar(30),
        "room_id" uuid REFERENCES "rooms"("id") ON DELETE SET NULL,
        "capacity" int NOT NULL DEFAULT 15,
        "min_grade" int NOT NULL DEFAULT 1,
        "max_grade" int NOT NULL DEFAULT 11,
        "fee_type" varchar(20) NOT NULL DEFAULT 'FREE',
        "monthly_fee" numeric(14, 2) NOT NULL DEFAULT 0,
        "status" varchar(20) NOT NULL DEFAULT 'ACTIVE'
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_clubs_branch" ON "clubs" ("branch_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_clubs_category" ON "clubs" ("category")`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_clubs_status" ON "clubs" ("status")`);

    // 2. club_schedules table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "club_schedules" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "club_id" uuid NOT NULL REFERENCES "clubs"("id") ON DELETE CASCADE,
        "day_of_week" int NOT NULL,
        "start_time" varchar(10) NOT NULL,
        "end_time" varchar(10) NOT NULL,
        "room_id" uuid REFERENCES "rooms"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_club_schedules_club" ON "club_schedules" ("club_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_club_schedules_day_room" ON "club_schedules" ("day_of_week", "room_id")`,
    );

    // 3. club_enrollments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "club_enrollments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "club_id" uuid NOT NULL REFERENCES "clubs"("id") ON DELETE CASCADE,
        "student_id" uuid NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
        "enrolled_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "status" varchar(20) NOT NULL DEFAULT 'ACTIVE',
        "dropped_at" TIMESTAMPTZ,
        "drop_reason" varchar(255)
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_club_enrollments_club" ON "club_enrollments" ("club_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_club_enrollments_student" ON "club_enrollments" ("student_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_club_enrollments_unique_active" ON "club_enrollments" ("club_id", "student_id") WHERE "status" = 'ACTIVE' AND "deleted_at" IS NULL`,
    );

    // 4. club_attendance table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "club_attendance" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "club_id" uuid NOT NULL REFERENCES "clubs"("id") ON DELETE CASCADE,
        "student_id" uuid NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
        "date" date NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'PRESENT',
        "remarks" varchar(255),
        "recorded_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_club_attendance_club_date" ON "club_attendance" ("club_id", "date")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_club_attendance_student_date" ON "club_attendance" ("club_id", "student_id", "date") WHERE "deleted_at" IS NULL`,
    );

    // 5. Seed realistic default clubs
    await queryRunner.query(`
      INSERT INTO "clubs" (
        "id", "name", "category", "description", "branch_id",
        "instructor_name", "instructor_phone", "capacity", "min_grade", "max_grade",
        "fee_type", "monthly_fee", "status"
      ) VALUES
      (
        'a1111111-1111-1111-1111-111111111111',
        'Doira va milliy cholg''ular ansambli',
        'MUSIC_PERFORMING',
        'O''zbek milliy musiqa san''ati, doira ritmlari, dutor va milliy kuylar ijrochiligi to''garagi.',
        '11111111-1111-1111-1111-111111111111',
        'Abduvali Mirzayev',
        '+998 90 123 45 67',
        20, 1, 11, 'FREE', 0, 'ACTIVE'
      ),
      (
        'b2222222-2222-2222-2222-222222222222',
        'STEM & Robototexnika akademiyasi',
        'STEM_ROBOTICS',
        'Arduino, LEGO Spike Prime, 3D modellashtirish va avtomatlashtirilgan robotlar yasash amaliy kursi.',
        '11111111-1111-1111-1111-111111111111',
        'Sardor Rahimov',
        '+998 91 234 56 78',
        15, 3, 9, 'PAID', 350000, 'ACTIVE'
      ),
      (
        'c3333333-3333-3333-3333-333333333333',
        'Grossmeyster Shaxmat klubi',
        'SPORTS',
        'Taktik kombinatsiyalar, debatlar, xalqaro FIDE standartlari asosida mantiqiy fikrlashni rivojlantirish.',
        '11111111-1111-1111-1111-111111111111',
        'Akmal Qodirov',
        '+998 93 345 67 89',
        16, 1, 11, 'FREE', 0, 'ACTIVE'
      ),
      (
        'd4444444-4444-4444-4444-444444444444',
        'Taekwondo WTF (Olimpiya zaxiralari)',
        'SPORTS',
        'Sharq yakkakurashi, intizom, jismoniy chidamlilik va belbog'' imtihonlariga tayyorgarlik mashg''ulotlari.',
        '11111111-1111-1111-1111-111111111111',
        'Jasur Jalolov',
        '+998 97 456 78 90',
        20, 1, 8, 'PAID', 250000, 'ACTIVE'
      ),
      (
        'e5555555-5555-5555-5555-555555555555',
        'IELTS & English Speaking Club',
        'LANGUAGES',
        'Ingliz tilida erkin muloqot, munozaralar, xalqaro imtihonlarga tayyorgarlik va notiqlik mahorati.',
        '11111111-1111-1111-1111-111111111111',
        'Madina Karimova',
        '+998 99 567 89 01',
        18, 7, 11, 'FREE', 0, 'ACTIVE'
      ),
      (
        'f6666666-6666-6666-6666-666666666666',
        'Yosh rassomlar va kulolchilik',
        'ARTS_CRAFT',
        'Akvarel, moybo''yoq, kompozitsiya asoslari va kulolchilik gildan haykalchalar yasash to''garagi.',
        '11111111-1111-1111-1111-111111111111',
        'Dilnoza Zokirova',
        '+998 94 678 90 12',
        14, 1, 6, 'FREE', 0, 'ACTIVE'
      )
      ON CONFLICT ("id") DO NOTHING;
    `);

    // 6. Seed default schedules for clubs
    await queryRunner.query(`
      INSERT INTO "club_schedules" ("club_id", "day_of_week", "start_time", "end_time")
      VALUES
        -- Doira: Du, Chor, Jum 15:30 - 17:00
        ('a1111111-1111-1111-1111-111111111111', 1, '15:30', '17:00'),
        ('a1111111-1111-1111-1111-111111111111', 3, '15:30', '17:00'),
        ('a1111111-1111-1111-1111-111111111111', 5, '15:30', '17:00'),
        -- STEM: Se, Pay, Shanba 16:00 - 17:30
        ('b2222222-2222-2222-2222-222222222222', 2, '16:00', '17:30'),
        ('b2222222-2222-2222-2222-222222222222', 4, '16:00', '17:30'),
        ('b2222222-2222-2222-2222-222222222222', 6, '14:00', '15:30'),
        -- Shaxmat: Du, Chor 16:00 - 17:30
        ('c3333333-3333-3333-3333-333333333333', 1, '16:00', '17:30'),
        ('c3333333-3333-3333-3333-333333333333', 3, '16:00', '17:30'),
        -- Taekwondo: Du, Chor, Jum 17:00 - 18:30
        ('d4444444-4444-4444-4444-444444444444', 1, '17:00', '18:30'),
        ('d4444444-4444-4444-4444-444444444444', 3, '17:00', '18:30'),
        ('d4444444-4444-4444-4444-444444444444', 5, '17:00', '18:30'),
        -- English: Se, Pay 15:30 - 17:00
        ('e5555555-5555-5555-5555-555555555555', 2, '15:30', '17:00'),
        ('e5555555-5555-5555-5555-555555555555', 4, '15:30', '17:00'),
        -- Rassomlik: Se, Shanba 15:00 - 16:30
        ('f6666666-6666-6666-6666-666666666666', 2, '15:00', '16:30'),
        ('f6666666-6666-6666-6666-666666666666', 6, '15:00', '16:30')
      ON CONFLICT DO NOTHING;
    `);

    // 7. Enroll existing students if available
    await queryRunner.query(`
      INSERT INTO "club_enrollments" ("club_id", "student_id", "status")
      SELECT 'a1111111-1111-1111-1111-111111111111', id, 'ACTIVE'
      FROM "students"
      LIMIT 3
      ON CONFLICT DO NOTHING;
    `);

    await queryRunner.query(`
      INSERT INTO "club_enrollments" ("club_id", "student_id", "status")
      SELECT 'b2222222-2222-2222-2222-222222222222', id, 'ACTIVE'
      FROM "students"
      OFFSET 1
      LIMIT 2
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "club_attendance"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "club_enrollments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "club_schedules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clubs"`);
  }
}
