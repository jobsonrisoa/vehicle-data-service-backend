import { Injectable, Inject } from '@nestjs/common';
import { ConfirmChannel } from 'amqplib';
import { PinoLogger } from 'nestjs-pino';

import { IEventPublisherPort } from '@application/ports/output/event-publisher.port';
import { DomainEvent } from '@domain/events/domain-event';
import { PublishError } from '@domain/errors/publish-error';

@Injectable()
export class RabbitMQEventPublisher implements IEventPublisherPort {
  private readonly exchange = 'vehicle.events';

  constructor(
    @Inject('RABBITMQ_CHANNEL') private readonly channel: ConfirmChannel,
    private readonly logger: PinoLogger,
  ) {}

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    try {
      const routingKey = this.getRoutingKey(event.eventType);
      const message = this.serializeEvent(event);

      this.logger.debug(
        { eventType: event.eventType, eventId: event.eventId, aggregateId: event.aggregateId },
        'Publishing event',
      );

      const published = this.channel.publish(this.exchange, routingKey, Buffer.from(message), {
        persistent: true,
        timestamp: Date.now(),
        contentType: 'application/json',
        messageId: event.eventId,
        type: event.eventType,
      });

      if (!published) {
        throw new PublishError('Channel buffer full');
      }

      await this.channel.waitForConfirms();

      this.logger.info({ eventType: event.eventType, eventId: event.eventId }, 'Event published successfully');
    } catch (error) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          eventType: event.eventType,
          eventId: event.eventId,
        },
        'Failed to publish event',
      );
      throw new PublishError('Failed to publish event', error as Error);
    }
  }

  async publishWithRetry<T extends DomainEvent>(event: T, maxRetries = 3): Promise<void> {
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        await this.publish(event);
        return;
      } catch (error) {
        attempt += 1;
        if (attempt >= maxRetries) {
          throw error;
        }
      }
    }
  }

  async publishMany<T extends DomainEvent>(events: T[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  private getRoutingKey(eventType: string): string {
    return eventType;
  }

  private serializeEvent(event: DomainEvent): string {
    return JSON.stringify({
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      occurredAt: event.occurredAt.toISOString(),
      payload: event.payload,
    });
  }
}

