import { DomainEvent } from './domain-event';

interface IngestionJobCompletedPayload {
  totalMakes: number;
  processedMakes: number;
  failedMakes: number;
  duration: number;
}

export class IngestionJobCompletedEvent extends DomainEvent<IngestionJobCompletedPayload> {
  constructor(jobId: string, payload: IngestionJobCompletedPayload) {
    super(jobId, 'ingestion.job.completed', payload);
  }
}
