import { IngestionStatus } from '@domain/enums/ingestion-status.enum';

export interface IngestionErrorDTO {
  readonly makeId: number;
  readonly message: string;
  readonly timestamp: Date;
}

export interface IngestionJobDTO {
  readonly id: string;
  readonly status: IngestionStatus;
  readonly startedAt: Date;
  readonly completedAt: Date | null;
  readonly totalMakes: number;
  readonly processedMakes: number;
  readonly failedMakes: number;
  readonly errors: IngestionErrorDTO[];
}

export interface IngestionJobSummaryDTO {
  readonly id: string;
  readonly status: IngestionStatus;
  readonly progress: number;
  readonly startedAt: Date;
  readonly completedAt: Date | null;
}
