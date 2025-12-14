import { GetVehicleMakeByIdUseCase } from '@application/use-cases/get-vehicle-make-by-id.use-case';
import { IVehicleMakeRepository } from '@application/ports/output/vehicle-repository.port';
import { VehicleMake } from '@domain/entities/vehicle-make.entity';
import { VehicleType } from '@domain/entities/vehicle-type.entity';
import { ValidationError } from '@domain/errors/validation-error';
import { NotFoundError } from '@domain/errors/not-found-error';

describe('GetVehicleMakeByIdUseCase (Unit)', () => {
  let useCase: GetVehicleMakeByIdUseCase;
  let mockRepository: jest.Mocked<IVehicleMakeRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      saveMany: jest.fn(),
      findByMakeId: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByFilter: jest.fn(),
      count: jest.fn(),
      deleteAll: jest.fn(),
    };

    useCase = new GetVehicleMakeByIdUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should return vehicle make when found by makeId', async () => {
      const vehicleType = VehicleType.create({
        typeId: 1,
        typeName: 'Passenger Car',
      });

      const vehicleMake = VehicleMake.create({
        makeId: 440,
        makeName: 'Audi',
        vehicleTypes: [vehicleType],
      });

      mockRepository.findByMakeId.mockResolvedValue(vehicleMake);

      const result = await useCase.execute(440);

      expect(mockRepository.findByMakeId).toHaveBeenCalledWith(440);
      expect(result).toBeDefined();
      expect(result.makeId).toBe(440);
      expect(result.makeName).toBe('Audi');
      expect(result.vehicleTypes).toHaveLength(1);
      expect(result.vehicleTypes[0].typeId).toBe(1);
    });

    it('should throw NotFoundError when make not found', async () => {
      mockRepository.findByMakeId.mockResolvedValue(null);

      await expect(useCase.execute(999)).rejects.toThrow(NotFoundError);
      await expect(useCase.execute(999)).rejects.toThrow('Vehicle make with ID 999 not found');
    });

    it('should convert entity to DTO', async () => {
      const vehicleType1 = VehicleType.create({
        typeId: 1,
        typeName: 'Passenger Car',
      });

      const vehicleType2 = VehicleType.create({
        typeId: 2,
        typeName: 'Truck',
      });

      const vehicleMake = VehicleMake.create({
        makeId: 440,
        makeName: 'Audi',
        vehicleTypes: [vehicleType1, vehicleType2],
      });

      mockRepository.findByMakeId.mockResolvedValue(vehicleMake);

      const result = await useCase.execute(440);

      expect(result.id).toBe(vehicleMake.id.value);
      expect(result.makeId).toBe(440);
      expect(result.makeName).toBe('Audi');
      expect(result.vehicleTypes).toHaveLength(2);
      expect(result.vehicleTypes[0].id).toBe(vehicleType1.id.value);
      expect(result.vehicleTypes[1].id).toBe(vehicleType2.id.value);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle make with no vehicle types', async () => {
      const vehicleMake = VehicleMake.create({
        makeId: 441,
        makeName: 'BMW',
        vehicleTypes: [],
      });

      mockRepository.findByMakeId.mockResolvedValue(vehicleMake);

      const result = await useCase.execute(441);

      expect(result.makeId).toBe(441);
      expect(result.vehicleTypes).toEqual([]);
    });

    it('should call repository only once', async () => {
      const vehicleMake = VehicleMake.create({
        makeId: 440,
        makeName: 'Audi',
        vehicleTypes: [],
      });

      mockRepository.findByMakeId.mockResolvedValue(vehicleMake);

      await useCase.execute(440);

      expect(mockRepository.findByMakeId).toHaveBeenCalledTimes(1);
    });

    it('should preserve all entity properties in DTO', async () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const vehicleMake = VehicleMake.create({
        makeId: 440,
        makeName: 'Audi',
        vehicleTypes: [],
      });

      const reconstitutedMake = VehicleMake.reconstitute({
        id: vehicleMake.id,
        makeId: 440,
        makeName: 'Audi',
        vehicleTypes: [],
        createdAt,
        updatedAt,
      });

      mockRepository.findByMakeId.mockResolvedValue(reconstitutedMake);

      const result = await useCase.execute(440);

      expect(result.createdAt).toEqual(createdAt);
      expect(result.updatedAt).toEqual(updatedAt);
    });
  });

  describe('validation', () => {
    it('should throw ValidationError for negative makeId', async () => {
      await expect(useCase.execute(-1)).rejects.toThrow(ValidationError);
      await expect(useCase.execute(-1)).rejects.toThrow('makeId must be a positive integer');
    });

    it('should throw ValidationError for zero makeId', async () => {
      await expect(useCase.execute(0)).rejects.toThrow(ValidationError);
      await expect(useCase.execute(0)).rejects.toThrow('makeId must be a positive integer');
    });

    it('should throw ValidationError for non-integer makeId', async () => {
      await expect(useCase.execute(1.5)).rejects.toThrow(ValidationError);
      await expect(useCase.execute(1.5)).rejects.toThrow('makeId must be a positive integer');
    });

    it('should throw ValidationError for null makeId', async () => {
      await expect(useCase.execute(null as any)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for undefined makeId', async () => {
      await expect(useCase.execute(undefined as any)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for string makeId', async () => {
      await expect(useCase.execute('440' as any)).rejects.toThrow(ValidationError);
    });

    it('should allow valid makeId values', async () => {
      const vehicleMake = VehicleMake.create({
        makeId: 1,
        makeName: 'Test',
        vehicleTypes: [],
      });

      mockRepository.findByMakeId.mockResolvedValue(vehicleMake);

      await expect(useCase.execute(1)).resolves.toBeDefined();
      await expect(useCase.execute(100)).resolves.toBeDefined();
      await expect(useCase.execute(9999)).resolves.toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should propagate repository errors', async () => {
      const error = new Error('Database connection failed');
      mockRepository.findByMakeId.mockRejectedValue(error);

      await expect(useCase.execute(440)).rejects.toThrow('Database connection failed');
    });

    it('should handle repository returning null', async () => {
      mockRepository.findByMakeId.mockResolvedValue(null);

      await expect(useCase.execute(440)).rejects.toThrow(NotFoundError);
    });

    it('should include makeId in error message when not found', async () => {
      mockRepository.findByMakeId.mockResolvedValue(null);

      try {
        await useCase.execute(12345);
        fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
        expect((error as NotFoundError).message).toContain('12345');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle very large makeId values', async () => {
      const largeId = Number.MAX_SAFE_INTEGER;
      const vehicleMake = VehicleMake.create({
        makeId: largeId,
        makeName: 'Test',
        vehicleTypes: [],
      });

      mockRepository.findByMakeId.mockResolvedValue(vehicleMake);

      const result = await useCase.execute(largeId);

      expect(result.makeId).toBe(largeId);
    });

    it('should handle make with many vehicle types', async () => {
      const vehicleTypes = Array.from({ length: 20 }, (_, i) =>
        VehicleType.create({
          typeId: i + 1,
          typeName: `Type ${i + 1}`,
        }),
      );

      const vehicleMake = VehicleMake.create({
        makeId: 440,
        makeName: 'Audi',
        vehicleTypes,
      });

      mockRepository.findByMakeId.mockResolvedValue(vehicleMake);

      const result = await useCase.execute(440);

      expect(result.vehicleTypes).toHaveLength(20);
    });
  });
});

