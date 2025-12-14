import { IngestionJobFailedEvent } from '@domain/events/ingestion-job-failed.event';

describe('IngestionJobFailedEvent (Unit)', () => {
  it('should have eventType "ingestion.job.failed"', () => {
    const event = new IngestionJobFailedEvent('job-123', {
      reason: 'Connection timeout',
      processedMakes: 50,
      totalMakes: 100,
    });

    expect(event.eventType).toBe('ingestion.job.failed');
  });

  it('should contain reason in payload', () => {
    const event = new IngestionJobFailedEvent('job-123', {
      reason: 'NHTSA API unavailable',
      processedMakes: 0,
      totalMakes: 100,
    });

    expect(event.payload.reason).toBe('NHTSA API unavailable');
  });

  it('should contain processedMakes in payload', () => {
    const event = new IngestionJobFailedEvent('job-123', {
      reason: 'Error',
      processedMakes: 75,
      totalMakes: 100,
    });

    expect(event.payload.processedMakes).toBe(75);
  });

  it('should contain totalMakes in payload', () => {
    const event = new IngestionJobFailedEvent('job-123', {
      reason: 'Error',
      processedMakes: 50,
      totalMakes: 200,
    });

    expect(event.payload.totalMakes).toBe(200);
  });
});
