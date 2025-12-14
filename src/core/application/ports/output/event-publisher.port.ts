import { DomainEvent } from '@domain/events/domain-event';

export interface IEventPublisherPort {
  publish<T extends DomainEvent>(event: T): Promise<void>;
  publishMany<T extends DomainEvent>(events: T[]): Promise<void>;
  publishWithRetry<T extends DomainEvent>(event: T, maxRetries?: number): Promise<void>;
}
