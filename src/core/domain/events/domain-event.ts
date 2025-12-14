import { v4 as uuidv4 } from 'uuid';

export abstract class DomainEvent<T = unknown> {
  public readonly eventId: string;
  public readonly eventType: string;
  public readonly aggregateId: string;
  public readonly occurredAt: Date;
  public readonly eventVersion: number;
  public readonly payload: T;

  protected constructor(aggregateId: string, eventType: string, payload: T, eventVersion = 1) {
    this.eventId = uuidv4();
    this.eventType = eventType;
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
    this.eventVersion = eventVersion;
    this.payload = Object.freeze(payload);
  }

  public toJSON(): {
    eventId: string;
    eventType: string;
    aggregateId: string;
    occurredAt: string;
    eventVersion: number;
    payload: T;
  } {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      occurredAt: this.occurredAt.toISOString(),
      eventVersion: this.eventVersion,
      payload: this.payload,
    };
  }
}
