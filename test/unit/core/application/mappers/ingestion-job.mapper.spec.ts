import { IngestionJobMapper } from '@application/mappers/ingestion-job.mapper';
import { IngestionJob } from '@domain/entities/ingestion-job.entity';

describe('IngestionJobMapper', () => {
  it('should map IngestionJob to DTO', () => {
    const job = IngestionJob.create();
    job.start(2);
    job.incrementProcessed();
    job.recordFailure(440, 'API timeout');

    const dto = IngestionJobMapper.toDTO(job);

    expect(dto.id).toBe(job.id.toString());
    expect(dto.status).toBe(job.status);
    expect(dto.totalMakes).toBe(2);
    expect(dto.processedMakes).toBe(1);
    expect(dto.failedMakes).toBe(1);
    expect(dto.errors).toHaveLength(1);
    expect(dto.errors[0].makeId).toBe(440);
  });

  it('should map IngestionJob to summary DTO with progress', () => {
    const job = IngestionJob.create();
    job.start(4);
    job.incrementProcessed();
    job.recordFailure(1, 'err');

    const summary = IngestionJobMapper.toSummaryDTO(job);

    expect(summary.id).toBe(job.id.toString());
    expect(summary.progress).toBe(50);
  });
});
