import { DomainError } from '@domain/errors/domain-error';
import { InvalidStateTransitionError } from '@domain/errors/invalid-state-transition.error';

describe('InvalidStateTransitionError (Unit)', () => {
  it('should extend DomainError', () => {
    const error = new InvalidStateTransitionError(
      'Cannot transition from COMPLETED to IN_PROGRESS',
    );

    expect(error).toBeInstanceOf(DomainError);
  });

  it('should have code INVALID_STATE_TRANSITION', () => {
    const error = new InvalidStateTransitionError('Invalid transition');

    expect(error.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('should have correct message', () => {
    const message = 'Cannot start job: current status is COMPLETED';
    const error = new InvalidStateTransitionError(message);

    expect(error.message).toBe(message);
  });

  it('should support state information', () => {
    const error = new InvalidStateTransitionError('Invalid transition', 'COMPLETED', 'IN_PROGRESS');

    expect(error.currentState).toBe('COMPLETED');
    expect(error.attemptedState).toBe('IN_PROGRESS');
  });

  it('should serialize with state information', () => {
    const error = new InvalidStateTransitionError('Cannot transition', 'FAILED', 'PENDING');

    const json = error.toJSON();

    expect(json.currentState).toBe('FAILED');
    expect(json.attemptedState).toBe('PENDING');
  });

  it('should serialize without state information when not provided', () => {
    const error = new InvalidStateTransitionError('Invalid state');

    const json = error.toJSON();

    expect(json.currentState).toBeUndefined();
    expect(json.attemptedState).toBeUndefined();
  });

  it('should be catchable as InvalidStateTransitionError', () => {
    try {
      throw new InvalidStateTransitionError('Cannot transition', 'COMPLETED', 'IN_PROGRESS');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidStateTransitionError);
      expect((err as InvalidStateTransitionError).currentState).toBe('COMPLETED');
    }
  });
});
