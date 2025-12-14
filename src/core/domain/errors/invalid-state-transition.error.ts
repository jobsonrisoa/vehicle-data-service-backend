import { DomainError } from './domain-error';

export class InvalidStateTransitionError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
