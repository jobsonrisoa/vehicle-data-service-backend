import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from './controllers/health.controller';
import { IngestionController } from './controllers/ingestion.controller';
import { RabbitMQHealthIndicator } from './indicators/rabbitmq.health-indicator';
import { ConflictError } from '@core/application/ports/input/ingest-data.port';

@Module({
  imports: [ConfigModule, TerminusModule],
  controllers: [HealthController, IngestionController],
  providers: [
    RabbitMQHealthIndicator,
    {
      provide: 'IIngestDataPort',
      useValue: {
        triggerIngestion: async () => {
          throw new ConflictError('Ingestion already in progress');
        },
        getCurrentIngestion: async () => null,
        getIngestionStatus: async () => null,
        getIngestionHistory: async () => ({ edges: [], pageInfo: {}, totalCount: 0 } as any),
      },
    },
  ],
})
export class RestModule {}

