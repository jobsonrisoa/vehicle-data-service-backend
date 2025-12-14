import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { DatabaseConfig } from './database.config';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const dbConfig = configService.get<DatabaseConfig>('database');

  if (!dbConfig) {
    throw new Error('Database configuration is not available');
  }

  const baseConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    entities: [__dirname + '/../**/*.orm-entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    synchronize: false,
    logging: dbConfig.logging,
    poolSize: dbConfig.poolSize,
    ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
  };

  if (dbConfig.url) {
    return {
      ...baseConfig,
      url: dbConfig.url,
    };
  }

  return {
    ...baseConfig,
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    extra: {
      max: dbConfig.poolSize,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
  };
};

