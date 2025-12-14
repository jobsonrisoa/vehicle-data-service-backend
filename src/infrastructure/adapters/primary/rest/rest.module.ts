import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from './controllers/health.controller';
import { RabbitMQHealthIndicator } from './indicators/rabbitmq.health-indicator';

@Module({
  imports: [ConfigModule, TerminusModule],
  controllers: [HealthController],
  providers: [RabbitMQHealthIndicator],
})
export class RestModule {}

