import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import databaseConfig from '@infrastructure/config/database.config';
import { getDatabaseConfig } from '@infrastructure/config/database-typeorm.config';

describe('Database Connection (Integration)', () => {
  let dataSource: DataSource;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [databaseConfig],
          isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: getDatabaseConfig,
        }),
      ],
    }).compile();

    dataSource = moduleRef.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
    await moduleRef.close();
  });

  it('should initialize database connection', () => {
    expect(dataSource).toBeDefined();
    expect(dataSource.isInitialized).toBe(true);
  });

  it('should execute a simple query', async () => {
    const result = await dataSource.query('SELECT 1 as result');

    expect(result).toBeDefined();
    expect(result[0].result).toBe(1);
  });
});

