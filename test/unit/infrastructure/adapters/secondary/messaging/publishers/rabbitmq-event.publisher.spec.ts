import { RabbitMQEventPublisher } from '@infrastructure/adapters/secondary/messaging/publishers/rabbitmq-event.publisher';
import { IngestionJobStartedEvent } from '@domain/events/ingestion-job-started.event';
import { IngestionJobCompletedEvent } from '@domain/events/ingestion-job-completed.event';
import { VehicleMakeCreatedEvent } from '@domain/events/vehicle-make-created.event';
import { PublishError } from '@domain/errors/publish-error';

describe('RabbitMQEventPublisher', () => {
  const channel = {
    publish: jest.fn().mockReturnValue(true),
    waitForConfirms: jest.fn().mockResolvedValue(undefined),
  };

  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  };

  let publisher: RabbitMQEventPublisher;

  beforeEach(() => {
    jest.resetAllMocks();
    channel.publish = jest.fn().mockReturnValue(true);
    channel.waitForConfirms = jest.fn().mockResolvedValue(undefined);
    publisher = new RabbitMQEventPublisher(channel as any, logger as any);
  });

  const createStarted = () =>
    new IngestionJobStartedEvent('job-123', {
      totalMakes: 0,
      triggeredBy: 'manual',
    });

  const createCompleted = () =>
    new IngestionJobCompletedEvent('job-123', {
      processedMakes: 1,
      failedMakes: 0,
      totalMakes: 1,
      duration: 1000,
    });

  it('publishes to exchange with routing key', async () => {
    const event = createStarted();

    await publisher.publish(event);

    expect(channel.publish).toHaveBeenCalledWith(
      'vehicle.events',
      'ingestion.job.started',
      expect.any(Buffer),
      expect.objectContaining({
        persistent: true,
        messageId: event.eventId,
        type: event.eventType,
      }),
    );
    expect(channel.waitForConfirms).toHaveBeenCalled();
  });

  it('serializes event payload', async () => {
    const event = createStarted();

    await publisher.publish(event);

    const buffer = channel.publish.mock.calls[0][2] as Buffer;
    const payload = JSON.parse(buffer.toString());
    expect(payload.eventType).toBe('ingestion.job.started');
    expect(payload.aggregateId).toBe('job-123');
    expect(payload.payload.totalMakes).toBe(0);
  });

  it('logs debug and info', async () => {
    const event = createStarted();

    await publisher.publish(event);

    expect(logger.debug).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalled();
  });

  it('throws when channel buffer is full', async () => {
    channel.publish = jest.fn().mockReturnValue(false);
    const event = createStarted();

    await expect(publisher.publish(event)).rejects.toThrow(PublishError);
  });

  it('throws when publish throws', async () => {
    channel.publish = jest.fn(() => {
      throw new Error('fail');
    });
    const event = createStarted();

    await expect(publisher.publish(event)).rejects.toThrow(PublishError);
  });

  it('throws when confirm fails', async () => {
    channel.waitForConfirms = jest.fn().mockRejectedValue(new Error('timeout'));
    const event = createStarted();

    await expect(publisher.publish(event)).rejects.toThrow(PublishError);
  });

  it('publishMany handles multiple events', async () => {
    const started = createStarted();
    const completed = createCompleted();

    await publisher.publishMany([started, completed]);

    expect(channel.publish).toHaveBeenCalledTimes(2);
    expect(channel.waitForConfirms).toHaveBeenCalledTimes(2);
  });

  it('publishMany handles empty array', async () => {
    await publisher.publishMany([]);
    expect(channel.publish).not.toHaveBeenCalled();
  });

  it('routes make.created correctly', async () => {
    const event = new VehicleMakeCreatedEvent('make-1', {
      makeId: 1,
      makeName: 'TEST',
      vehicleTypeCount: 0,
    });

    await publisher.publish(event);

    expect(channel.publish).toHaveBeenCalledWith(
      'vehicle.events',
      'vehicle.make.created',
      expect.any(Buffer),
      expect.any(Object),
    );
  });
});

