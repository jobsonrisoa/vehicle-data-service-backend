import { IngestionJob } from '@domain/entities/ingestion-job.entity';
import { IngestionStatus } from '@domain/enums/ingestion-status.enum';
import { JobId } from '@domain/value-objects/job-id.vo';

export interface IIngestionJobRepository {
  save(job: IngestionJob): Promise<void>;
  findById(id: JobId): Promise<IngestionJob | null>;
  findLatest(): Promise<IngestionJob | null>;
  findByStatus(status: IngestionStatus): Promise<IngestionJob[]>;
  updateStatus(id: JobId, status: IngestionStatus): Promise<void>;
  hasRunningJob(): Promise<boolean>;
}
