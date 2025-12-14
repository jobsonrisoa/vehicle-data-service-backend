import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  poolSize: number;
  ssl: boolean;
  logging: boolean;
}

export default registerAs('database', (): DatabaseConfig => {
  const nodeEnv = process.env.NODE_ENV || 'development';

  return {
    url: process.env.DATABASE_URL || '',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'vehicle_makes_db',
    poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
    ssl: process.env.DATABASE_SSL === 'true',
    logging: nodeEnv === 'development',
  };
});

