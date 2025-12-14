import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1704067200000 implements MigrationInterface {
  name = 'InitialSchema1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`
      CREATE TABLE "vehicle_makes" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "make_id" INTEGER NOT NULL,
        "make_name" VARCHAR(255) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehicle_makes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_vehicle_makes_make_id" UNIQUE ("make_id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "vehicle_types" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "type_id" INTEGER NOT NULL,
        "type_name" VARCHAR(255) NOT NULL,
        "vehicle_make_id" UUID NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vehicle_types" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_vehicle_types_type_make" UNIQUE ("type_id", "vehicle_make_id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "ingestion_jobs" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        "started_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "completed_at" TIMESTAMP WITH TIME ZONE,
        "total_makes" INTEGER NOT NULL DEFAULT 0,
        "processed_makes" INTEGER NOT NULL DEFAULT 0,
        "failed_makes" INTEGER NOT NULL DEFAULT 0,
        "errors" JSONB NOT NULL DEFAULT '[]',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ingestion_jobs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_types"
      ADD CONSTRAINT "FK_vehicle_types_vehicle_make"
      FOREIGN KEY ("vehicle_make_id")
      REFERENCES "vehicle_makes"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicle_types" DROP CONSTRAINT "FK_vehicle_types_vehicle_make"`);
    await queryRunner.query(`DROP TABLE "ingestion_jobs"`);
    await queryRunner.query(`DROP TABLE "vehicle_types"`);
    await queryRunner.query(`DROP TABLE "vehicle_makes"`);
  }
}

