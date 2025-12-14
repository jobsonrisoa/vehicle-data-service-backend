import { INestApplication, Module, Global } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import 'pg';

import { AppModule } from '../../../src/app.module';
import { VehicleMakeOrmEntity } from '../../../src/infrastructure/adapters/secondary/persistence/entities/vehicle-make.orm-entity';
import { VehicleTypeOrmEntity } from '../../../src/infrastructure/adapters/secondary/persistence/entities/vehicle-type.orm-entity';
import { IngestionJobOrmEntity } from '../../../src/infrastructure/adapters/secondary/persistence/entities/ingestion-job.orm-entity';
import { GraphQLModule } from '../../../src/infrastructure/adapters/primary/graphql/graphql.module';
import { IngestionJobDTO } from '../../../src/core/application/dtos/ingestion-job.dto';
import { IngestionStatus } from '../../../src/core/domain/enums/ingestion-status.enum';

describe('Data Ingestion (E2E)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let mockIngestionPort: {
    triggerIngestion: jest.Mock;
    getCurrentIngestion: jest.Mock;
    getIngestionStatus: jest.Mock;
    getIngestionHistory: jest.Mock;
  };

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('vehicle_test_ingestion')
      .withUsername('test')
      .withPassword('test')
      .start();

    process.env.DATABASE_URL = container.getConnectionUri();
    process.env.RABBITMQ_URL = 'amqp://guest:guest@localhost:5672';
    process.env.NODE_ENV = 'test';
    process.env.NHTSA_API_BASE_URL = 'https://vpic.nhtsa.dot.gov';

    mockIngestionPort = {
      triggerIngestion: jest.fn(),
      getCurrentIngestion: jest.fn(),
      getIngestionStatus: jest.fn(),
      getIngestionHistory: jest.fn(),
    };

    @Global()
    @Module({
      providers: [
        {
          provide: 'IQueryVehiclesPort',
          useValue: {
            getAll: jest.fn(),
            getById: jest.fn(),
            search: jest.fn(),
            getStatistics: jest.fn(),
          },
        },
        {
          provide: 'IIngestDataPort',
          useValue: mockIngestionPort,
        },
      ],
      exports: ['IQueryVehiclesPort', 'IIngestDataPort'],
    })
    class TestProvidersModule {}

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, GraphQLModule, TestProvidersModule],
    })
      .overrideProvider('IIngestDataPort')
      .useValue(mockIngestionPort)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (container) {
      await container.stop();
    }
  });

  beforeEach(async () => {
    const makeRepo = dataSource.getRepository(VehicleMakeOrmEntity);
    const typeRepo = dataSource.getRepository(VehicleTypeOrmEntity);
    const jobRepo = dataSource.getRepository(IngestionJobOrmEntity);

    await typeRepo.createQueryBuilder().delete().where('1=1').execute();
    await makeRepo.createQueryBuilder().delete().where('1=1').execute();
    await jobRepo.createQueryBuilder().delete().where('1=1').execute();

    jest.clearAllMocks();
  });

  it('triggers ingestion', async () => {
    const mockJob: IngestionJobDTO = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: IngestionStatus.PENDING,
      startedAt: new Date(),
      completedAt: null,
      totalMakes: 0,
      processedMakes: 0,
      failedMakes: 0,
      errors: [],
    };

    mockIngestionPort.triggerIngestion.mockResolvedValue(mockJob);

    const response = await request(app.getHttpServer() as import('http').Server)
      .post('/api/v1/ingestion/trigger')
      .expect(202);

    expect(response.body).toBeDefined();
    expect((response.body as { id: string }).id).toBe(mockJob.id);
    expect((response.body as { status: string }).status).toBe(IngestionStatus.PENDING);
  });

  it('returns job status by id', async () => {
    const mockJob: IngestionJobDTO = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: IngestionStatus.PENDING,
      startedAt: new Date(),
      completedAt: null,
      totalMakes: 0,
      processedMakes: 0,
      failedMakes: 0,
      errors: [],
    };

    mockIngestionPort.triggerIngestion.mockResolvedValue(mockJob);
    mockIngestionPort.getIngestionStatus.mockResolvedValue(mockJob);

    const triggerResponse = await request(app.getHttpServer() as import('http').Server)
      .post('/api/v1/ingestion/trigger')
      .expect(202);

    const jobId = (triggerResponse.body as { id: string }).id;

    const statusResponse = await request(app.getHttpServer() as import('http').Server)
      .get(`/api/v1/ingestion/jobs/${jobId}`)
      .expect(200);

    expect(statusResponse.body).toBeDefined();
    expect((statusResponse.body as { id: string }).id).toBe(jobId);
    expect((statusResponse.body as { status: string }).status).toBe(IngestionStatus.PENDING);
  });

  it('returns 404 for non-existent job', async () => {
    mockIngestionPort.getIngestionStatus.mockResolvedValue(null);

    const fakeJobId = '00000000-0000-0000-0000-000000000000';
    await request(app.getHttpServer() as import('http').Server)
      .get(`/api/v1/ingestion/jobs/${fakeJobId}`)
      .expect(404);
  });
});
