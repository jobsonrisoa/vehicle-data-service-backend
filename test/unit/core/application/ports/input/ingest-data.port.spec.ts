import { IIngestDataPort, ConflictError } from '@application/ports/input/ingest-data.port';
import { PaginationOptions, PaginatedResult } from '@application/dtos/pagination.dto';
import { IngestionJobDTO } from '@application/dtos/ingestion-job.dto';

describe('IIngestDataPort (Contract)', () => {
  class DummyIngestPort implements IIngestDataPort {
    triggerIngestion(): Promise<IngestionJobDTO> {
      return Promise.resolve({
        id: 'job-1',
        status: 'PENDING' as any,
        startedAt: new Date(),
        completedAt: null,
        totalMakes: 0,
        processedMakes: 0,
        failedMakes: 0,
        errors: [],
      });
    }

    getIngestionStatus(): Promise<IngestionJobDTO | null> {
      return Promise.resolve(null);
    }

    getCurrentIngestion(): Promise<IngestionJobDTO | null> {
      return Promise.resolve(null);
    }

    getIngestionHistory(): Promise<PaginatedResult<IngestionJobDTO>> {
      return Promise.resolve({ edges: [], pageInfo: { hasNextPage: false, endCursor: null }, totalCount: 0 });
    }
  }

  it('should be implementable', async () => {
    const port: IIngestDataPort = new DummyIngestPort();
    const job = await port.triggerIngestion();
    expect(job.id).toBe('job-1');
  });

  it('should return ingestion status DTO', async () => {
    const port: IIngestDataPort = new DummyIngestPort();
    const job = await port.getIngestionStatus('id');
    expect(job).toBeNull();
  });

  it('should paginate ingestion history', async () => {
    const port: IIngestDataPort = new DummyIngestPort();
    const options: PaginationOptions = { first: 5 };
    const history = await port.getIngestionHistory(options);
    expect(history.totalCount).toBe(0);
  });

  it('should expose ConflictError type', () => {
    const error = new ConflictError('conflict');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ConflictError');
  });
});
