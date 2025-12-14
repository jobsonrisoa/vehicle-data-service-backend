import { DataSource } from 'typeorm';
import { setupTestDatabase, teardownTestDatabase } from '@test/testcontainers/test-database';

describe('Sample Integration Test', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should connect to test database', async () => {
    const result = await dataSource.query('SELECT 1 as value');
    expect(result[0].value).toBe(1);
  });
});
