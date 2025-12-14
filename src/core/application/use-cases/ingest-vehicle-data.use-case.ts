import { Injectable } from '@nestjs/common';

import { CombinedVehicleData, TransformXmlToJsonUseCase } from '@application/use-cases/transform-xml-to-json.use-case';
import { IngestionJobMapper } from '@application/mappers/ingestion-job.mapper';
import { IngestionJobDTO } from '@application/dtos/ingestion-job.dto';
import { ExternalMakeDTO, ExternalVehicleTypeDTO } from '@application/dtos/external-api.dto';
import { IExternalVehicleAPIPort } from '@application/ports/output/external-api.port';
import { IEventPublisherPort } from '@application/ports/output/event-publisher.port';
import { IIngestionJobRepository } from '@application/ports/output/ingestion-job-repository.port';
import { IVehicleMakeRepository } from '@application/ports/output/vehicle-repository.port';
import { VehicleMake } from '@domain/entities/vehicle-make.entity';
import { VehicleType } from '@domain/entities/vehicle-type.entity';
import { IngestionJob } from '@domain/entities/ingestion-job.entity';
import { IngestionStatus } from '@domain/enums/ingestion-status.enum';
import { ConflictError } from '@domain/errors/conflict-error';
import { IngestionJobCompletedEvent } from '@domain/events/ingestion-job-completed.event';
import { IngestionJobFailedEvent } from '@domain/events/ingestion-job-failed.event';
import { IngestionJobStartedEvent } from '@domain/events/ingestion-job-started.event';

@Injectable()
export class IngestVehicleDataUseCase {
  private static readonly MAX_RETRIES = 2;
  private static readonly RETRY_DELAY_MS = 250;

  constructor(
    private readonly vehicleRepository: IVehicleMakeRepository,
    private readonly jobRepository: IIngestionJobRepository,
    private readonly externalApi: IExternalVehicleAPIPort,
    private readonly eventPublisher: IEventPublisherPort,
    private readonly transformUseCase: TransformXmlToJsonUseCase,
  ) {}

  async execute(): Promise<IngestionJobDTO> {
    if (await this.jobRepository.hasRunningJob()) {
      throw new ConflictError('An ingestion job is already in progress');
    }

    const job = IngestionJob.create();
    await this.jobRepository.save(job);

    try {
      const externalMakes = await this.externalApi.getAllMakes();

      job.start(externalMakes.length);
      await this.jobRepository.save(job);
      await this.eventPublisher.publish(
        new IngestionJobStartedEvent(job.id.value, { totalMakes: externalMakes.length, triggeredBy: 'system' }),
      );

      const typesMap = await this.fetchVehicleTypes(externalMakes, job);

      const transformedData = this.transformUseCase.execute(externalMakes, typesMap);

      const vehicleMakes = this.createDomainModels(transformedData);
      await this.vehicleRepository.saveMany(vehicleMakes);

      job.complete();
      await this.jobRepository.save(job);
      await this.eventPublisher.publish(
        new IngestionJobCompletedEvent(job.id.value, {
          totalMakes: job.totalMakes,
          processedMakes: job.processedMakes,
          failedMakes: job.failedMakes,
          duration: job.getDuration() ?? 0,
        }),
      );

      return IngestionJobMapper.toDTO(job);
    } catch (error) {
      job.fail((error as Error).message);
      await this.jobRepository.save(job);
      await this.eventPublisher.publish(
        new IngestionJobFailedEvent(job.id.value, {
          reason: (error as Error).message,
          processedMakes: job.processedMakes,
          totalMakes: job.totalMakes,
        }),
      );
      return IngestionJobMapper.toDTO(job);
    }
  }

  private async fetchVehicleTypes(
    externalMakes: ExternalMakeDTO[],
    job: IngestionJob,
  ): Promise<Map<number, ExternalVehicleTypeDTO[]>> {
    const typesMap = new Map<number, ExternalVehicleTypeDTO[]>();

    for (const make of externalMakes) {
      try {
        const types = await this.fetchWithRetry(make.Make_ID);
        typesMap.set(make.Make_ID, types);
        job.incrementProcessed();
      } catch (error) {
        job.recordFailure(make.Make_ID, (error as Error).message);
      }
    }

    return typesMap;
  }

  private async fetchWithRetry(makeId: number): Promise<ExternalVehicleTypeDTO[]> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= IngestVehicleDataUseCase.MAX_RETRIES; attempt += 1) {
      try {
        return await this.externalApi.getVehicleTypesForMake(makeId);
      } catch (error) {
        lastError = error as Error;
        if (attempt < IngestVehicleDataUseCase.MAX_RETRIES) {
          await this.delay(IngestVehicleDataUseCase.RETRY_DELAY_MS);
        }
      }
    }

    throw lastError ?? new Error('Unknown error fetching vehicle types');
  }

  private createDomainModels(transformedData: CombinedVehicleData[]): VehicleMake[] {
    return transformedData.map((data) => {
      const vehicleTypes = data.vehicleTypes.map((typeData) =>
        VehicleType.create({
          typeId: typeData.typeId,
          typeName: typeData.typeName,
        }),
      );

      return VehicleMake.create({
        makeId: data.makeId,
        makeName: data.makeName,
        vehicleTypes,
      });
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}

