import { IngestionJobMapper } from '@infrastructure/adapters/secondary/persistence/mappers/ingestion-job.mapper';
import { IngestionJobOrmEntity } from '@infrastructure/adapters/secondary/persistence/entities';
import { IngestionJob } from '@domain/entities/ingestion-job.entity';
import { IngestionError } from '@domain/value-objects/ingestion-error.vo';
import { IngestionStatus } from '@domain/enums/ingestion-status.enum';
import { JobId } from '@domain/value-objects/job-id.vo';

describe('IngestionJobMapper (Unit)', () => {
  describe('toDomain', () => {
    it('maps ORM entity to domain entity', () => {
      const ormEntity = new IngestionJobOrmEntity();
      ormEntity.id = '123e4567-e89b-12d3-a456-426614174000';
      ormEntity.status = 'PENDING';
      ormEntity.startedAt = new Date('2025-01-01T00:00:00Z');
      ormEntity.completedAt = null;
      ormEntity.totalMakes = 100;
      ormEntity.processedMakes = 0;
      ormEntity.failedMakes = 0;
      ormEntity.errors = [];
      ormEntity.createdAt = new Date('2025-01-01T00:00:00Z');

      const domain = IngestionJobMapper.toDomain(ormEntity);

      expect(domain).toBeInstanceOf(IngestionJob);
      expect(domain.id).toBeInstanceOf(JobId);
      expect(domain.id.value).toBe(ormEntity.id);
      expect(domain.status).toBe(IngestionStatus.PENDING);
      expect(domain.startedAt).toEqual(ormEntity.startedAt);
      expect(domain.completedAt).toBeNull();
      expect(domain.totalMakes).toBe(100);
      expect(domain.processedMakes).toBe(0);
      expect(domain.failedMakes).toBe(0);
      expect(domain.errors).toEqual([]);
    });

    it('parses errors from JSONB', () => {
      const ormEntity = new IngestionJobOrmEntity();
      ormEntity.id = '123e4567-e89b-12d3-a456-426614174000';
      ormEntity.status = 'FAILED';
      ormEntity.startedAt = new Date('2025-01-01T00:00:00Z');
      ormEntity.completedAt = new Date('2025-01-01T00:05:00Z');
      ormEntity.totalMakes = 2;
      ormEntity.processedMakes = 1;
      ormEntity.failedMakes = 1;
      ormEntity.errors = [
        {
          makeId: 440,
          message: 'Network timeout',
          timestamp: '2025-01-01T00:00:00Z',
        },
      ];
      ormEntity.createdAt = new Date('2025-01-01T00:00:00Z');

      const domain = IngestionJobMapper.toDomain(ormEntity);

      expect(domain.errors).toHaveLength(1);
      expect(domain.errors[0].makeId).toBe(440);
      expect(domain.errors[0].errorMessage).toBe('Network timeout');
      expect(domain.failedMakes).toBe(1);
    });

    it('throws on unknown status', () => {
      const ormEntity = new IngestionJobOrmEntity();
      ormEntity.id = '123e4567-e89b-12d3-a456-426614174000';
      ormEntity.status = 'UNKNOWN';
      ormEntity.startedAt = new Date();
      ormEntity.completedAt = null;
      ormEntity.totalMakes = 0;
      ormEntity.processedMakes = 0;
      ormEntity.failedMakes = 0;
      ormEntity.errors = [];
      ormEntity.createdAt = new Date();

      expect(() => IngestionJobMapper.toDomain(ormEntity)).toThrow('Unknown job status: UNKNOWN');
    });
  });

  describe('toORM', () => {
    it('maps domain entity to ORM entity', () => {
      const jobId = JobId.fromString('123e4567-e89b-12d3-a456-426614174000');
      const domain = IngestionJob.reconstitute({
        id: jobId,
        status: IngestionStatus.PENDING,
        startedAt: new Date('2025-01-01T00:00:00Z'),
        completedAt: null,
        totalMakes: 100,
        processedMakes: 0,
        failedMakes: 0,
        errors: [],
      });

      const ormEntity = IngestionJobMapper.toORM(domain);

      expect(ormEntity).toBeInstanceOf(IngestionJobOrmEntity);
      expect(ormEntity.id).toBe(jobId.value);
      expect(ormEntity.status).toBe('PENDING');
      expect(ormEntity.startedAt).toEqual(domain.startedAt);
      expect(ormEntity.completedAt).toEqual(domain.completedAt);
      expect(ormEntity.totalMakes).toBe(100);
      expect(ormEntity.processedMakes).toBe(0);
      expect(ormEntity.failedMakes).toBe(0);
      expect(ormEntity.errors).toEqual([]);
    });

    it('serializes errors to JSONB', () => {
      const jobId = JobId.fromString('123e4567-e89b-12d3-a456-426614174000');
      const domain = IngestionJob.reconstitute({
        id: jobId,
        status: IngestionStatus.FAILED,
        startedAt: new Date('2025-01-01T00:00:00Z'),
        completedAt: new Date('2025-01-01T00:05:00Z'),
        totalMakes: 2,
        processedMakes: 1,
        failedMakes: 1,
        errors: [IngestionError.create(440, 'Network timeout')],
      });

      const ormEntity = IngestionJobMapper.toORM(domain);

      expect(ormEntity.errors).toHaveLength(1);
      expect(ormEntity.errors[0]).toMatchObject({
        makeId: 440,
        message: 'Network timeout',
      });
    });

    it('round-trips ORM -> Domain -> ORM', () => {
      const ormEntity = new IngestionJobOrmEntity();
      ormEntity.id = '123e4567-e89b-12d3-a456-426614174000';
      ormEntity.status = 'COMPLETED';
      ormEntity.startedAt = new Date('2025-01-01T00:00:00Z');
      ormEntity.completedAt = new Date('2025-01-01T00:10:00Z');
      ormEntity.totalMakes = 3;
      ormEntity.processedMakes = 3;
      ormEntity.failedMakes = 0;
      ormEntity.errors = [];
      ormEntity.createdAt = new Date('2025-01-01T00:00:00Z');

      const domain = IngestionJobMapper.toDomain(ormEntity);
      const roundTrip = IngestionJobMapper.toORM(domain);

      expect(roundTrip.id).toBe(ormEntity.id);
      expect(roundTrip.status).toBe(ormEntity.status);
      expect(roundTrip.totalMakes).toBe(ormEntity.totalMakes);
      expect(roundTrip.processedMakes).toBe(ormEntity.processedMakes);
      expect(roundTrip.failedMakes).toBe(ormEntity.failedMakes);
    });
  });
});

