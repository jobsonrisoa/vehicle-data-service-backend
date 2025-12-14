import { DomainError } from './domain-error';

export class PublishError extends DomainError {
  constructor(message: string, public readonly cause?: Error) {
    super(message, 'PUBLISH_ERROR');
  }
}

