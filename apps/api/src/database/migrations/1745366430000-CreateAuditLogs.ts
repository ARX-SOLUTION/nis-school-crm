import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogs1745366430000 implements MigrationInterface {
  name = 'CreateAuditLogs1745366430000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "user_id" uuid,
        "action" varchar(50) NOT NULL,
        "entity_type" varchar(50),
        "entity_id" uuid,
        "old_data" jsonb,
        "new_data" jsonb,
        "ip_address" varchar(45),
        "user_agent" varchar(500),
        "status_code" int,
        CONSTRAINT "fk_audit_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_audit_user" ON "audit_logs" ("user_id")`);
    await queryRunner.query(
      `CREATE INDEX "idx_audit_entity" ON "audit_logs" ("entity_type", "entity_id")`,
    );
    await queryRunner.query(`CREATE INDEX "idx_audit_created" ON "audit_logs" ("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
  }
}
