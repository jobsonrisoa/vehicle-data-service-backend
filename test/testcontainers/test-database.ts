import { DataSource } from 'typeorm';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

let container: StartedPostgreSqlContainer;
let dataSource: DataSource;

export async function setupTestDatabase(): Promise<DataSource> {
  container = await new PostgreSqlContainer('postgres:15-alpine')
    .withDatabase('test_db')
    .withUsername('test')
    .withPassword('test')
    .start();

  dataSource = new DataSource({
    type: 'postgres',
    host: container.getHost(),
    port: container.getPort(),
    username: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
    entities: [],
    synchronize: true,
  });

  await dataSource.initialize();
  return dataSource;
}

export async function teardownTestDatabase(): Promise<void> {
  if (dataSource) {
    await dataSource.destroy();
  }
  if (container) {
    await container.stop();
  }
}

export function getTestDataSource(): DataSource {
  if (!dataSource) {
    throw new Error('Test data source not initialized');
  }
  return dataSource;
}
