import { Inject, Injectable } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RmqContext } from '@nestjs/microservices';
import { Message } from 'amqplib';
import { PinoLogger } from 'nestjs-pino';

import { DomainEvent } from '@domain/events/domain-event';

@Injectable()
export class AuditLogConsumer {
  constructor(@Inject('PinoLogger') private readonly logger: PinoLogger) {}

  @RabbitSubscribe({
    exchange: 'vehicle.events',
    routingKey: '#',
    queue: 'vehicle.audit.log',
  })
  async handleEvent(event: DomainEvent, context: RmqContext): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage() as Message;

    try {
      this.logger.info(
        {
          eventType: event.eventType,
          eventId: event.eventId,
          aggregateId: event.aggregateId,
          occurredAt: event.occurredAt,
          payload: event.payload,
        },
        'Audit log entry',
      );

      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          eventType: event.eventType,
          eventId: event.eventId,
        },
        'Failed to log audit entry',
      );

      channel.nack(originalMsg, false, true);
    }
  }
}

