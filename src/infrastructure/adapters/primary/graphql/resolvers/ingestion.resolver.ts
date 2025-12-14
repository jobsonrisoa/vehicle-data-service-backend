import { Inject } from '@nestjs/common';
import { Resolver, Mutation, Query, Args, Context } from '@nestjs/graphql';

import { IngestionJobType, IngestionStatusEnum } from '../types/ingestion-job.type';
import { IIngestDataPort } from '@core/application/ports/input/ingest-data.port';
import { IngestionJobDTO } from '@core/application/dtos/ingestion-job.dto';

@Resolver(() => IngestionJobType)
export class IngestionResolver {
  constructor(
    @Inject('IIngestDataPort')
    private readonly ingestPort: IIngestDataPort
  ) {}

  @Mutation(() => IngestionJobType, { name: 'triggerIngestion' })
  async triggerIngestion(@Context() context?: any): Promise<IngestionJobType> {
    this.ensureAuthorized(context);
    const job = await this.ingestPort.triggerIngestion();
    return this.toGraphQL(job);
  }

  @Query(() => IngestionJobType, { name: 'ingestionStatus', nullable: true })
  async ingestionStatus(): Promise<IngestionJobType | null> {
    const job = await this.ingestPort.getCurrentIngestion();
    return job ? this.toGraphQL(job) : null;
  }

  @Query(() => IngestionJobType, { name: 'ingestionJob', nullable: true })
  async ingestionJob(
    @Args('id', { type: () => String })
    id: string
  ): Promise<IngestionJobType | null> {
    const job = await this.ingestPort.getIngestionStatus(id);
    return job ? this.toGraphQL(job) : null;
  }

  private ensureAuthorized(context: any): void {
    const apiKey = process.env.INGESTION_API_KEY;
    if (!apiKey) {
      return;
    }
    const headerKey = context?.req?.headers?.['x-api-key'] ?? context?.req?.headers?.['X-API-KEY'];
    if (headerKey !== apiKey) {
      throw new Error('Unauthorized');
    }
  }

  private toGraphQL(dto: IngestionJobDTO): IngestionJobType {
    const progress =
      dto.totalMakes > 0
        ? Math.round(((dto.processedMakes + dto.failedMakes) / dto.totalMakes) * 100)
        : 0;
    const status = dto.status as unknown as IngestionStatusEnum;

    return {
      id: dto.id,
      status,
      startedAt: dto.startedAt,
      completedAt: dto.completedAt ?? undefined,
      totalMakes: dto.totalMakes,
      processedMakes: dto.processedMakes,
      failedMakes: dto.failedMakes,
      progress,
      errors: dto.errors.map((error) => error.message),
    };
  }
}

