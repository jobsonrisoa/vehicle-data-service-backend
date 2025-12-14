import { z } from 'zod';

export const configurationSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'staging', 'production']),
  port: z.coerce.number().int().positive().default(3000),
  logLevel: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  database: z.object({
    url: z.string().min(1),
    poolSize: z.coerce.number().int().positive().default(10),
  }),
  rabbitmq: z.object({
    url: z.string().min(1),
    queuePrefix: z.string().default('vehicle'),
  }),
  redis: z.object({
    url: z.string().optional(),
  }),
  nhtsa: z.object({
    baseUrl: z.string().url().default('https://vpic.nhtsa.dot.gov/api'),
    timeout: z.coerce.number().int().positive().default(30000),
    retryAttempts: z.coerce.number().int().nonnegative().default(3),
  }),
  ingestion: z.object({
    batchSize: z.coerce.number().int().positive().default(100),
    concurrency: z.coerce.number().int().positive().default(5),
  }),
});

export type Configuration = z.infer<typeof configurationSchema>;
