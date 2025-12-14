import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule as GolevelupRabbitMQModule } from '@golevelup/nestjs-rabbitmq';

import { IngestionEventConsumer } from './consumers/ingestion-event.consumer';
import { AuditLogConsumer } from './consumers/audit-log.consumer';

@Module({
  imports: [
    ConfigModule,
    GolevelupRabbitMQModule.forRootAsync(GolevelupRabbitMQModule, {
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672',
        exchanges: [
          {
            name: 'vehicle.events',
            type: 'topic',
          },
        ],
        channels: {
          default: {
            prefetchCount: 1,
            default: true,
          },
        },
      }),
    }),
  ],
  providers: [IngestionEventConsumer, AuditLogConsumer],
  exports: [IngestionEventConsumer, AuditLogConsumer],
})
export class MessagingModule {}

