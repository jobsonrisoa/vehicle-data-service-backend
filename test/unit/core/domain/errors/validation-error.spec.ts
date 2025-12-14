import { DomainError } from '@domain/errors/domain-error';
import { ValidationError } from '@domain/errors/validation-error';

describe('ValidationError (Unit)', () => {
  it('should extend DomainError', () => {
    const error = new ValidationError('Invalid input');

    expect(error).toBeInstanceOf(DomainError);
  });

  it('should have code VALIDATION_ERROR', () => {
    const error = new ValidationError('Invalid input');

    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('should have correct message', () => {
    const error = new ValidationError('Email is required');

    expect(error.message).toBe('Email is required');
  });

  it('should support field information', () => {
    const error = new ValidationError('Invalid value', 'email');

    expect(error.field).toBe('email');
  });

  it('should serialize with field when provided', () => {
    const error = new ValidationError('Must be positive', 'age');

    const json = error.toJSON();

    expect(json.field).toBe('age');
    expect(json.message).toBe('Must be positive');
  });

  it('should serialize without field when not provided', () => {
    const error = new ValidationError('General validation error');

    const json = error.toJSON();

    expect(json.field).toBeUndefined();
  });

  it('should be catchable as ValidationError', () => {
    try {
      throw new ValidationError('Invalid');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).code).toBe('VALIDATION_ERROR');
    }
  });
});
