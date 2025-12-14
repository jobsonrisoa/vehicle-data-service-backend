import { Test } from '@nestjs/testing';

import { IngestionResolver } from '@infrastructure/adapters/primary/graphql/resolvers/ingestion.resolver';
import { IIngestDataPort } from '@core/application/ports/input/ingest-data.port';
import { IngestionStatus } from '@domain/enums/ingestion-status.enum';

describe('IngestionResolver', () => {
  let resolver: IngestionResolver;
  let ingestPort: jest.Mocked<IIngestDataPort>;

  const createJob = () => ({
    id: 'job-123',
    status: IngestionStatus.IN_PROGRESS,
    startedAt: new Date('2024-01-01T00:00:00Z'),
    completedAt: null,
    totalMakes: 100,
    processedMakes: 40,
    failedMakes: 10,
    errors: [
      { makeId: 1, message: 'err1', timestamp: new Date('2024-01-01T00:00:01Z') },
      { makeId: 2, message: 'err2', timestamp: new Date('2024-01-01T00:00:02Z') },
    ],
  });

  beforeEach(async () => {
    ingestPort = {
      triggerIngestion: jest.fn(),
      getCurrentIngestion: jest.fn(),
      getIngestionStatus: jest.fn(),
      getIngestionHistory: jest.fn(),
    } as any;

    const moduleRef = await Test.createTestingModule({
      providers: [
        IngestionResolver,
        {
          provide: 'IIngestDataPort',
          useValue: ingestPort,
        },
      ],
    }).compile();

    resolver = moduleRef.get(IngestionResolver);
  });

  describe('triggerIngestion', () => {
    it('triggers ingestion and returns job data', async () => {
      const job = createJob();
      ingestPort.triggerIngestion.mockResolvedValue(job as any);

      const result = await resolver.triggerIngestion({ req: { headers: {} } } as any);

      expect(result).toMatchObject({
        id: job.id,
        status: job.status,
        totalMakes: job.totalMakes,
        processedMakes: job.processedMakes,
        failedMakes: job.failedMakes,
        progress: 50,
        errors: ['err1', 'err2'],
      });
      expect(ingestPort.triggerIngestion).toHaveBeenCalled();
    });

    it('throws when ingestion already in progress', async () => {
      ingestPort.triggerIngestion.mockRejectedValue(new Error('Ingestion already in progress'));

      await expect(resolver.triggerIngestion({ req: { headers: {} } } as any)).rejects.toThrow(
        'Ingestion already in progress'
      );
    });

    it('rejects when api key is missing', async () => {
      const originalKey = process.env.INGESTION_API_KEY;
      process.env.INGESTION_API_KEY = 'secret';

      try {
        await expect(resolver.triggerIngestion({ req: { headers: {} } } as any)).rejects.toThrow('Unauthorized');
        expect(ingestPort.triggerIngestion).not.toHaveBeenCalled();
      } finally {
        process.env.INGESTION_API_KEY = originalKey;
      }
    });
  });

  describe('ingestionStatus', () => {
    it('returns current ingestion status', async () => {
      const job = createJob();
      ingestPort.getCurrentIngestion.mockResolvedValue(job as any);

      const result = await resolver.ingestionStatus();

      expect(result).toMatchObject({
        id: job.id,
        status: job.status,
        progress: 50,
        errors: ['err1', 'err2'],
      });
      expect(ingestPort.getCurrentIngestion).toHaveBeenCalled();
    });

    it('returns null when no job is running', async () => {
      ingestPort.getCurrentIngestion.mockResolvedValue(null);

      const result = await resolver.ingestionStatus();

      expect(result).toBeNull();
    });
  });

  describe('ingestionJob', () => {
    it('returns ingestion job by id', async () => {
      const job = createJob();
      ingestPort.getIngestionStatus.mockResolvedValue(job as any);

      const result = await resolver.ingestionJob('job-123');

      expect(result).toMatchObject({
        id: job.id,
        status: job.status,
        progress: 50,
        errors: ['err1', 'err2'],
      });
      expect(ingestPort.getIngestionStatus).toHaveBeenCalledWith('job-123');
    });

    it('returns null when job not found', async () => {
      ingestPort.getIngestionStatus.mockResolvedValue(null);

      const result = await resolver.ingestionJob('missing');

      expect(result).toBeNull();
    });
  });
});

