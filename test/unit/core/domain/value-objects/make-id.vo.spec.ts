import { MakeId } from '@domain/value-objects/make-id.vo';
import { ValidationError } from '@domain/errors/validation-error';

describe('MakeId (Unit)', () => {
  describe('create', () => {
    it('should create a valid MakeId with UUID', () => {
      const makeId = MakeId.create();

      expect(makeId).toBeInstanceOf(MakeId);
      expect(makeId.value).toBeDefined();
      expect(makeId.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should create unique IDs on each call', () => {
      const id1 = MakeId.create();
      const id2 = MakeId.create();

      expect(id1.value).not.toBe(id2.value);
    });
  });

  describe('fromString', () => {
    it('should create MakeId from valid UUID string', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const makeId = MakeId.fromString(uuid);

      expect(makeId.value).toBe(uuid);
    });

    it('should throw ValidationError for invalid UUID', () => {
      expect(() => MakeId.fromString('invalid-uuid')).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty string', () => {
      expect(() => MakeId.fromString('')).toThrow(ValidationError);
    });

    it('should throw ValidationError for null', () => {
      expect(() => MakeId.fromString(null as unknown as string)).toThrow(ValidationError);
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const id1 = MakeId.fromString(uuid);
      const id2 = MakeId.fromString(uuid);

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different value', () => {
      const id1 = MakeId.create();
      const id2 = MakeId.create();

      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the UUID string', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const makeId = MakeId.fromString(uuid);

      expect(makeId.toString()).toBe(uuid);
    });
  });

  describe('value getter', () => {
    it('should expose the UUID value', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const makeId = MakeId.fromString(uuid);

      expect(makeId.value).toBe(uuid);
    });
  });
});
