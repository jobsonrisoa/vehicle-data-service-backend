import { IngestionJobStartedEvent } from '@domain/events/ingestion-job-started.event';

describe('IngestionJobStartedEvent (Unit)', () => {
  it('should have eventType "ingestion.job.started"', () => {
    const event = new IngestionJobStartedEvent('job-123', {
      totalMakes: 100,
      triggeredBy: 'system',
    });

    expect(event.eventType).toBe('ingestion.job.started');
  });

  it('should contain jobId as aggregateId', () => {
    const event = new IngestionJobStartedEvent('job-456', {
      totalMakes: 100,
      triggeredBy: 'system',
    });

    expect(event.aggregateId).toBe('job-456');
  });

  it('should contain totalMakes in payload', () => {
    const event = new IngestionJobStartedEvent('job-123', {
      totalMakes: 250,
      triggeredBy: 'admin',
    });

    expect(event.payload.totalMakes).toBe(250);
  });

  it('should contain triggeredBy in payload', () => {
    const event = new IngestionJobStartedEvent('job-123', {
      totalMakes: 100,
      triggeredBy: 'cron-job',
    });

    expect(event.payload.triggeredBy).toBe('cron-job');
  });

  it('should serialize correctly', () => {
    const event = new IngestionJobStartedEvent('job-123', {
      totalMakes: 100,
      triggeredBy: 'system',
    });

    const json = event.toJSON();

    expect(json.eventType).toBe('ingestion.job.started');
    expect(json.aggregateId).toBe('job-123');
    expect(json.payload).toEqual({
      totalMakes: 100,
      triggeredBy: 'system',
    });
  });
});
