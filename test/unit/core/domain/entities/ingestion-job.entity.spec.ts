import { IngestionJob } from '@domain/entities/ingestion-job.entity';
import { IngestionStatus } from '@domain/enums/ingestion-status.enum';
import { InvalidStateTransitionError } from '@domain/errors/invalid-state-transition.error';
import { JobId } from '@domain/value-objects/job-id.vo';

describe('IngestionJob (Unit)', () => {
  describe('create', () => {
    it('should create job with PENDING status', () => {
      const job = IngestionJob.create();

      expect(job).toBeInstanceOf(IngestionJob);
      expect(job.status).toBe(IngestionStatus.PENDING);
    });

    it('should initialize counters to zero', () => {
      const job = IngestionJob.create();

      expect(job.totalMakes).toBe(0);
      expect(job.processedMakes).toBe(0);
      expect(job.failedMakes).toBe(0);
    });

    it('should set startedAt timestamp', () => {
      const beforeCreate = new Date();
      const job = IngestionJob.create();
      const afterCreate = new Date();

      expect(job.startedAt).toBeInstanceOf(Date);
      expect(job.startedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(job.startedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });

    it('should have null completedAt', () => {
      const job = IngestionJob.create();

      expect(job.completedAt).toBeNull();
    });

    it('should have empty errors array', () => {
      const job = IngestionJob.create();

      expect(job.errors).toEqual([]);
    });

    it('should generate unique JobId', () => {
      const job = IngestionJob.create();

      expect(job.id).toBeInstanceOf(JobId);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute IngestionJob from persistence', () => {
      const id = JobId.create();
      const startedAt = new Date('2025-01-01T00:00:00Z');
      const completedAt = new Date('2025-01-01T00:05:00Z');

      const job = IngestionJob.reconstitute({
        id,
        status: IngestionStatus.COMPLETED,
        totalMakes: 100,
        processedMakes: 100,
        failedMakes: 0,
        errors: [],
        startedAt,
        completedAt,
      });

      expect(job.id).toBe(id);
      expect(job.status).toBe(IngestionStatus.COMPLETED);
      expect(job.totalMakes).toBe(100);
      expect(job.processedMakes).toBe(100);
      expect(job.startedAt).toEqual(startedAt);
      expect(job.completedAt).toEqual(completedAt);
    });
  });

  describe('start', () => {
    it('should transition from PENDING to IN_PROGRESS', () => {
      const job = IngestionJob.create();

      job.start(100);

      expect(job.status).toBe(IngestionStatus.IN_PROGRESS);
      expect(job.totalMakes).toBe(100);
    });

    it('should set totalMakes', () => {
      const job = IngestionJob.create();

      job.start(250);

      expect(job.totalMakes).toBe(250);
    });

    it('should throw error if not in PENDING state', () => {
      const job = IngestionJob.create();
      job.start(100);

      expect(() => job.start(100)).toThrow(InvalidStateTransitionError);
      expect(() => job.start(100)).toThrow('Cannot start job: current status is IN_PROGRESS');
    });
  });

  describe('incrementProcessed', () => {
    it('should increment processedMakes counter', () => {
      const job = IngestionJob.create();
      job.start(100);

      job.incrementProcessed();
      expect(job.processedMakes).toBe(1);

      job.incrementProcessed();
      expect(job.processedMakes).toBe(2);
    });

    it('should throw error if not in IN_PROGRESS state', () => {
      const job = IngestionJob.create();

      expect(() => job.incrementProcessed()).toThrow(InvalidStateTransitionError);
    });
  });

  describe('recordFailure', () => {
    it('should increment failedMakes counter', () => {
      const job = IngestionJob.create();
      job.start(100);

      job.recordFailure(440, 'API timeout');

      expect(job.failedMakes).toBe(1);
    });

    it('should add error to errors array', () => {
      const job = IngestionJob.create();
      job.start(100);

      job.recordFailure(440, 'API timeout');

      expect(job.errors).toHaveLength(1);
      expect(job.errors[0].makeId).toBe(440);
      expect(job.errors[0].errorMessage).toBe('API timeout');
    });

    it('should throw error if not in IN_PROGRESS state', () => {
      const job = IngestionJob.create();

      expect(() => job.recordFailure(440, 'Error')).toThrow(InvalidStateTransitionError);
    });
  });

  describe('complete', () => {
    it('should transition to COMPLETED when no failures', () => {
      const job = IngestionJob.create();
      job.start(10);

      for (let i = 0; i < 10; i++) {
        job.incrementProcessed();
      }

      job.complete();

      expect(job.status).toBe(IngestionStatus.COMPLETED);
    });

    it('should transition to PARTIALLY_COMPLETED when has failures', () => {
      const job = IngestionJob.create();
      job.start(10);

      for (let i = 0; i < 8; i++) {
        job.incrementProcessed();
      }
      job.recordFailure(440, 'Error');
      job.recordFailure(441, 'Error');

      job.complete();

      expect(job.status).toBe(IngestionStatus.PARTIALLY_COMPLETED);
      expect(job.failedMakes).toBe(2);
    });

    it('should set completedAt timestamp', () => {
      const job = IngestionJob.create();
      job.start(10);
      job.incrementProcessed();

      const beforeComplete = new Date();
      job.complete();
      const afterComplete = new Date();

      expect(job.completedAt).not.toBeNull();
      expect(job.completedAt!.getTime()).toBeGreaterThanOrEqual(beforeComplete.getTime());
      expect(job.completedAt!.getTime()).toBeLessThanOrEqual(afterComplete.getTime());
    });

    it('should throw error if not in IN_PROGRESS state', () => {
      const job = IngestionJob.create();

      expect(() => job.complete()).toThrow(InvalidStateTransitionError);
    });
  });

  describe('fail', () => {
    it('should transition to FAILED', () => {
      const job = IngestionJob.create();
      job.start(100);

      job.fail('Connection refused');

      expect(job.status).toBe(IngestionStatus.FAILED);
    });

    it('should set completedAt timestamp', () => {
      const job = IngestionJob.create();
      job.start(100);

      job.fail('Connection refused');

      expect(job.completedAt).not.toBeNull();
    });

    it('should record failure reason', () => {
      const job = IngestionJob.create();
      job.start(100);

      job.fail('Connection refused');

      expect(job.errors).toHaveLength(1);
      expect(job.errors[0].errorMessage).toBe('Connection refused');
    });

    it('should work from PENDING state', () => {
      const job = IngestionJob.create();

      job.fail('Pre-start failure');

      expect(job.status).toBe(IngestionStatus.FAILED);
    });
  });

  describe('getProgress', () => {
    it('should return progress percentage', () => {
      const job = IngestionJob.create();
      job.start(100);

      for (let i = 0; i < 50; i++) {
        job.incrementProcessed();
      }

      expect(job.getProgress()).toBe(50);
    });

    it('should return 0 when totalMakes is 0', () => {
      const job = IngestionJob.create();

      expect(job.getProgress()).toBe(0);
    });

    it('should return 100 when all processed', () => {
      const job = IngestionJob.create();
      job.start(10);

      for (let i = 0; i < 10; i++) {
        job.incrementProcessed();
      }

      expect(job.getProgress()).toBe(100);
    });

    it('should include failures in progress', () => {
      const job = IngestionJob.create();
      job.start(100);

      for (let i = 0; i < 50; i++) {
        job.incrementProcessed();
      }
      for (let i = 0; i < 25; i++) {
        job.recordFailure(i, 'Error');
      }

      expect(job.getProgress()).toBe(75);
    });
  });

  describe('state machine invariants', () => {
    it('should not allow transition from COMPLETED', () => {
      const job = IngestionJob.create();
      job.start(10);
      job.incrementProcessed();
      job.complete();

      expect(() => job.start(100)).toThrow(InvalidStateTransitionError);
      expect(() => job.incrementProcessed()).toThrow(InvalidStateTransitionError);
    });

    it('should not allow transition from FAILED', () => {
      const job = IngestionJob.create();
      job.start(100);
      job.fail('Error');

      expect(() => job.incrementProcessed()).toThrow(InvalidStateTransitionError);
      expect(() => job.complete()).toThrow(InvalidStateTransitionError);
    });

    it('should not allow transition from PARTIALLY_COMPLETED', () => {
      const job = IngestionJob.create();
      job.start(10);
      job.incrementProcessed();
      job.recordFailure(440, 'Error');
      job.complete();

      expect(job.status).toBe(IngestionStatus.PARTIALLY_COMPLETED);
      expect(() => job.incrementProcessed()).toThrow(InvalidStateTransitionError);
    });
  });

  describe('getDuration', () => {
    it('should return duration in milliseconds when completed', () => {
      const job = IngestionJob.create();
      job.start(10);
      job.complete();

      const duration = job.getDuration();

      expect(duration).not.toBeNull();
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should return null when not completed', () => {
      const job = IngestionJob.create();
      job.start(10);

      expect(job.getDuration()).toBeNull();
    });
  });
});
