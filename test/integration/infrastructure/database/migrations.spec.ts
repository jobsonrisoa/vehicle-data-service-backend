import { DataSource } from 'typeorm';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

import { InitialSchema1704067200000 } from '@infrastructure/database/migrations/1704067200000-InitialSchema';
import { AddIndexes1704067300000 } from '@infrastructure/database/migrations/1704067300000-AddIndexes';

describe('Database Migrations (Integration)', () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:15-alpine').start();
    dataSource = new DataSource({
      type: 'postgres',
      host: container.getHost(),
      port: container.getPort(),
      username: container.getUsername(),
      password: container.getPassword(),
      database: container.getDatabase(),
      migrations: [InitialSchema1704067200000, AddIndexes1704067300000],
      synchronize: false,
      logging: false,
    });
    await dataSource.initialize();
  }, 60000);

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      while ((await dataSource.query(`SELECT COUNT(*)::int AS count FROM migrations`))[0].count > 0) {
        await dataSource.undoLastMigration();
      }
      await dataSource.destroy();
    }
    if (container) {
      await container.stop();
    }
  });

  beforeEach(async () => {
    await dataSource.runMigrations();
  });

  afterEach(async () => {
    const result = await dataSource.query(`SELECT COUNT(*)::int AS count FROM migrations`);
    let remaining = result[0].count as number;
    while (remaining > 0) {
      await dataSource.undoLastMigration();
      remaining -= 1;
    }
  });

  it('creates base tables', async () => {
    const tables = await dataSource.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const names = tables.map((t: any) => t.table_name);
    expect(names).toContain('vehicle_makes');
    expect(names).toContain('vehicle_types');
    expect(names).toContain('ingestion_jobs');
  });

  it('sets vehicle_makes schema', async () => {
    const columns = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'vehicle_makes'
      ORDER BY ordinal_position
    `);
    const names = columns.map((c: any) => c.column_name);
    expect(names).toEqual(
      expect.arrayContaining(['id', 'make_id', 'make_name', 'created_at', 'updated_at']),
    );
    const makeId = columns.find((c: any) => c.column_name === 'make_id');
    expect(makeId.data_type).toBe('integer');
    expect(makeId.is_nullable).toBe('NO');
  });

  it('creates foreign key for vehicle_types', async () => {
    const foreignKeys = await dataSource.query(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.table_name = 'vehicle_types'
      AND tc.constraint_type = 'FOREIGN KEY'
    `);
    expect(foreignKeys).toHaveLength(1);
    expect(foreignKeys[0]).toMatchObject({
      column_name: 'vehicle_make_id',
      foreign_table_name: 'vehicle_makes',
      foreign_column_name: 'id',
      delete_rule: 'CASCADE',
    });
  });

  it('creates ingestion_jobs errors as jsonb', async () => {
    const columns = await dataSource.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'ingestion_jobs'
      AND column_name = 'errors'
    `);
    expect(columns).toHaveLength(1);
    expect(columns[0].data_type).toBe('jsonb');
    expect(columns[0].column_default).toContain('[]');
  });

  it('enforces unique constraints', async () => {
    const uniqueConstraints = await dataSource.query(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        kcu.column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'UNIQUE'
      AND tc.table_name IN ('vehicle_makes', 'vehicle_types')
      ORDER BY tc.table_name, kcu.ordinal_position
    `);
    const makesUnique = uniqueConstraints.filter((c: any) => c.table_name === 'vehicle_makes');
    const typesUnique = uniqueConstraints.filter((c: any) => c.table_name === 'vehicle_types');
    expect(makesUnique.some((c: any) => c.column_name === 'make_id')).toBe(true);
    expect(typesUnique.some((c: any) => c.column_name === 'type_id')).toBe(true);
  });

  it('creates indexes', async () => {
    const indexes = await dataSource.query(`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('vehicle_makes', 'vehicle_types', 'ingestion_jobs')
      ORDER BY tablename, indexname
    `);
    const names = indexes.map((i: any) => i.indexname);
    expect(names).toEqual(
      expect.arrayContaining([
        'IDX_vehicle_makes_make_id',
        'IDX_vehicle_makes_make_name',
        'IDX_vehicle_types_vehicle_make_id',
        'IDX_vehicle_types_type_id',
        'IDX_ingestion_jobs_status',
        'IDX_ingestion_jobs_started_at',
        'IDX_ingestion_jobs_errors',
      ]),
    );
    const startedAtIndex = indexes.find((i: any) => i.indexname === 'IDX_ingestion_jobs_started_at');
    expect(startedAtIndex.indexdef).toContain('DESC');
    const ginIndex = indexes.find((i: any) => i.indexname === 'IDX_ingestion_jobs_errors');
    expect(ginIndex.indexdef).toContain('USING gin');
  });

  it('rolls back migrations', async () => {
    await dataSource.undoLastMigration();
    await dataSource.undoLastMigration();
    const tables = await dataSource.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);
    const names = tables.map((t: any) => t.table_name);
    expect(names).not.toContain('vehicle_makes');
    expect(names).not.toContain('vehicle_types');
    expect(names).not.toContain('ingestion_jobs');
    await dataSource.runMigrations();
  });

  it('supports data operations after migrations', async () => {
    await dataSource.query(`
      INSERT INTO vehicle_makes (make_id, make_name)
      VALUES (440, 'ASTON MARTIN')
    `);
    const makeResult = await dataSource.query(`
      SELECT id FROM vehicle_makes WHERE make_id = 440
    `);
    const makeId = makeResult[0].id;
    await dataSource.query(
      `
      INSERT INTO vehicle_types (type_id, type_name, vehicle_make_id)
      VALUES (2, 'Passenger Car', $1)
    `,
      [makeId],
    );
    const types = await dataSource.query(
      `
      SELECT * FROM vehicle_types WHERE vehicle_make_id = $1
    `,
      [makeId],
    );
    expect(types).toHaveLength(1);
    await dataSource.query(
      `
      DELETE FROM vehicle_makes WHERE id = $1
    `,
      [makeId],
    );
    const remaining = await dataSource.query(
      `
      SELECT * FROM vehicle_types WHERE vehicle_make_id = $1
    `,
      [makeId],
    );
    expect(remaining).toHaveLength(0);
  });
});

