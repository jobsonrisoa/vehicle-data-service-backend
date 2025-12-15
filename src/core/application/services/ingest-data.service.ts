import { Injectable, Inject } from '@nestjs/common';

import { PaginatedResult, PaginationOptions, Edge, PageInfo } from '../dtos/pagination.dto';
import { IngestionJobDTO } from '../dtos/ingestion-job.dto';
import { IIngestDataPort } from '../ports/input/ingest-data.port';
import { IIngestionJobRepository } from '../ports/output/ingestion-job-repository.port';
import { IngestionJobMapper } from '../mappers/ingestion-job.mapper';
import { IngestVehicleDataUseCase } from '../use-cases/ingest-vehicle-data.use-case';
import { JobId } from '@domain/value-objects/job-id.vo';
import { IngestionStatus } from '@domain/enums/ingestion-status.enum';

@Injectable()
export class IngestDataService implements IIngestDataPort {
  constructor(
    @Inject('IIngestionJobRepository')
    private readonly jobRepository: IIngestionJobRepository,
    private readonly ingestUseCase: IngestVehicleDataUseCase,
  ) {}

  async triggerIngestion(): Promise<IngestionJobDTO> {
    return this.ingestUseCase.execute();
  }

  async getIngestionStatus(jobId: string): Promise<IngestionJobDTO | null> {
    const job = await this.jobRepository.findById(JobId.fromString(jobId));
    return job ? IngestionJobMapper.toDTO(job) : null;
  }

  async getCurrentIngestion(): Promise<IngestionJobDTO | null> {
    const jobs = await this.jobRepository.findByStatus(IngestionStatus.IN_PROGRESS);
    if (jobs.length > 0) {
      return IngestionJobMapper.toDTO(jobs[0]);
    }

    const latestJob = await this.jobRepository.findLatest();
    return latestJob ? IngestionJobMapper.toDTO(latestJob) : null;
  }

  async getIngestionHistory(options: PaginationOptions): Promise<PaginatedResult<IngestionJobDTO>> {
    const jobs = await this.jobRepository.findAll();
    const limit = options.first ?? 10;

    const dtoJobs = jobs.map((job) => IngestionJobMapper.toDTO(job));
    const paginatedJobs = dtoJobs.slice(0, limit);

    const edges: Edge<IngestionJobDTO>[] = paginatedJobs.map((dto) => ({
      node: dto,
      cursor: Buffer.from(dto.id).toString('base64'),
    }));

    const pageInfo: PageInfo = {
      hasNextPage: dtoJobs.length > limit,
      hasPreviousPage: false,
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
    };

    return {
      edges,
      pageInfo,
      totalCount: dtoJobs.length,
    };
  }
}
