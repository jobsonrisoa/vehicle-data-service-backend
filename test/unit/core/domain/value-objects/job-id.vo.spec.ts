import { JobId } from '@domain/value-objects/job-id.vo';
import { ValidationError } from '@domain/errors/validation-error';

describe('JobId (Unit)', () => {
  describe('create', () => {
    it('should create a valid JobId with UUID', () => {
      const jobId = JobId.create();

      expect(jobId).toBeInstanceOf(JobId);
      expect(jobId.value).toBeDefined();
      expect(jobId.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should create unique IDs on each call', () => {
      const id1 = JobId.create();
      const id2 = JobId.create();

      expect(id1.value).not.toBe(id2.value);
    });
  });

  describe('fromString', () => {
    it('should create JobId from valid UUID string', () => {
      const uuid = '323e4567-e89b-12d3-a456-426614174000';
      const jobId = JobId.fromString(uuid);

      expect(jobId.value).toBe(uuid);
    });

    it('should throw ValidationError for invalid UUID', () => {
      expect(() => JobId.fromString('invalid-uuid')).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty string', () => {
      expect(() => JobId.fromString('')).toThrow(ValidationError);
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const uuid = '323e4567-e89b-12d3-a456-426614174000';
      const id1 = JobId.fromString(uuid);
      const id2 = JobId.fromString(uuid);

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different value', () => {
      const id1 = JobId.create();
      const id2 = JobId.create();

      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the UUID string', () => {
      const uuid = '323e4567-e89b-12d3-a456-426614174000';
      const jobId = JobId.fromString(uuid);

      expect(jobId.toString()).toBe(uuid);
    });
  });
});
