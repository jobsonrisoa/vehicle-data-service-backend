import * as amqp from 'amqplib';

import { RabbitMQModule } from '@infrastructure/adapters/secondary/messaging/rabbitmq.module';
import { setupRabbitMQTopology } from '@infrastructure/adapters/secondary/messaging/rabbitmq-topology';

jest.mock('amqplib');
jest.mock('@infrastructure/adapters/secondary/messaging/rabbitmq-topology');

describe('RabbitMQModule', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockChannel = {
    waitForConfirms: jest.fn(),
    close: jest.fn(),
  };

  const mockConnection = {
    createConfirmChannel: jest.fn().mockResolvedValue(mockChannel),
    close: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    mockConnection.createConfirmChannel = jest.fn().mockResolvedValue(mockChannel);
    mockConnection.close = jest.fn();
    mockChannel.close = jest.fn();
    mockChannel.waitForConfirms = jest.fn();
    (amqp.connect as jest.Mock).mockResolvedValue(mockConnection);
    (setupRabbitMQTopology as jest.Mock).mockResolvedValue(undefined);
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'RABBITMQ_URL') return 'amqp://localhost:5672';
      return undefined;
    });
  });

  it('initializes connection and topology', async () => {
    const module = new RabbitMQModule(mockConfigService as any, mockLogger as any);

    await module.onModuleInit();

    expect(amqp.connect).toHaveBeenCalledWith('amqp://localhost:5672', { heartbeat: 30 });
    expect(mockConnection.createConfirmChannel).toHaveBeenCalled();
    expect(setupRabbitMQTopology).toHaveBeenCalledWith(mockChannel, mockLogger);
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('logs and rethrows errors', async () => {
    (amqp.connect as jest.Mock).mockRejectedValue(new Error('fail'));
    const module = new RabbitMQModule(mockConfigService as any, mockLogger as any);

    await expect(module.onModuleInit()).rejects.toThrow('fail');
    expect(mockLogger.error).toHaveBeenCalled();
  });
});

