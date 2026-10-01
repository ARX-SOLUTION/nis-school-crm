import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationPrefsToUsers1745366500000 implements MigrationInterface {
  name = 'AddNotificationPrefsToUsers1745366500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "notification_prefs" jsonb NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "notification_prefs"`);
  }
}
