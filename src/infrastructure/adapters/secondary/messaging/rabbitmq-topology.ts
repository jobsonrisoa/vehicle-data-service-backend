import { Channel } from 'amqplib';
import { PinoLogger } from 'nestjs-pino';

export const RABBITMQ_TOPOLOGY = {
  exchanges: {
    vehicleEvents: {
      name: 'vehicle.events',
      type: 'topic' as const,
      options: {
        durable: true,
        autoDelete: false,
      },
    },
    deadLetter: {
      name: 'vehicle.dlx',
      type: 'direct' as const,
      options: {
        durable: true,
        autoDelete: false,
      },
    },
  },
  queues: {
    ingestionProcess: {
      name: 'vehicle.ingestion.process',
      options: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'vehicle.dlx',
          'x-dead-letter-routing-key': 'vehicle.dlq',
          'x-message-ttl': 86400000,
        },
      },
      bindings: [{ exchange: 'vehicle.events', pattern: 'ingestion.started' }],
    },
    makeEvents: {
      name: 'vehicle.make.events',
      options: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'vehicle.dlx',
          'x-dead-letter-routing-key': 'vehicle.dlq',
        },
      },
      bindings: [
        { exchange: 'vehicle.events', pattern: 'make.created' },
        { exchange: 'vehicle.events', pattern: 'make.updated' },
      ],
    },
    auditLog: {
      name: 'vehicle.audit.log',
      options: {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'vehicle.dlx',
          'x-dead-letter-routing-key': 'vehicle.dlq',
        },
      },
      bindings: [{ exchange: 'vehicle.events', pattern: '#' }],
    },
    deadLetterQueue: {
      name: 'vehicle.dlq',
      options: {
        durable: true,
        arguments: {
          'x-message-ttl': 604800000,
        },
      },
      bindings: [{ exchange: 'vehicle.dlx', pattern: 'vehicle.dlq' }],
    },
  },
};

type LoggerLike = Pick<PinoLogger, 'info' | 'debug' | 'error'>;

export const setupRabbitMQTopology = async (channel: Channel, logger?: LoggerLike): Promise<void> => {
  logger?.info('Creating RabbitMQ exchanges');
  for (const exchange of Object.values(RABBITMQ_TOPOLOGY.exchanges)) {
    await channel.assertExchange(exchange.name, exchange.type, exchange.options);
    logger?.debug({ exchange: exchange.name }, 'Exchange created');
  }

  logger?.info('Creating RabbitMQ queues and bindings');
  for (const queue of Object.values(RABBITMQ_TOPOLOGY.queues)) {
    await channel.assertQueue(queue.name, queue.options);
    logger?.debug({ queue: queue.name }, 'Queue created');

    for (const binding of queue.bindings || []) {
      await channel.bindQueue(queue.name, binding.exchange, binding.pattern);
      logger?.debug({ queue: queue.name, exchange: binding.exchange, pattern: binding.pattern }, 'Binding created');
    }
  }

  logger?.info('RabbitMQ topology setup complete');
};

export const teardownRabbitMQTopology = async (channel: Channel, logger?: LoggerLike): Promise<void> => {
  for (const queue of Object.values(RABBITMQ_TOPOLOGY.queues)) {
    await channel.deleteQueue(queue.name);
    logger?.debug({ queue: queue.name }, 'Queue deleted');
  }

  for (const exchange of Object.values(RABBITMQ_TOPOLOGY.exchanges)) {
    await channel.deleteExchange(exchange.name);
    logger?.debug({ exchange: exchange.name }, 'Exchange deleted');
  }

  logger?.info('RabbitMQ topology teardown complete');
};

