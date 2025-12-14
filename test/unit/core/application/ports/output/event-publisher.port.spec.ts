import { DomainEvent } from '@domain/events/domain-event';
import { IEventPublisherPort } from '@application/ports/output/event-publisher.port';

class DummyEvent extends DomainEvent<{ foo: string }> {
  constructor() {
    super('agg-1', 'test.event', { foo: 'bar' });
  }
}

describe('IEventPublisherPort (Contract)', () => {
  class DummyPublisher implements IEventPublisherPort {
    publish(): Promise<void> {
      return Promise.resolve();
    }

    publishMany(): Promise<void> {
      return Promise.resolve();
    }

    publishWithRetry(): Promise<void> {
      return Promise.resolve();
    }
  }

  it('should be implementable', async () => {
    const publisher: IEventPublisherPort = new DummyPublisher();
    await expect(publisher.publish(new DummyEvent())).resolves.toBeUndefined();
  });
});
