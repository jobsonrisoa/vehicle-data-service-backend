import { PaginatedResult, PaginationOptions } from '../../dtos/pagination.dto';
import { IngestionJobDTO } from '../../dtos/ingestion-job.dto';

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export interface IIngestDataPort {
  triggerIngestion(): Promise<IngestionJobDTO>;
  getIngestionStatus(jobId: string): Promise<IngestionJobDTO | null>;
  getCurrentIngestion(): Promise<IngestionJobDTO | null>;
  getIngestionHistory(options: PaginationOptions): Promise<PaginatedResult<IngestionJobDTO>>;
}
