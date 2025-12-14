import { IIngestionJobRepository } from '@application/ports/output/ingestion-job-repository.port';
import { IngestionJob } from '@domain/entities/ingestion-job.entity';
import { JobId } from '@domain/value-objects/job-id.vo';
import { IngestionStatus } from '@domain/enums/ingestion-status.enum';

class DummyJobRepo implements IIngestionJobRepository {
  save(): Promise<void> {
    return Promise.resolve();
  }

  findById(): Promise<IngestionJob | null> {
    return Promise.resolve(null);
  }

  findLatest(): Promise<IngestionJob | null> {
    return Promise.resolve(null);
  }

  findByStatus(): Promise<IngestionJob[]> {
    return Promise.resolve([]);
  }

  updateStatus(): Promise<void> {
    return Promise.resolve();
  }

  hasRunningJob(): Promise<boolean> {
    return Promise.resolve(false);
  }
}

describe('IIngestionJobRepository (Contract)', () => {
  it('should be implementable', async () => {
    const repo: IIngestionJobRepository = new DummyJobRepo();
    await expect(repo.save(undefined as unknown as IngestionJob)).resolves.toBeUndefined();
  });

  it('should accept domain types', async () => {
    const repo: IIngestionJobRepository = new DummyJobRepo();
    await expect(
      repo.updateStatus(JobId.create(), IngestionStatus.PENDING),
    ).resolves.toBeUndefined();
    await expect(repo.findById(JobId.create())).resolves.toBeNull();
  });
});
