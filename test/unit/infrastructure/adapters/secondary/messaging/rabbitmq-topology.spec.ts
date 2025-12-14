import { setupRabbitMQTopology, teardownRabbitMQTopology, RABBITMQ_TOPOLOGY } from '@infrastructure/adapters/secondary/messaging/rabbitmq-topology';

describe('RabbitMQ topology', () => {
  const logger = {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  };

  const channel = {
    assertExchange: jest.fn(),
    assertQueue: jest.fn(),
    bindQueue: jest.fn(),
    deleteQueue: jest.fn(),
    deleteExchange: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates exchanges and queues with bindings', async () => {
    await setupRabbitMQTopology(channel as any, logger as any);

    expect(channel.assertExchange).toHaveBeenCalledTimes(2);
    expect(channel.assertQueue).toHaveBeenCalledTimes(4);
    expect(channel.bindQueue).toHaveBeenCalledTimes(5);

    expect(channel.assertExchange).toHaveBeenCalledWith('vehicle.events', 'topic', {
      durable: true,
      autoDelete: false,
    });
    expect(channel.assertExchange).toHaveBeenCalledWith('vehicle.dlx', 'direct', {
      durable: true,
      autoDelete: false,
    });

    expect(channel.assertQueue).toHaveBeenCalledWith('vehicle.ingestion.process', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'vehicle.dlx',
        'x-dead-letter-routing-key': 'vehicle.dlq',
        'x-message-ttl': 86400000,
      },
    });
    expect(channel.bindQueue).toHaveBeenCalledWith('vehicle.ingestion.process', 'vehicle.events', 'ingestion.started');
    expect(channel.assertQueue).toHaveBeenCalledWith('vehicle.make.events', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'vehicle.dlx',
        'x-dead-letter-routing-key': 'vehicle.dlq',
      },
    });
    expect(channel.bindQueue).toHaveBeenCalledWith('vehicle.make.events', 'vehicle.events', 'make.created');
    expect(channel.bindQueue).toHaveBeenCalledWith('vehicle.make.events', 'vehicle.events', 'make.updated');
    expect(channel.assertQueue).toHaveBeenCalledWith('vehicle.audit.log', {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'vehicle.dlx',
        'x-dead-letter-routing-key': 'vehicle.dlq',
      },
    });
    expect(channel.bindQueue).toHaveBeenCalledWith('vehicle.audit.log', 'vehicle.events', '#');
    expect(channel.assertQueue).toHaveBeenCalledWith('vehicle.dlq', {
      durable: true,
      arguments: {
        'x-message-ttl': 604800000,
      },
    });
    expect(channel.bindQueue).toHaveBeenCalledWith('vehicle.dlq', 'vehicle.dlx', 'vehicle.dlq');
  });

  it('tears down queues and exchanges', async () => {
    await teardownRabbitMQTopology(channel as any, logger as any);

    expect(channel.deleteQueue).toHaveBeenCalledTimes(4);
    expect(channel.deleteExchange).toHaveBeenCalledTimes(2);
  });

  it('is idempotent', async () => {
    await setupRabbitMQTopology(channel as any, logger as any);
    await setupRabbitMQTopology(channel as any, logger as any);

    expect(channel.assertExchange).toHaveBeenCalledTimes(4);
    expect(channel.assertQueue).toHaveBeenCalledTimes(8);
    expect(channel.bindQueue).toHaveBeenCalledTimes(10);
  });

  it('uses logger when provided', async () => {
    await setupRabbitMQTopology(channel as any, logger as any);
    await teardownRabbitMQTopology(channel as any, logger as any);

    expect(logger.info).toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalled();
  });

  it('matches topology definition', async () => {
    const exchanges = Object.keys(RABBITMQ_TOPOLOGY.exchanges);
    const queues = Object.keys(RABBITMQ_TOPOLOGY.queues);

    expect(exchanges).toEqual(['vehicleEvents', 'deadLetter']);
    expect(queues).toEqual(['ingestionProcess', 'makeEvents', 'auditLog', 'deadLetterQueue']);
  });
});

