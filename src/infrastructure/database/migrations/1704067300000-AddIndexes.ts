import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexes1704067300000 implements MigrationInterface {
  name = 'AddIndexes1704067300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "IDX_vehicle_makes_make_id"
      ON "vehicle_makes" ("make_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vehicle_makes_make_name"
      ON "vehicle_makes" ("make_name")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vehicle_types_vehicle_make_id"
      ON "vehicle_types" ("vehicle_make_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vehicle_types_type_id"
      ON "vehicle_types" ("type_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ingestion_jobs_status"
      ON "ingestion_jobs" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ingestion_jobs_started_at"
      ON "ingestion_jobs" ("started_at" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_ingestion_jobs_errors"
      ON "ingestion_jobs" USING GIN ("errors")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_ingestion_jobs_errors"`);
    await queryRunner.query(`DROP INDEX "IDX_ingestion_jobs_started_at"`);
    await queryRunner.query(`DROP INDEX "IDX_ingestion_jobs_status"`);
    await queryRunner.query(`DROP INDEX "IDX_vehicle_types_type_id"`);
    await queryRunner.query(`DROP INDEX "IDX_vehicle_types_vehicle_make_id"`);
    await queryRunner.query(`DROP INDEX "IDX_vehicle_makes_make_name"`);
    await queryRunner.query(`DROP INDEX "IDX_vehicle_makes_make_id"`);
  }
}

