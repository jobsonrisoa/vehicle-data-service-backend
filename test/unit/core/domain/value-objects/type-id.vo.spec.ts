import { TypeId } from '@domain/value-objects/type-id.vo';
import { ValidationError } from '@domain/errors/validation-error';

describe('TypeId (Unit)', () => {
  describe('create', () => {
    it('should create a valid TypeId with UUID', () => {
      const typeId = TypeId.create();

      expect(typeId).toBeInstanceOf(TypeId);
      expect(typeId.value).toBeDefined();
      expect(typeId.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should create unique IDs on each call', () => {
      const id1 = TypeId.create();
      const id2 = TypeId.create();

      expect(id1.value).not.toBe(id2.value);
    });
  });

  describe('fromString', () => {
    it('should create TypeId from valid UUID string', () => {
      const uuid = '223e4567-e89b-12d3-a456-426614174000';
      const typeId = TypeId.fromString(uuid);

      expect(typeId.value).toBe(uuid);
    });

    it('should throw ValidationError for invalid UUID', () => {
      expect(() => TypeId.fromString('invalid-uuid')).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty string', () => {
      expect(() => TypeId.fromString('')).toThrow(ValidationError);
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const uuid = '223e4567-e89b-12d3-a456-426614174000';
      const id1 = TypeId.fromString(uuid);
      const id2 = TypeId.fromString(uuid);

      expect(id1.equals(id2)).toBe(true);
    });

    it('should return false for different value', () => {
      const id1 = TypeId.create();
      const id2 = TypeId.create();

      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the UUID string', () => {
      const uuid = '223e4567-e89b-12d3-a456-426614174000';
      const typeId = TypeId.fromString(uuid);

      expect(typeId.toString()).toBe(uuid);
    });
  });
});
