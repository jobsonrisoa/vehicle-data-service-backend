import { Test } from '@nestjs/testing';
import { RmqContext } from '@nestjs/microservices';

import { IngestionEventConsumer } from '@infrastructure/adapters/primary/messaging/consumers/ingestion-event.consumer';
import { IngestVehicleDataUseCase } from '@core/application/use-cases/ingest-vehicle-data.use-case';
import { IngestionJobStartedEvent } from '@domain/events/ingestion-job-started.event';

describe('IngestionEventConsumer', () => {
  let consumer: IngestionEventConsumer;
  let mockIngestUseCase: jest.Mocked<IngestVehicleDataUseCase>;
  const logger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  const channel = {
    ack: jest.fn(),
    nack: jest.fn(),
  };
  const message: any = {
    properties: {
      headers: {},
    },
  };
  const context: Partial<RmqContext> = {
    getChannelRef: jest.fn().mockReturnValue(channel),
    getMessage: jest.fn().mockReturnValue(message),
  };

  beforeEach(async () => {
    mockIngestUseCase = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as any;

    message.properties.headers = {};
    channel.ack = jest.fn();
    channel.nack = jest.fn();
    logger.info = jest.fn();
    logger.error = jest.fn();
    logger.debug = jest.fn();

    const module = await Test.createTestingModule({
      providers: [
        IngestionEventConsumer,
        { provide: IngestVehicleDataUseCase, useValue: mockIngestUseCase },
        { provide: 'PinoLogger', useValue: logger },
      ],
    }).compile();

    consumer = module.get(IngestionEventConsumer);
  });

  const createEvent = () =>
    new IngestionJobStartedEvent('job-123', {
      totalMakes: 1,
      triggeredBy: 'manual',
    });

  it('calls ingest use case with job id and acks', async () => {
    const event = createEvent();

    await consumer.handleIngestionStarted(event, context as RmqContext);

    expect(mockIngestUseCase.execute).toHaveBeenCalledWith();
    expect(channel.ack).toHaveBeenCalledWith(message);
  });

  it('logs before and after success', async () => {
    const event = createEvent();

    await consumer.handleIngestionStarted(event, context as RmqContext);

    expect(logger.info).toHaveBeenCalledWith({ jobId: 'job-123' }, 'Processing ingestion started event');
    expect(logger.info).toHaveBeenCalledWith({ jobId: 'job-123' }, 'Ingestion completed successfully');
  });

  it('nacks and requeues on first failure', async () => {
    const event = createEvent();
    message.properties.headers = { 'x-retry-count': 0 };
    mockIngestUseCase.execute.mockRejectedValue(new Error('fail'));

    await consumer.handleIngestionStarted(event, context as RmqContext);

    expect(channel.nack).toHaveBeenCalledWith(message, false, true);
  });

  it('nacks and requeues on second failure', async () => {
    const event = createEvent();
    message.properties.headers = { 'x-retry-count': 1 };
    mockIngestUseCase.execute.mockRejectedValue(new Error('fail'));

    await consumer.handleIngestionStarted(event, context as RmqContext);

    expect(channel.nack).toHaveBeenCalledWith(message, false, true);
  });

  it('nacks without requeue after max retries', async () => {
    const event = createEvent();
    message.properties.headers = { 'x-retry-count': 3 };
    mockIngestUseCase.execute.mockRejectedValue(new Error('fail'));

    await consumer.handleIngestionStarted(event, context as RmqContext);

    expect(channel.nack).toHaveBeenCalledWith(message, false, false);
  });

  it('defaults retry count when header missing', async () => {
    const event = createEvent();
    delete message.properties.headers['x-retry-count'];
    mockIngestUseCase.execute.mockRejectedValue(new Error('fail'));

    await consumer.handleIngestionStarted(event, context as RmqContext);

    expect(channel.nack).toHaveBeenCalledWith(message, false, true);
  });

  it('logs error on failure', async () => {
    const event = createEvent();
    const error = new Error('fail');
    mockIngestUseCase.execute.mockRejectedValue(error);

    await consumer.handleIngestionStarted(event, context as RmqContext);

    expect(logger.error).toHaveBeenCalled();
  });
});

