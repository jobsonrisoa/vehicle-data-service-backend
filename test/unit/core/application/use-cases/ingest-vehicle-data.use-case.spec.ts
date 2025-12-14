/* eslint-disable @typescript-eslint/unbound-method */
import { IngestVehicleDataUseCase } from '../../../../../src/core/application/use-cases/ingest-vehicle-data.use-case';
import {
  CombinedVehicleData,
  TransformXmlToJsonUseCase,
} from '../../../../../src/core/application/use-cases/transform-xml-to-json.use-case';
import { IExternalVehicleAPIPort } from '@application/ports/output/external-api.port';
import { IEventPublisherPort } from '@application/ports/output/event-publisher.port';
import { IIngestionJobRepository } from '@application/ports/output/ingestion-job-repository.port';
import { IVehicleMakeRepository } from '@application/ports/output/vehicle-repository.port';
import { ExternalMakeDTO, ExternalVehicleTypeDTO } from '@application/dtos/external-api.dto';
import { IngestionStatus } from '@domain/enums/ingestion-status.enum';
import { ConflictError } from '@domain/errors/conflict-error';
import { IngestionJobStartedEvent } from '@domain/events/ingestion-job-started.event';
import { IngestionJobCompletedEvent } from '@domain/events/ingestion-job-completed.event';
import { IngestionJobFailedEvent } from '@domain/events/ingestion-job-failed.event';

describe('IngestVehicleDataUseCase (Unit)', () => {
  let useCase: IngestVehicleDataUseCase;
  let vehicleRepo: jest.Mocked<IVehicleMakeRepository>;
  let jobRepo: jest.Mocked<IIngestionJobRepository>;
  let apiPort: jest.Mocked<IExternalVehicleAPIPort>;
  let eventPublisher: jest.Mocked<IEventPublisherPort>;
  let transformUseCase: TransformXmlToJsonUseCase;
  let executeSpy: jest.SpyInstance<
    CombinedVehicleData[],
    [ExternalMakeDTO[], Map<number, ExternalVehicleTypeDTO[]>]
  >;

  beforeEach(() => {
    vehicleRepo = {
      save: jest.fn(),
      saveMany: jest.fn(),
      findByMakeId: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      findAll: jest.fn(),
      findByFilter: jest.fn(),
      count: jest.fn(),
      deleteAll: jest.fn(),
    };

    jobRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findLatest: jest.fn(),
      findByStatus: jest.fn(),
      updateStatus: jest.fn(),
      hasRunningJob: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    };

    apiPort = {
      getAllMakes: jest.fn(),
      getVehicleTypesForMake: jest.fn(),
      healthCheck: jest.fn(),
    };

    eventPublisher = {
      publish: jest.fn(),
      publishMany: jest.fn(),
      publishWithRetry: jest.fn(),
    };

    transformUseCase = new TransformXmlToJsonUseCase();
    executeSpy = jest.spyOn(transformUseCase, 'execute');

    useCase = new IngestVehicleDataUseCase(
      vehicleRepo,
      jobRepo,
      apiPort,
      eventPublisher,
      transformUseCase,
    );
  });

  describe('execute - success paths', () => {
    it('creates an ingestion job and completes successfully', async () => {
      jobRepo.hasRunningJob.mockResolvedValue(false);

      const externalMakes: ExternalMakeDTO[] = [{ Make_ID: 440, Make_Name: 'Audi' }];
      const externalTypes: ExternalVehicleTypeDTO[] = [
        { VehicleTypeId: 1, VehicleTypeName: 'Passenger Car' },
      ];

      apiPort.getAllMakes.mockResolvedValue(externalMakes);
      apiPort.getVehicleTypesForMake.mockResolvedValue(externalTypes);

      executeSpy.mockReturnValue([
        { makeId: 440, makeName: 'Audi', vehicleTypes: [{ typeId: 1, typeName: 'Passenger Car' }] },
      ]);

      const result = await useCase.execute();

      expect(jobRepo.save).toHaveBeenCalled();
      expect(vehicleRepo.saveMany).toHaveBeenCalledTimes(1);
      expect(result.status).toBe(IngestionStatus.COMPLETED);
      expect(result.processedMakes).toBe(1);
      expect(result.failedMakes).toBe(0);
      expect(eventPublisher.publish).toHaveBeenCalledWith(expect.any(IngestionJobStartedEvent));
      expect(eventPublisher.publish).toHaveBeenCalledWith(expect.any(IngestionJobCompletedEvent));
    });

    it('fetches vehicle types for each make', async () => {
      jobRepo.hasRunningJob.mockResolvedValue(false);
      const externalMakes: ExternalMakeDTO[] = [
        { Make_ID: 440, Make_Name: 'Audi' },
        { Make_ID: 441, Make_Name: 'BMW' },
      ];
      apiPort.getAllMakes.mockResolvedValue(externalMakes);
      apiPort.getVehicleTypesForMake.mockResolvedValue([]);
      executeSpy.mockReturnValue([]);

      await useCase.execute();

      expect(apiPort.getVehicleTypesForMake).toHaveBeenCalledTimes(2);
      expect(apiPort.getVehicleTypesForMake).toHaveBeenCalledWith(440);
      expect(apiPort.getVehicleTypesForMake).toHaveBeenCalledWith(441);
    });
  });

  describe('concurrency', () => {
    it('throws ConflictError when a job is already running', async () => {
      jobRepo.hasRunningJob.mockResolvedValue(true);

      await expect(useCase.execute()).rejects.toThrow(ConflictError);
      expect(jobRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('fails job when external API getAllMakes rejects', async () => {
      jobRepo.hasRunningJob.mockResolvedValue(false);
      apiPort.getAllMakes.mockRejectedValue(new Error('API connection failed'));

      const result = await useCase.execute();

      expect(result.status).toBe(IngestionStatus.FAILED);
      expect(result.failedMakes).toBeGreaterThanOrEqual(0);
      expect(eventPublisher.publish).toHaveBeenCalledWith(expect.any(IngestionJobFailedEvent));
    });

    it('records failure when fetching types for a make fails', async () => {
      jobRepo.hasRunningJob.mockResolvedValue(false);
      const externalMakes: ExternalMakeDTO[] = [
        { Make_ID: 440, Make_Name: 'Audi' },
        { Make_ID: 441, Make_Name: 'BMW' },
      ];
      apiPort.getAllMakes.mockResolvedValue(externalMakes);
      apiPort.getVehicleTypesForMake
        .mockResolvedValueOnce([])
        .mockRejectedValue(new Error('fetch failed'));
      executeSpy.mockReturnValue([
        { makeId: 440, makeName: 'Audi', vehicleTypes: [] },
        { makeId: 441, makeName: 'BMW', vehicleTypes: [] },
      ]);

      const result = await useCase.execute();

      expect(result.failedMakes).toBe(1);
      expect(result.status).toBe(IngestionStatus.PARTIALLY_COMPLETED);
    });

    it('marks job failed when transformation throws', async () => {
      jobRepo.hasRunningJob.mockResolvedValue(false);
      apiPort.getAllMakes.mockResolvedValue([]);
      apiPort.getVehicleTypesForMake.mockResolvedValue([]);
      executeSpy.mockImplementation(() => {
        throw new Error('Transform failed');
      });

      const result = await useCase.execute();

      expect(result.status).toBe(IngestionStatus.FAILED);
    });

    it('marks job failed when repository saveMany fails', async () => {
      jobRepo.hasRunningJob.mockResolvedValue(false);
      apiPort.getAllMakes.mockResolvedValue([{ Make_ID: 440, Make_Name: 'Audi' }]);
      apiPort.getVehicleTypesForMake.mockResolvedValue([]);
      executeSpy.mockReturnValue([{ makeId: 440, makeName: 'Audi', vehicleTypes: [] }]);
      vehicleRepo.saveMany.mockRejectedValue(new Error('db error'));

      const result = await useCase.execute();

      expect(result.status).toBe(IngestionStatus.FAILED);
      expect(eventPublisher.publish).toHaveBeenCalledWith(expect.any(IngestionJobFailedEvent));
    });
  });

  describe('retry logic', () => {
    it('retries fetching types on failure', async () => {
      jobRepo.hasRunningJob.mockResolvedValue(false);
      apiPort.getAllMakes.mockResolvedValue([{ Make_ID: 440, Make_Name: 'Audi' }]);
      apiPort.getVehicleTypesForMake
        .mockRejectedValueOnce(new Error('temp'))
        .mockResolvedValueOnce([]);
      executeSpy.mockReturnValue([{ makeId: 440, makeName: 'Audi', vehicleTypes: [] }]);

      const result = await useCase.execute();

      expect(apiPort.getVehicleTypesForMake).toHaveBeenCalledTimes(2);
      expect(result.status).toBe(IngestionStatus.COMPLETED);
      expect(result.failedMakes).toBe(0);
      expect(result.processedMakes).toBe(1);
    });

    it('records failure after exhausting retries', async () => {
      jobRepo.hasRunningJob.mockResolvedValue(false);
      apiPort.getAllMakes.mockResolvedValue([{ Make_ID: 440, Make_Name: 'Audi' }]);
      apiPort.getVehicleTypesForMake.mockRejectedValue(new Error('persistent'));
      executeSpy.mockReturnValue([]);

      const result = await useCase.execute();

      expect(apiPort.getVehicleTypesForMake).toHaveBeenCalledTimes(3);
      expect(result.failedMakes).toBe(1);
    });
  });
});
