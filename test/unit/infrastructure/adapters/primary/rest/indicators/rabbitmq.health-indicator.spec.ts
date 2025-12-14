import { ConfigService } from '@nestjs/config';
import { HealthCheckError } from '@nestjs/terminus';

import { RabbitMQHealthIndicator } from '@infrastructure/adapters/primary/rest/indicators/rabbitmq.health-indicator';

jest.mock('amqplib', () => ({
  connect: jest.fn(),
}));

const amqp = require('amqplib');

describe('RabbitMQHealthIndicator', () => {
  let indicator: RabbitMQHealthIndicator;
  let config: jest.Mocked<ConfigService>;

  beforeEach(() => {
    config = {
      get: jest.fn().mockReturnValue('amqp://guest:guest@localhost:5672'),
    } as any;
    indicator = new RabbitMQHealthIndicator(config);
  });

  it('returns healthy status when connection succeeds', async () => {
    const close = jest.fn();
    amqp.connect.mockResolvedValue({ close });

    const result = await indicator.pingCheck('rabbitmq');

    expect(result).toEqual({ rabbitmq: { status: 'up' } });
    expect(amqp.connect).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it('throws health check error when connection fails', async () => {
    amqp.connect.mockRejectedValue(new Error('fail'));

    await expect(indicator.pingCheck('rabbitmq')).rejects.toBeInstanceOf(HealthCheckError);
  });
});

