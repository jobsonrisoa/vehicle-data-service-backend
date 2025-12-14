import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { PinoLogger } from 'nestjs-pino';
import * as amqp from 'amqplib';

import { RabbitMQEventPublisher } from './publishers/rabbitmq-event.publisher';
import { getRabbitMQOptions, getRabbitMQConfigFromEnv } from '@infrastructure/config/rabbitmq.config';
import { setupRabbitMQTopology } from './rabbitmq-topology';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => getRabbitMQOptions(configService),
      },
    ]),
  ],
  providers: [
    {
      provide: 'RABBITMQ_CONNECTION',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const envConfig = getRabbitMQConfigFromEnv();
        const url = configService.get<string>('RABBITMQ_URL') || envConfig.url;
        const heartbeat = configService.get<number>('RABBITMQ_HEARTBEAT') || envConfig.heartbeat;
        return amqp.connect(url, { heartbeat });
      },
    },
    {
      provide: 'RABBITMQ_CHANNEL',
      inject: ['RABBITMQ_CONNECTION'],
      useFactory: async (connection: amqp.Connection) => {
        const channel = await (connection as any).createConfirmChannel();
        return channel as amqp.ConfirmChannel;
      },
    },
    RabbitMQEventPublisher,
    {
      provide: 'IEventPublisherPort',
      useExisting: RabbitMQEventPublisher,
    },
  ],
  exports: [ClientsModule, 'IEventPublisherPort', RabbitMQEventPublisher],
})
export class RabbitMQModule implements OnModuleInit {
  constructor(private readonly configService: ConfigService, private readonly logger: PinoLogger) {}

  async onModuleInit(): Promise<void> {
    const envConfig = getRabbitMQConfigFromEnv();
    const url = this.configService.get<string>('RABBITMQ_URL') || envConfig.url;
    const heartbeat = this.configService.get<number>('RABBITMQ_HEARTBEAT') || envConfig.heartbeat;

    try {
      this.logger.info('Initializing RabbitMQ connection');
      const connection = await amqp.connect(url, { heartbeat });
      const channel = await (connection as any).createConfirmChannel();
      await setupRabbitMQTopology(channel, this.logger);
      this.logger.info('RabbitMQ topology setup complete');
    } catch (error) {
      this.logger.error({ error }, 'Failed to initialize RabbitMQ');
      throw error;
    }
  }
}

