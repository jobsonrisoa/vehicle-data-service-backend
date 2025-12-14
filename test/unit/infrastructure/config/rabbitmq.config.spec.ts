import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';

import { getRabbitMQConfigFromEnv, getRabbitMQOptions } from '@infrastructure/config/rabbitmq.config';

describe('RabbitMQ config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns defaults when env not set', () => {
    delete process.env.RABBITMQ_URL;
    delete process.env.RABBITMQ_QUEUE_PREFIX;
    delete process.env.RABBITMQ_PREFETCH_COUNT;
    delete process.env.RABBITMQ_HEARTBEAT;
    delete process.env.RABBITMQ_RECONNECT_TIME;

    const config = getRabbitMQConfigFromEnv();

    expect(config.url).toBe('amqp://localhost:5672');
    expect(config.queuePrefix).toBe('vehicle');
    expect(config.prefetchCount).toBe(1);
    expect(config.heartbeat).toBe(30);
    expect(config.reconnectTime).toBe(5000);
  });

  it('reads values from env', () => {
    process.env.RABBITMQ_URL = 'amqp://user:pass@host:1234/vhost';
    process.env.RABBITMQ_QUEUE_PREFIX = 'my-queue';
    process.env.RABBITMQ_PREFETCH_COUNT = '5';
    process.env.RABBITMQ_HEARTBEAT = '45';
    process.env.RABBITMQ_RECONNECT_TIME = '8000';

    const config = getRabbitMQConfigFromEnv();

    expect(config.url).toBe('amqp://user:pass@host:1234/vhost');
    expect(config.queuePrefix).toBe('my-queue');
    expect(config.prefetchCount).toBe(5);
    expect(config.heartbeat).toBe(45);
    expect(config.reconnectTime).toBe(8000);
  });

  it('builds Nest RMQ options', () => {
    const mockConfig = new ConfigService();
    const options = getRabbitMQOptions(mockConfig);

    expect(options.transport).toBe(Transport.RMQ);
    expect(options.options?.urls?.[0]).toBeDefined();
    expect(options.options?.queueOptions?.durable).toBe(true);
    expect(options.options?.noAck).toBe(false);
    expect(options.options?.prefetchCount).toBeGreaterThan(0);
    expect(options.options?.persistent).toBe(true);
  });
});

