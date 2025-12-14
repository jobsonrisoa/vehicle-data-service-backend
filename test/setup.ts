import 'reflect-metadata';
import { jest } from '@jest/globals';

jest.setTimeout(30000);

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
process.env.RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';

afterAll(async (): Promise<void> => {
  // place for global cleanup hooks
});
