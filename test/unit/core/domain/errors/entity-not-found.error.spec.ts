import { DomainError } from '@domain/errors/domain-error';
import { EntityNotFoundError } from '@domain/errors/entity-not-found.error';

describe('EntityNotFoundError (Unit)', () => {
  it('should extend DomainError', () => {
    const error = new EntityNotFoundError('VehicleMake', '123');

    expect(error).toBeInstanceOf(DomainError);
  });

  it('should have code ENTITY_NOT_FOUND', () => {
    const error = new EntityNotFoundError('VehicleMake', '123');

    expect(error.code).toBe('ENTITY_NOT_FOUND');
  });

  it('should format message correctly', () => {
    const error = new EntityNotFoundError('VehicleMake', '440');

    expect(error.message).toBe('VehicleMake with id 440 not found');
  });

  it('should expose entityName', () => {
    const error = new EntityNotFoundError('IngestionJob', 'job-123');

    expect(error.entityName).toBe('IngestionJob');
  });

  it('should expose entityId', () => {
    const error = new EntityNotFoundError('VehicleMake', 'make-456');

    expect(error.entityId).toBe('make-456');
  });

  it('should serialize with entity information', () => {
    const error = new EntityNotFoundError('VehicleType', '789');

    const json = error.toJSON();

    expect(json.entityName).toBe('VehicleType');
    expect(json.entityId).toBe('789');
    expect(json.message).toBe('VehicleType with id 789 not found');
  });

  it('should be catchable as EntityNotFoundError', () => {
    try {
      throw new EntityNotFoundError('VehicleMake', '999');
    } catch (err) {
      expect(err).toBeInstanceOf(EntityNotFoundError);
      expect((err as EntityNotFoundError).entityName).toBe('VehicleMake');
      expect((err as EntityNotFoundError).entityId).toBe('999');
    }
  });
});
