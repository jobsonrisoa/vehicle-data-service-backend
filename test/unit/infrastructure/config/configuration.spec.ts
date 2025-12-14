import { loadConfiguration } from '@infrastructure/config/configuration';

describe('Configuration (Unit)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {};
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('loadConfiguration', () => {
    it('should load valid configuration', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3000';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.RABBITMQ_URL = 'amqp://localhost:5672';
      process.env.LOG_LEVEL = 'info';

      const config = loadConfiguration();

      expect(config.nodeEnv).toBe('development');
      expect(config.port).toBe(3000);
      expect(config.database.url).toBe('postgresql://localhost:5432/test');
    });

    it('should apply default values', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.RABBITMQ_URL = 'amqp://localhost:5672';
      delete process.env.LOG_LEVEL;

      const config = loadConfiguration();

      expect(config.port).toBe(3000);
      expect(config.logLevel).toBe('info');
      expect(config.database.poolSize).toBe(10);
    });

    it('should throw error for missing required fields', () => {
      process.env.NODE_ENV = 'development';
      process.env.RABBITMQ_URL = 'amqp://localhost:5672';
      delete process.env.DATABASE_URL;

      expect(() => loadConfiguration()).toThrow('Configuration validation failed');
    });

    it('should throw error for invalid NODE_ENV', () => {
      process.env.NODE_ENV = 'invalid';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.RABBITMQ_URL = 'amqp://localhost:5672';

      expect(() => loadConfiguration()).toThrow();
    });

    it('should coerce string numbers to integers', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '4000';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.DATABASE_POOL_SIZE = '20';
      process.env.RABBITMQ_URL = 'amqp://localhost:5672';

      const config = loadConfiguration();

      expect(config.port).toBe(4000);
      expect(config.database.poolSize).toBe(20);
    });
  });
});
