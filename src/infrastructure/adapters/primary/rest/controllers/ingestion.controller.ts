import {
  Controller,
  Get,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { IIngestDataPort, ConflictError } from '@core/application/ports/input/ingest-data.port';
import { IngestionJobDTO } from '@core/application/dtos/ingestion-job.dto';
import { IngestionJobResponse } from '../dtos/ingestion-job.response';

@ApiTags('ingestion')
@Controller('api/v1/ingestion')
export class IngestionController {
  constructor(
    @Inject('IIngestDataPort')
    private readonly ingestPort: IIngestDataPort
  ) {}

  @Post('trigger')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger vehicle data ingestion' })
  @ApiAcceptedResponse({ description: 'Ingestion job created', type: IngestionJobResponse })
  @ApiConflictResponse({ description: 'Ingestion already in progress' })
  async triggerIngestion(): Promise<any> {
    try {
      const job = await this.ingestPort.triggerIngestion();
      return this.toResponse(job);
    } catch (error) {
      if (error instanceof ConflictError || (error as Error).message?.includes('already in progress')) {
        throw new ConflictException('Ingestion already in progress');
      }
      throw error;
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Get current ingestion status' })
  @ApiOkResponse({ description: 'Current ingestion status', type: IngestionJobResponse })
  async getStatus(): Promise<any> {
    const job = await this.ingestPort.getCurrentIngestion();
    return job ? this.toResponse(job) : null;
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Get ingestion job by ID' })
  @ApiParam({ name: 'jobId', type: String })
  @ApiOkResponse({ description: 'Ingestion job details', type: IngestionJobResponse })
  @ApiNotFoundResponse({ description: 'Job not found' })
  async getJob(@Param('jobId') jobId: string): Promise<any> {
    const job = await this.ingestPort.getIngestionStatus(jobId);
    if (!job) {
      throw new NotFoundException(`Ingestion job ${jobId} not found`);
    }
    return this.toResponse(job);
  }

  private toResponse(dto: IngestionJobDTO) {
    const progress =
      dto.totalMakes > 0
        ? Math.round(((dto.processedMakes + dto.failedMakes) / dto.totalMakes) * 100)
        : 0;
    return {
      id: dto.id,
      status: dto.status,
      startedAt: dto.startedAt,
      completedAt: dto.completedAt,
      totalMakes: dto.totalMakes,
      processedMakes: dto.processedMakes,
      failedMakes: dto.failedMakes,
      progress,
      errors: dto.errors.map((e) => e.message),
    };
  }
}

