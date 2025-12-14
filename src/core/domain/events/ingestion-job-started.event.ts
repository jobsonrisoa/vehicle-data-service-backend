import { DomainEvent } from './domain-event';

interface IngestionJobStartedPayload {
  totalMakes: number;
  triggeredBy: string;
}

export class IngestionJobStartedEvent extends DomainEvent<IngestionJobStartedPayload> {
  constructor(jobId: string, payload: IngestionJobStartedPayload) {
    super(jobId, 'ingestion.job.started', payload);
  }
}
