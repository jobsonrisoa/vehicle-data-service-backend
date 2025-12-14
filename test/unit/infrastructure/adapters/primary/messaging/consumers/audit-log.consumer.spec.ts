import { Test } from '@nestjs/testing';
import { RmqContext } from '@nestjs/microservices';

import { AuditLogConsumer } from '@infrastructure/adapters/primary/messaging/consumers/audit-log.consumer';
import { IngestionJobStartedEvent } from '@domain/events/ingestion-job-started.event';
import { IngestionJobCompletedEvent } from '@domain/events/ingestion-job-completed.event';
import { VehicleMakeCreatedEvent } from '@domain/events/vehicle-make-created.event';

describe('AuditLogConsumer', () => {
  let consumer: AuditLogConsumer;
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
    logger.info = jest.fn();
    logger.error = jest.fn();
    logger.debug = jest.fn();
    channel.ack = jest.fn();
    channel.nack = jest.fn();
    message.properties.headers = {};

    const module = await Test.createTestingModule({
      providers: [
        AuditLogConsumer,
        { provide: 'PinoLogger', useValue: logger },
      ],
    }).compile();

    consumer = module.get(AuditLogConsumer);
  });

  it('logs ingestion started events', async () => {
    const event = new IngestionJobStartedEvent('job-123', {
      totalMakes: 5,
      triggeredBy: 'system',
    });

    await consumer.handleEvent(event, context as RmqContext);

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'ingestion.job.started',
        eventId: event.eventId,
        aggregateId: 'job-123',
        payload: expect.objectContaining({ totalMakes: 5 }),
      }),
      'Audit log entry',
    );
    expect(channel.ack).toHaveBeenCalledWith(message);
  });

  it('logs vehicle make created events', async () => {
    const event = new VehicleMakeCreatedEvent('make-440', {
      makeId: 440,
      makeName: 'ASTON MARTIN',
      vehicleTypeCount: 2,
    });

    await consumer.handleEvent(event, context as RmqContext);

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'vehicle.make.created',
        aggregateId: 'make-440',
        payload: expect.objectContaining({ makeName: 'ASTON MARTIN' }),
      }),
      'Audit log entry',
    );
  });

  it('logs ingestion completed events', async () => {
    const event = new IngestionJobCompletedEvent('job-123', {
      totalMakes: 10,
      processedMakes: 9,
      failedMakes: 1,
      duration: 1000,
    });

    await consumer.handleEvent(event, context as RmqContext);

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'ingestion.job.completed',
        aggregateId: 'job-123',
      }),
      'Audit log entry',
    );
  });

  it('nacks and logs error on failure', async () => {
    const event = new IngestionJobStartedEvent('job-123', {
      totalMakes: 1,
      triggeredBy: 'system',
    });
    logger.info.mockImplementation(() => {
      throw new Error('fail');
    });

    await consumer.handleEvent(event, context as RmqContext);

    expect(logger.error).toHaveBeenCalled();
    expect(channel.nack).toHaveBeenCalledWith(message, false, true);
  });
});

