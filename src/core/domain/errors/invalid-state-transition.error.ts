import { DomainError } from './domain-error';

export class InvalidStateTransitionError extends DomainError {
  public readonly currentState?: string;
  public readonly attemptedState?: string;

  constructor(message: string, currentState?: string, attemptedState?: string) {
    super(message, 'INVALID_STATE_TRANSITION');
    this.currentState = currentState;
    this.attemptedState = attemptedState;
  }

  public toJSON(): {
    name: string;
    message: string;
    code: string;
    timestamp: string;
    stack?: string;
    currentState?: string;
    attemptedState?: string;
  } {
    return {
      ...super.toJSON(),
      ...(this.currentState && { currentState: this.currentState }),
      ...(this.attemptedState && { attemptedState: this.attemptedState }),
    };
  }
}
