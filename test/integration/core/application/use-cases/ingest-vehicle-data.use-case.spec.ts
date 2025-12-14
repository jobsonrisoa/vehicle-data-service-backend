/* eslint-disable @typescript-eslint/unbound-method */
import { IngestVehicleDataUseCase } from '@application/use-cases/ingest-vehicle-data.use-case';
import { TransformXmlToJsonUseCase } from '@application/use-cases/transform-xml-to-json.use-case';
import { IExternalVehicleAPIPort, ExternalMakeDTO, ExternalVehicleTypeDTO } from '@application/ports/output/external-api.port';
import { IEventPublisherPort } from '@application/ports/output/event-publisher.port';
import { IIngestionJobRepository } from '@application/ports/output/ingestion-job-repository.port';
import { IVehicleMakeRepository } from '@application/ports/output/vehicle-repository.port';
import { IngestionJobMapper } from '@application/mappers/ingestion-job.mapper';
import { IngestionJobDTO } from '@application/dtos/ingestion-job.dto';
import { VehicleMake } from '@domain/entities/vehicle-make.entity';
import { VehicleType } from '@domain/entities/vehicle-type.entity';
import { IngestionJob } from '@domain/entities/ingestion-job.entity';
import { IngestionStatus } from '@domain/enums/ingestion-status.enum';
import { JobId } from '@domain/value-objects/job-id.vo';
import { IngestionJobStartedEvent } from '@domain/events/ingestion-job-started.event';
import { IngestionJobCompletedEvent } from '@domain/events/ingestion-job-completed.event';
import { IngestionJobFailedEvent } from '@domain/events/ingestion-job-failed.event';

const runReal = process.env.RUN_REAL_API_TESTS === '1';

class RealExternalVehicleAPIPort implements IExternalVehicleAPIPort {
  async getAllMakes(): Promise<ExternalMakeDTO[]> {
    const response = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json');
    const json = (await response.json()) as { Results: Array<{ Make_ID: number; Make_Name: string }> };
    return json.Results.slice(0, 3).map((m) => ({ Make_ID: m.Make_ID, Make_Name: m.Make_Name }));
  }

  async getVehicleTypesForMake(makeId: number): Promise<ExternalVehicleTypeDTO[]> {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetVehicleTypesForMakeId/${makeId}?format=json`,
    );
    const json = (await response.json()) as { Results: Array<{ VehicleTypeId: number; VehicleTypeName: string }> };
    return json.Results.map((t) => ({ VehicleTypeId: t.VehicleTypeId, VehicleTypeName: t.VehicleTypeName }));
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json');
      return response.ok;
    } catch {
      return false;
    }
  }
}

class InMemoryVehicleMakeRepository implements IVehicleMakeRepository {
  private store: VehicleMake[] = [];

  async save(vehicleMake: VehicleMake): Promise<void> {
    this.store.push(vehicleMake);
  }

  async saveMany(vehicleMakes: VehicleMake[]): Promise<void> {
    this.store.push(...vehicleMakes);
  }

  async findByMakeId(makeId: number): Promise<VehicleMake | null> {
    return this.store.find((m) => m.makeId === makeId) ?? null;
  }

  async findById(): Promise<VehicleMake | null> {
    return null;
  }

  async findAll(): Promise<any> {
    return { edges: [], pageInfo: { hasNextPage: false, hasPreviousPage: false, startCursor: null, endCursor: null }, totalCount: 0 };
  }

  async findByFilter(): Promise<VehicleMake[]> {
    return [];
  }

  async count(): Promise<number> {
    return this.store.length;
  }

  async deleteAll(): Promise<void> {
    this.store = [];
  }
}

class InMemoryIngestionJobRepository implements IIngestionJobRepository {
  private jobs: IngestionJob[] = [];

  async save(job: IngestionJob): Promise<void> {
    const idx = this.jobs.findIndex((j) => j.id.equals(job.id));
    if (idx >= 0) {
      this.jobs[idx] = job;
    } else {
      this.jobs.push(job);
    }
  }

  async findById(id: JobId): Promise<IngestionJob | null> {
    return this.jobs.find((j) => j.id.equals(id)) ?? null;
  }

  async findLatest(): Promise<IngestionJob | null> {
    return this.jobs[this.jobs.length - 1] ?? null;
  }

  async findByStatus(status: IngestionStatus): Promise<IngestionJob[]> {
    return this.jobs.filter((j) => j.status === status);
  }

  async updateStatus(id: JobId, status: IngestionStatus): Promise<void> {
    const job = await this.findById(id);
    if (job) {
      if (status === IngestionStatus.IN_PROGRESS) {
        job.start(job.totalMakes);
      } else if (status === IngestionStatus.COMPLETED || status === IngestionStatus.PARTIALLY_COMPLETED) {
        job.complete();
      } else if (status === IngestionStatus.FAILED) {
        job.fail('updated via repo');
      }
      await this.save(job);
    }
  }

  async hasRunningJob(): Promise<boolean> {
    return this.jobs.some((j) => j.status === IngestionStatus.IN_PROGRESS);
  }

  async findAll(): Promise<IngestionJob[]> {
    return [...this.jobs];
  }

  async count(): Promise<number> {
    return this.jobs.length;
  }

  async delete(id: JobId): Promise<void> {
    this.jobs = this.jobs.filter((j) => !j.id.equals(id));
  }
}

class CollectingEventPublisher implements IEventPublisherPort {
  public events: Array<IngestionJobStartedEvent | IngestionJobCompletedEvent | IngestionJobFailedEvent> = [];

  async publish(event: any): Promise<void> {
    this.events.push(event);
  }

  async publishMany(events: any[]): Promise<void> {
    this.events.push(...events);
  }

  async publishWithRetry(event: any): Promise<void> {
    this.events.push(event);
  }
}

const maybeDescribe = runReal ? describe : describe.skip;

maybeDescribe('IngestVehicleDataUseCase (Integration - real API)', () => {
  jest.setTimeout(60000);

  it('ingests a small set of makes from the real API', async () => {
    const vehicleRepo = new InMemoryVehicleMakeRepository();
    const jobRepo = new InMemoryIngestionJobRepository();
    const apiPort = new RealExternalVehicleAPIPort();
    const eventPublisher = new CollectingEventPublisher();
    const transformUseCase = new TransformXmlToJsonUseCase();

    const useCase = new IngestVehicleDataUseCase(
      vehicleRepo,
      jobRepo,
      apiPort,
      eventPublisher,
      transformUseCase,
    );

    const result: IngestionJobDTO = await useCase.execute();

    expect(result.status === IngestionStatus.COMPLETED || result.status === IngestionStatus.PARTIALLY_COMPLETED).toBe(
      true,
    );
    expect(result.totalMakes).toBeGreaterThan(0);
    expect(result.processedMakes + result.failedMakes).toBeGreaterThan(0);
    expect(eventPublisher.events.length).toBeGreaterThanOrEqual(2);
    // ensure we persisted something
    expect(await vehicleRepo.count()).toBeGreaterThan(0);
  });
});

