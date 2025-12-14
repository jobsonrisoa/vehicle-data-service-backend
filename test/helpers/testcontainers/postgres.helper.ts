import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';

import {
  VehicleMakeOrmEntity,
  VehicleTypeOrmEntity,
  IngestionJobOrmEntity,
} from '@infrastructure/adapters/secondary/persistence/entities';

export interface TestDatabase {
  container: StartedPostgreSqlContainer;
  dataSource: DataSource;
}

/**
 * Spin up a PostgreSQL Testcontainer and initialize a TypeORM DataSource.
 * Uses PostgreSQL 15 Alpine for faster startup.
 */
export async function createTestDatabase(): Promise<TestDatabase> {
  const container = await new PostgreSqlContainer('postgres:15-alpine')
    .withExposedPorts(5432)
    .start();

  const dataSource = new DataSource({
    type: 'postgres',
    host: container.getHost(),
    port: container.getPort(),
    username: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
    entities: [VehicleMakeOrmEntity, VehicleTypeOrmEntity, IngestionJobOrmEntity],
    synchronize: true, // auto-create schema for tests
    logging: false,
  });

  await dataSource.initialize();

  return { container, dataSource };
}

/**
 * Cleanup resources for a given test database.
 */
export async function cleanupTestDatabase(testDb: TestDatabase): Promise<void> {
  if (testDb.dataSource?.isInitialized) {
    await testDb.dataSource.destroy();
  }
  if (testDb.container) {
    await testDb.container.stop();
  }
}

/**
 * Remove all data from every table in the connected database.
 */
export async function clearDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.query('TRUNCATE TABLE vehicle_types, vehicle_makes, ingestion_jobs RESTART IDENTITY CASCADE');
}

