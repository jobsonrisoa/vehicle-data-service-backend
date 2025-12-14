import { DomainError } from './domain-error';

export class ExternalApiError extends DomainError {
  constructor(message: string, public readonly cause?: unknown) {
    super(message, 'EXTERNAL_API_ERROR');
  }
}

