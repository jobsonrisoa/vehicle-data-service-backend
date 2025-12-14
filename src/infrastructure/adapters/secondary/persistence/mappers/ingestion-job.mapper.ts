import { IngestionJob } from '@domain/entities/ingestion-job.entity';
import { IngestionError } from '@domain/value-objects/ingestion-error.vo';
import { JobId } from '@domain/value-objects/job-id.vo';
import { IngestionStatus } from '@domain/enums/ingestion-status.enum';

import { IngestionJobOrmEntity, IngestionJobError } from '../entities/ingestion-job.orm-entity';

export class IngestionJobMapper {
  static toDomain(ormEntity: IngestionJobOrmEntity): IngestionJob {
    const jobId = JobId.fromString(ormEntity.id);
    const status = this.statusStringToEnum(ormEntity.status);
    const errors = (ormEntity.errors || []).map((err) => IngestionError.create(err.makeId, err.message));

    return IngestionJob.reconstitute({
      id: jobId,
      status,
      startedAt: ormEntity.startedAt,
      completedAt: ormEntity.completedAt,
      totalMakes: ormEntity.totalMakes,
      processedMakes: ormEntity.processedMakes,
      failedMakes: ormEntity.failedMakes,
      errors,
    });
  }

  static toORM(domainEntity: IngestionJob): IngestionJobOrmEntity {
    const ormEntity = new IngestionJobOrmEntity();
    ormEntity.id = domainEntity.id.value;
    ormEntity.status = this.statusEnumToString(domainEntity.status);
    ormEntity.startedAt = domainEntity.startedAt;
    ormEntity.completedAt = domainEntity.completedAt;
    ormEntity.totalMakes = domainEntity.totalMakes;
    ormEntity.processedMakes = domainEntity.processedMakes;
    ormEntity.failedMakes = domainEntity.failedMakes;
    ormEntity.errors = domainEntity.errors.map((err) => this.errorToOrm(err));
    ormEntity.createdAt = domainEntity.startedAt;
    return ormEntity;
  }

  private static statusStringToEnum(status: string): IngestionStatus {
    switch (status) {
      case 'PENDING':
        return IngestionStatus.PENDING;
      case 'IN_PROGRESS':
        return IngestionStatus.IN_PROGRESS;
      case 'COMPLETED':
        return IngestionStatus.COMPLETED;
      case 'PARTIALLY_COMPLETED':
        return IngestionStatus.PARTIALLY_COMPLETED;
      case 'FAILED':
        return IngestionStatus.FAILED;
      default:
        throw new Error(`Unknown job status: ${status}`);
    }
  }

  private static statusEnumToString(status: IngestionStatus): string {
    return status;
  }

  private static errorToOrm(error: IngestionError): IngestionJobError {
    return {
      makeId: error.makeId,
      message: error.errorMessage,
      timestamp: error.occurredAt.toISOString(),
    };
  }
}

