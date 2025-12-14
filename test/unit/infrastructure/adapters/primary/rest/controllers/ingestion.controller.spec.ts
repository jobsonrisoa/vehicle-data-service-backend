import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { IngestionController } from '@infrastructure/adapters/primary/rest/controllers/ingestion.controller';
import { IIngestDataPort, ConflictError } from '@core/application/ports/input/ingest-data.port';
import { IngestionStatus } from '@domain/enums/ingestion-status.enum';

describe('IngestionController', () => {
  let controller: IngestionController;
  let ingestPort: jest.Mocked<IIngestDataPort>;

  const job = {
    id: 'job-123',
    status: IngestionStatus.IN_PROGRESS,
    startedAt: new Date('2024-01-01T00:00:00Z'),
    completedAt: null,
    totalMakes: 100,
    processedMakes: 50,
    failedMakes: 10,
    errors: [
      { makeId: 1, message: 'err1', timestamp: new Date('2024-01-01T00:00:01Z') },
      { makeId: 2, message: 'err2', timestamp: new Date('2024-01-01T00:00:02Z') },
    ],
  };

  beforeEach(async () => {
    ingestPort = {
      triggerIngestion: jest.fn(),
      getCurrentIngestion: jest.fn(),
      getIngestionStatus: jest.fn(),
      getIngestionHistory: jest.fn(),
    } as any;

    const moduleRef = await Test.createTestingModule({
      controllers: [IngestionController],
      providers: [
        {
          provide: 'IIngestDataPort',
          useValue: ingestPort,
        },
      ],
    }).compile();

    controller = moduleRef.get(IngestionController);
  });

  describe('triggerIngestion', () => {
    it('returns ingestion job', async () => {
      ingestPort.triggerIngestion.mockResolvedValue(job as any);

      const result = await controller.triggerIngestion();

      expect(result).toMatchObject({
        id: job.id,
        status: job.status,
        totalMakes: job.totalMakes,
        processedMakes: job.processedMakes,
        failedMakes: job.failedMakes,
        progress: 60,
        errors: ['err1', 'err2'],
      });
    });

    it('throws conflict when already running', async () => {
      ingestPort.triggerIngestion.mockRejectedValue(new ConflictError('already in progress'));

      await expect(controller.triggerIngestion()).rejects.toThrow(ConflictException);
    });
  });

  describe('getStatus', () => {
    it('returns current job', async () => {
      ingestPort.getCurrentIngestion.mockResolvedValue(job as any);

      const result = await controller.getStatus();

      expect(result?.progress).toBe(60);
      expect(result?.errors).toEqual(['err1', 'err2']);
    });

    it('returns null when none', async () => {
      ingestPort.getCurrentIngestion.mockResolvedValue(null);

      const result = await controller.getStatus();

      expect(result).toBeNull();
    });
  });

  describe('getJob', () => {
    it('returns job by id', async () => {
      ingestPort.getIngestionStatus.mockResolvedValue(job as any);

      const result = await controller.getJob('job-123');

      expect(result.id).toBe(job.id);
      expect(result.progress).toBe(60);
    });

    it('throws not found when missing', async () => {
      ingestPort.getIngestionStatus.mockResolvedValue(null);

      await expect(controller.getJob('missing')).rejects.toThrow(NotFoundException);
    });
  });
});

