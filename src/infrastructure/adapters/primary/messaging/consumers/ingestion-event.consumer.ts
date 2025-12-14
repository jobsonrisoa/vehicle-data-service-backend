import { Injectable, Inject } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RmqContext } from '@nestjs/microservices';
import { Message } from 'amqplib';
import { PinoLogger } from 'nestjs-pino';

import { IngestVehicleDataUseCase } from '@core/application/use-cases/ingest-vehicle-data.use-case';
import { IngestionJobStartedEvent } from '@domain/events/ingestion-job-started.event';

@Injectable()
export class IngestionEventConsumer {
  private readonly MAX_RETRIES = 3;

  constructor(
    private readonly ingestUseCase: IngestVehicleDataUseCase,
    @Inject('PinoLogger') private readonly logger: PinoLogger,
  ) {}

  @RabbitSubscribe({
    exchange: 'vehicle.events',
    routingKey: 'ingestion.job.started',
    queue: 'vehicle.ingestion.process',
  })
  async handleIngestionStarted(event: IngestionJobStartedEvent, context: RmqContext): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.info({ jobId: event.aggregateId }, 'Processing ingestion started event');

      await this.ingestUseCase.execute();

      channel.ack(originalMsg);

      this.logger.info({ jobId: event.aggregateId }, 'Ingestion completed successfully');
    } catch (error) {
      this.logger.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          jobId: event.aggregateId,
        },
        'Ingestion failed',
      );

      await this.handleError(channel, originalMsg as Message);
    }
  }

  private async handleError(channel: any, message: Message): Promise<void> {
    const retryCount = this.getRetryCount(message);

    if (retryCount < this.MAX_RETRIES) {
      const headers = message.properties.headers || {};
      headers['x-retry-count'] = retryCount + 1;
      channel.nack(message, false, true);
    } else {
      channel.nack(message, false, false);
    }
  }

  private getRetryCount(message: Message): number {
    const headers = message.properties.headers || {};
    const value = headers['x-retry-count'];
    return typeof value === 'number' ? value : 0;
  }
}

