import { DomainEvent } from './domain-event';

interface IngestionJobFailedPayload {
  reason: string;
  processedMakes: number;
  totalMakes: number;
}

export class IngestionJobFailedEvent extends DomainEvent<IngestionJobFailedPayload> {
  constructor(jobId: string, payload: IngestionJobFailedPayload) {
    super(jobId, 'ingestion.job.failed', payload);
  }
}
