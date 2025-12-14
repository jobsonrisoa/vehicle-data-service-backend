import { IngestionJobCompletedEvent } from '@domain/events/ingestion-job-completed.event';

describe('IngestionJobCompletedEvent (Unit)', () => {
  it('should have eventType "ingestion.job.completed"', () => {
    const event = new IngestionJobCompletedEvent('job-123', {
      totalMakes: 100,
      processedMakes: 98,
      failedMakes: 2,
      duration: 30000,
    });

    expect(event.eventType).toBe('ingestion.job.completed');
  });

  it('should contain jobId as aggregateId', () => {
    const event = new IngestionJobCompletedEvent('job-456', {
      totalMakes: 100,
      processedMakes: 100,
      failedMakes: 0,
      duration: 25000,
    });

    expect(event.aggregateId).toBe('job-456');
  });

  it('should contain processedMakes in payload', () => {
    const event = new IngestionJobCompletedEvent('job-123', {
      totalMakes: 100,
      processedMakes: 95,
      failedMakes: 5,
      duration: 30000,
    });

    expect(event.payload.processedMakes).toBe(95);
  });

  it('should contain failedMakes in payload', () => {
    const event = new IngestionJobCompletedEvent('job-123', {
      totalMakes: 100,
      processedMakes: 95,
      failedMakes: 5,
      duration: 30000,
    });

    expect(event.payload.failedMakes).toBe(5);
  });

  it('should contain duration in payload', () => {
    const event = new IngestionJobCompletedEvent('job-123', {
      totalMakes: 100,
      processedMakes: 100,
      failedMakes: 0,
      duration: 45000,
    });

    expect(event.payload.duration).toBe(45000);
  });
});
