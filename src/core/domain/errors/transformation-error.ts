import { DomainError } from './domain-error';

export class TransformationError extends DomainError {
  constructor(message: string) {
    super(message, 'TRANSFORMATION_ERROR');
    this.name = 'TransformationError';
  }
}

