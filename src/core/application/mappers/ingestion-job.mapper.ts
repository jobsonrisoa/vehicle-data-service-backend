import {
  IngestionErrorDTO,
  IngestionJobDTO,
  IngestionJobSummaryDTO,
} from '@application/dtos/ingestion-job.dto';
import { IngestionJob } from '@domain/entities/ingestion-job.entity';

export class IngestionJobMapper {
  static toDTO(entity: IngestionJob): IngestionJobDTO {
    const errors: IngestionErrorDTO[] = entity.errors.map((error) => ({
      makeId: error.makeId,
      message: error.errorMessage,
      timestamp: error.occurredAt,
    }));

    return {
      id: entity.id.toString(),
      status: entity.status,
      startedAt: entity.startedAt,
      completedAt: entity.completedAt,
      totalMakes: entity.totalMakes,
      processedMakes: entity.processedMakes,
      failedMakes: entity.failedMakes,
      errors,
    };
  }

  static toSummaryDTO(entity: IngestionJob): IngestionJobSummaryDTO {
    const progress = entity.totalMakes
      ? Math.round(((entity.processedMakes + entity.failedMakes) / entity.totalMakes) * 100)
      : 0;

    return {
      id: entity.id.toString(),
      status: entity.status,
      progress,
      startedAt: entity.startedAt,
      completedAt: entity.completedAt,
    };
  }
}
