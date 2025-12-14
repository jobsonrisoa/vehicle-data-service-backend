import { DomainEvent } from '@domain/events/domain-event';

class TestEvent extends DomainEvent<{ key: string }> {
  constructor(aggregateId: string, payload: { key: string }) {
    super(aggregateId, 'test.event', payload);
  }
}

describe('DomainEvent (Unit)', () => {
  it('should have unique eventId', () => {
    const event1 = new TestEvent('agg-1', { key: 'a' });
    const event2 = new TestEvent('agg-1', { key: 'b' });

    expect(event1.eventId).toBeDefined();
    expect(event2.eventId).toBeDefined();
    expect(event1.eventId).not.toBe(event2.eventId);
  });

  it('should have occurredAt timestamp', () => {
    const beforeCreate = new Date();
    const event = new TestEvent('agg-1', { key: 'a' });
    const afterCreate = new Date();

    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(event.occurredAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });

  it('should have aggregateId', () => {
    const event = new TestEvent('agg-123', { key: 'x' });

    expect(event.aggregateId).toBe('agg-123');
  });

  it('should have eventType', () => {
    const event = new TestEvent('agg-1', { key: 'x' });

    expect(event.eventType).toBe('test.event');
  });

  it('should have eventVersion defaulting to 1', () => {
    const event = new TestEvent('agg-1', { key: 'x' });

    expect(event.eventVersion).toBe(1);
  });

  it('should expose payload', () => {
    const payload = { key: 'value' };
    const event = new TestEvent('agg-1', payload);

    expect(event.payload).toEqual(payload);
  });

  it('should serialize to JSON', () => {
    const payload = { key: 'value' };
    const event = new TestEvent('agg-123', payload);

    const json = event.toJSON();

    expect(json).toEqual({
      eventId: event.eventId,
      eventType: 'test.event',
      aggregateId: 'agg-123',
      occurredAt: event.occurredAt.toISOString(),
      eventVersion: 1,
      payload: { key: 'value' },
    });
  });
});
