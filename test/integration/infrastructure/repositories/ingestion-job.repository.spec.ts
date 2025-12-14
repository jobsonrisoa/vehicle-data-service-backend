import { IngestionJobRepository } from '@infrastructure/adapters/secondary/persistence/repositories/ingestion-job.repository';
import {
  createTestDatabase,
  cleanupTestDatabase,
  clearDatabase,
  TestDatabase,
} from '@test/helpers/testcontainers/postgres.helper';
import { IngestionJob } from '@domain/entities/ingestion-job.entity';
import { IngestionStatus } from '@domain/enums/ingestion-status.enum';
import { JobId } from '@domain/value-objects/job-id.vo';

describe('IngestionJobRepository (Integration - Testcontainers)', () => {
  let testDb: TestDatabase;
  let repository: IngestionJobRepository;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    repository = new IngestionJobRepository(testDb.dataSource);
  }, 60000);

  afterAll(async () => {
    await cleanupTestDatabase(testDb);
  });

  beforeEach(async () => {
    await clearDatabase(testDb.dataSource);
  });

  describe('save', () => {
    it('persists a new ingestion job', async () => {
      const job = IngestionJob.create();
      job.start(100);

      await repository.save(job);

      const result = await repository.findById(job.id);
      expect(result).not.toBeNull();
      expect(result!.id.equals(job.id)).toBe(true);
      expect(result!.status).toBe(IngestionStatus.IN_PROGRESS);
      expect(result!.totalMakes).toBe(100);
    });

    it('updates an existing ingestion job', async () => {
      const job = IngestionJob.create();
      job.start(100);
      await repository.save(job);

      const retrieved = await repository.findById(job.id);
      retrieved!.incrementProcessed();
      await repository.save(retrieved!);

      const updated = await repository.findById(job.id);
      expect(updated!.processedMakes).toBe(1);
      expect(updated!.status).toBe(IngestionStatus.IN_PROGRESS);
    });

    it('persists job with errors in JSONB', async () => {
      const job = IngestionJob.create();
      job.start(100);
      job.recordFailure(440, 'Network timeout');

      await repository.save(job);

      const result = await repository.findById(job.id);
      expect(result!.errors).toHaveLength(1);
      expect(result!.errors[0].makeId).toBe(440);
      expect(result!.errors[0].errorMessage).toBe('Network timeout');
    });

    it('persists job with completed status and timestamp', async () => {
      const job = IngestionJob.create();
      job.start(100);
      job.complete();

      await repository.save(job);

      const result = await repository.findById(job.id);
      expect(result!.status).toBe(IngestionStatus.COMPLETED);
      expect(result!.completedAt).not.toBeNull();
      expect(result!.completedAt).toBeInstanceOf(Date);
    });

    it('preserves all counter fields', async () => {
      const job = IngestionJob.create();
      job.start(100);
      for (let i = 0; i < 95; i += 1) {
        job.incrementProcessed();
      }
      for (let i = 0; i < 5; i += 1) {
        job.recordFailure(1000 + i, `err-${i}`);
      }

      await repository.save(job);

      const result = await repository.findById(job.id);
      expect(result!.totalMakes).toBe(100);
      expect(result!.processedMakes).toBe(95);
      expect(result!.failedMakes).toBe(5);
    });
  });

  describe('findById', () => {
    it('returns job when found', async () => {
      const job = IngestionJob.create();
      job.start(50);
      await repository.save(job);

      const result = await repository.findById(job.id);

      expect(result).not.toBeNull();
      expect(result!.id.equals(job.id)).toBe(true);
      expect(result!.status).toBe(IngestionStatus.IN_PROGRESS);
    });

    it('returns null when not found', async () => {
      const result = await repository.findById(JobId.create());
      expect(result).toBeNull();
    });

    it('preserves timestamps', async () => {
      const job = IngestionJob.create();
      await repository.save(job);

      const result = await repository.findById(job.id);
      expect(result!.startedAt).toBeInstanceOf(Date);
      expect(result!.completedAt).toBeNull();
    });
  });

  describe('findLatest', () => {
    it('returns most recent job by startedAt', async () => {
      const older = IngestionJob.reconstitute({
        id: JobId.create(),
        status: IngestionStatus.COMPLETED,
        totalMakes: 50,
        processedMakes: 50,
        failedMakes: 0,
        errors: [],
        startedAt: new Date('2025-01-01T00:00:00Z'),
        completedAt: new Date('2025-01-01T01:00:00Z'),
      });

      const newer = IngestionJob.reconstitute({
        id: JobId.create(),
        status: IngestionStatus.PENDING,
        totalMakes: 0,
        processedMakes: 0,
        failedMakes: 0,
        errors: [],
        startedAt: new Date('2025-01-02T00:00:00Z'),
        completedAt: null,
      });

      await repository.save(older);
      await repository.save(newer);

      const result = await repository.findLatest();
      expect(result!.id.equals(newer.id)).toBe(true);
    });

    it('returns null when no jobs exist', async () => {
      const result = await repository.findLatest();
      expect(result).toBeNull();
    });
  });

  describe('findByStatus', () => {
    beforeEach(async () => {
      const pending = IngestionJob.create();
      const inProgress = IngestionJob.create();
      const completed = IngestionJob.create();
      const failed = IngestionJob.create();

      inProgress.start(10);
      completed.start(5);
      completed.complete();
      failed.fail('boom');

      await repository.save(pending);
      await repository.save(inProgress);
      await repository.save(completed);
      await repository.save(failed);
    });

    it('returns jobs with matching status', async () => {
      const pendingJobs = await repository.findByStatus(IngestionStatus.PENDING);
      expect(pendingJobs).toHaveLength(1);
      expect(pendingJobs[0].status).toBe(IngestionStatus.PENDING);

      const inProgressJobs = await repository.findByStatus(IngestionStatus.IN_PROGRESS);
      expect(inProgressJobs).toHaveLength(1);
      expect(inProgressJobs[0].status).toBe(IngestionStatus.IN_PROGRESS);

      const completedJobs = await repository.findByStatus(IngestionStatus.COMPLETED);
      expect(completedJobs).toHaveLength(1);

      const failedJobs = await repository.findByStatus(IngestionStatus.FAILED);
      expect(failedJobs).toHaveLength(1);
    });

    it('orders results by startedAt DESC', async () => {
      const older = IngestionJob.reconstitute({
        id: JobId.create(),
        status: IngestionStatus.COMPLETED,
        totalMakes: 10,
        processedMakes: 10,
        failedMakes: 0,
        errors: [],
        startedAt: new Date('2025-01-01T00:00:00Z'),
        completedAt: new Date('2025-01-01T01:00:00Z'),
      });
      const newer = IngestionJob.reconstitute({
        id: JobId.create(),
        status: IngestionStatus.COMPLETED,
        totalMakes: 20,
        processedMakes: 20,
        failedMakes: 0,
        errors: [],
        startedAt: new Date('2025-01-02T00:00:00Z'),
        completedAt: new Date('2025-01-02T01:00:00Z'),
      });

      await clearDatabase(testDb.dataSource);
      await repository.save(older);
      await repository.save(newer);

      const results = await repository.findByStatus(IngestionStatus.COMPLETED);
      expect(results).toHaveLength(2);
      expect(results[0].id.equals(newer.id)).toBe(true);
      expect(results[1].id.equals(older.id)).toBe(true);
    });

    it('returns empty array when none match', async () => {
      await clearDatabase(testDb.dataSource);
      const results = await repository.findByStatus(IngestionStatus.PENDING);
      expect(results).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('updates job status', async () => {
      const job = IngestionJob.create();
      await repository.save(job);

      await repository.updateStatus(job.id, IngestionStatus.IN_PROGRESS);

      const result = await repository.findById(job.id);
      expect(result!.status).toBe(IngestionStatus.IN_PROGRESS);
    });

    it('throws when job not found', async () => {
      await expect(repository.updateStatus(JobId.create(), IngestionStatus.IN_PROGRESS)).rejects.toThrow(
        'IngestionJob not found',
      );
    });

    it('does not alter counters when updating status', async () => {
      const job = IngestionJob.create();
      job.start(10);
      job.incrementProcessed();
      await repository.save(job);

      await repository.updateStatus(job.id, IngestionStatus.COMPLETED);

      const result = await repository.findById(job.id);
      expect(result!.processedMakes).toBe(1);
      expect(result!.status).toBe(IngestionStatus.COMPLETED);
    });
  });

  describe('hasRunningJob', () => {
    it('returns true when an IN_PROGRESS job exists', async () => {
      const job = IngestionJob.create();
      job.start(5);
      await repository.save(job);

      const result = await repository.hasRunningJob();
      expect(result).toBe(true);
    });

    it('returns false when no running job exists', async () => {
      const result = await repository.hasRunningJob();
      expect(result).toBe(false);
    });
  });

  describe('findAll / count / delete', () => {
    it('returns all jobs ordered by startedAt DESC', async () => {
      const job1 = IngestionJob.create();
      const job2 = IngestionJob.create();
      job1.start(10);
      job2.start(20);
      await repository.save(job1);
      await repository.save(job2);

      const results = await repository.findAll();
      expect(results).toHaveLength(2);
      expect(results[0].startedAt.getTime()).toBeGreaterThanOrEqual(results[1].startedAt.getTime());
    });

    it('returns total count', async () => {
      const job1 = IngestionJob.create();
      const job2 = IngestionJob.create();
      await repository.save(job1);
      await repository.save(job2);

      const count = await repository.count();
      expect(count).toBe(2);
    });

    it('deletes a job', async () => {
      const job = IngestionJob.create();
      await repository.save(job);

      await repository.delete(job.id);

      const result = await repository.findById(job.id);
      expect(result).toBeNull();
    });
  });
});

