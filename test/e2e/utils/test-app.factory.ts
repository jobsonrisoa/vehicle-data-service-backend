/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/require-await */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RabbitMQContainer, StartedRabbitMQContainer } from '@testcontainers/rabbitmq';
import { DataSource } from 'typeorm';

import { AppModule } from '../../../src/app.module';
import { IngestionStatus } from '../../../src/core/domain/enums/ingestion-status.enum';
import { IngestionJobDTO } from '../../../src/core/application/dtos/ingestion-job.dto';
import { clearDatabase, seedDatabase } from './seed-database';

export interface TestContext {
  app: INestApplication;
  postgresContainer: StartedPostgreSqlContainer;
  rabbitmqContainer: StartedRabbitMQContainer;
  dataSource: DataSource;
}

interface IngestionJobState {
  id: string;
  status: IngestionStatus;
  startedAt: Date;
  completedAt: Date | null;
  totalMakes: number;
  processedMakes: number;
  failedMakes: number;
  errors: Array<{ makeId: number; message: string; timestamp: Date }>;
}

export async function createTestApp(): Promise<TestContext> {
  const postgresContainer = await new PostgreSqlContainer('postgres:15-alpine')
    .withDatabase('vehicle_bdd')
    .withUsername('test')
    .withPassword('test')
    .withExposedPorts(5432)
    .start();

  const rabbitmqContainer = await new RabbitMQContainer('rabbitmq:3.12-management-alpine')
    .withExposedPorts(5672, 15672)
    .start();

  const databaseUrl = postgresContainer.getConnectionUri();
  const rabbitmqUrl = `amqp://${rabbitmqContainer.getHost()}:${rabbitmqContainer.getMappedPort(5672)}`;

  process.env.DATABASE_URL = databaseUrl;
  process.env.RABBITMQ_URL = rabbitmqUrl;
  process.env.NODE_ENV = 'test';

  let jobState: IngestionJobState | null = null;
  // eslint-disable-next-line prefer-const
  let app!: INestApplication;

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider('IIngestDataPort')
    .useFactory({
      factory: () => ({
        triggerIngestion: async (): Promise<IngestionJobDTO> => {
          if (jobState && jobState.status === IngestionStatus.IN_PROGRESS) {
            const error = new Error('Ingestion already in progress');
            (error as any).name = 'ConflictError';
            throw error;
          }

          jobState = {
            id: `job-${Date.now()}`,
            status: IngestionStatus.IN_PROGRESS,
            startedAt: new Date(),
            completedAt: null,
            totalMakes: 0,
            processedMakes: 0,
            failedMakes: 0,
            errors: [],
          };

          await clearDatabase(app);
          await seedDatabase(app);

          jobState = {
            ...jobState,
            totalMakes: 100,
            processedMakes: 100,
            status: IngestionStatus.COMPLETED,
            completedAt: new Date(),
          };

          return { ...jobState, errors: jobState.errors } as IngestionJobDTO;
        },
        getCurrentIngestion: async (): Promise<IngestionJobDTO | null> =>
          jobState as IngestionJobDTO | null,
        getIngestionStatus: async (jobId: string): Promise<IngestionJobDTO | null> => {
          if (jobState && jobState.id === jobId) {
            return jobState as IngestionJobDTO;
          }
          return null;
        },
        getIngestionHistory: async () => ({
          edges: jobState ? [{ cursor: jobState.id, node: jobState }] : [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: jobState?.id ?? null,
            endCursor: jobState?.id ?? null,
          },
          totalCount: jobState ? 1 : 0,
        }),
      }),
    })
    .compile();

  app = moduleFixture.createNestApplication();
  await app.init();
  const dataSource = app.get(DataSource);
  await dataSource.synchronize(true);

  return {
    app,
    postgresContainer,
    rabbitmqContainer,
    dataSource,
  };
}

export async function destroyTestApp(context: TestContext): Promise<void> {
  await context.dataSource.destroy();
  await context.app.close();
  await context.rabbitmqContainer.stop();
  await context.postgresContainer.stop();
}
