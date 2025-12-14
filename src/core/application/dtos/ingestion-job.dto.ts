export interface IngestionJobDTO {
  readonly id: string;
  readonly status: string;
  readonly startedAt: Date;
  readonly completedAt: Date | null;
  readonly totalMakes: number;
  readonly processedMakes: number;
  readonly failedMakes: number;
  readonly errors: unknown[];
}

