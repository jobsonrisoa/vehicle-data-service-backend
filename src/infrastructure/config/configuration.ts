import { z } from 'zod';

import { configurationSchema, Configuration } from './configuration.schema';

export function loadConfiguration(): Configuration {
  const config = {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    logLevel: process.env.LOG_LEVEL,
    database: {
      url: process.env.DATABASE_URL,
      poolSize: process.env.DATABASE_POOL_SIZE,
    },
    rabbitmq: {
      url: process.env.RABBITMQ_URL,
      queuePrefix: process.env.RABBITMQ_QUEUE_PREFIX,
    },
    redis: {
      url: process.env.REDIS_URL,
    },
    nhtsa: {
      baseUrl: process.env.NHTSA_API_BASE_URL,
      timeout: process.env.NHTSA_API_TIMEOUT,
      retryAttempts: process.env.NHTSA_API_RETRY_ATTEMPTS,
    },
    ingestion: {
      batchSize: process.env.INGESTION_BATCH_SIZE,
      concurrency: process.env.INGESTION_CONCURRENCY,
    },
  };

  try {
    return configurationSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
      throw new Error(`Configuration validation failed:\n${errorMessages}`);
    }
    throw error;
  }
}
