import { ConfigService } from '@nestjs/config';
import { RmqOptions, Transport } from '@nestjs/microservices';

export interface RabbitMQConfig {
  url: string;
  queuePrefix: string;
  prefetchCount: number;
  heartbeat: number;
  reconnectTime: number;
}

const intFromEnv = (key: string, fallback: number): number => {
  const value = process.env[key];
  const parsed = value ? parseInt(value, 10) : NaN;
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const getRabbitMQConfigFromEnv = (): RabbitMQConfig => ({
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  queuePrefix: process.env.RABBITMQ_QUEUE_PREFIX || 'vehicle',
  prefetchCount: intFromEnv('RABBITMQ_PREFETCH_COUNT', 1),
  heartbeat: intFromEnv('RABBITMQ_HEARTBEAT', 30),
  reconnectTime: intFromEnv('RABBITMQ_RECONNECT_TIME', 5000),
});

export const getRabbitMQOptions = (_configService: ConfigService): RmqOptions => {
  const config = getRabbitMQConfigFromEnv();

  return {
    transport: Transport.RMQ,
    options: {
      urls: [config.url],
      queue: config.queuePrefix,
      queueOptions: {
        durable: true,
      },
      noAck: false,
      prefetchCount: config.prefetchCount,
      persistent: true,
      socketOptions: {
        heartbeat: config.heartbeat,
        reconnectTimeInSeconds: Math.floor(config.reconnectTime / 1000),
      },
    },
  };
};

