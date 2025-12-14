import { GetAllVehicleMakesUseCase } from '@application/use-cases/get-all-vehicle-makes.use-case';
import { IVehicleMakeRepository } from '@application/ports/output/vehicle-repository.port';
import { PaginationOptions, PaginatedResult } from '@application/dtos/pagination.dto';
import { VehicleMake } from '@domain/entities/vehicle-make.entity';
import { VehicleType } from '@domain/entities/vehicle-type.entity';
import { ValidationError } from '@domain/errors/validation-error';

describe('GetAllVehicleMakesUseCase (Unit)', () => {
  let useCase: GetAllVehicleMakesUseCase;
  let mockRepository: jest.Mocked<IVehicleMakeRepository>;

  beforeEach(() => {
    mockRepository = {
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

    useCase = new GetAllVehicleMakesUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should return paginated vehicle makes', async () => {
      const vehicleType = VehicleType.create({
        typeId: 1,
        typeName: 'Passenger Car',
      });

      const make1 = VehicleMake.create({
        makeId: 440,
        makeName: 'Audi',
        vehicleTypes: [vehicleType],
      });

      const make2 = VehicleMake.create({
        makeId: 441,
        makeName: 'BMW',
        vehicleTypes: [],
      });

      const repositoryResult: PaginatedResult<VehicleMake> = {
        edges: [
          { node: make1, cursor: 'cursor-1' },
          { node: make2, cursor: 'cursor-2' },
        ],
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: 'cursor-1',
          endCursor: 'cursor-2',
        },
        totalCount: 100,
      };

      mockRepository.findAll.mockResolvedValue(repositoryResult);

      const options: PaginationOptions = { first: 2 };

      const result = await useCase.execute(options);

      expect(mockRepository.findAll.mock.calls[0][0]).toEqual(options);
      expect(result.edges).toHaveLength(2);
      expect(result.edges[0].node.makeId).toBe(440);
      expect(result.edges[1].node.makeId).toBe(441);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.totalCount).toBe(100);
    });

    it('should call repository with correct pagination options', async () => {
      const options: PaginationOptions = {
        first: 20,
        after: 'cursor-abc',
      };

      mockRepository.findAll.mockResolvedValue({
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: true,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      });

      await useCase.execute(options);

      expect(mockRepository.findAll.mock.calls[0][0]).toEqual(options);
      expect(mockRepository.findAll.mock.calls).toHaveLength(1);
    });

    it('should convert entities to DTOs', async () => {
      const vehicleType = VehicleType.create({
        typeId: 1,
        typeName: 'Passenger Car',
      });

      const make = VehicleMake.create({
        makeId: 440,
        makeName: 'Audi',
        vehicleTypes: [vehicleType],
      });

      const repositoryResult: PaginatedResult<VehicleMake> = {
        edges: [{ node: make, cursor: 'cursor-1' }],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'cursor-1',
          endCursor: 'cursor-1',
        },
        totalCount: 1,
      };

      mockRepository.findAll.mockResolvedValue(repositoryResult);

      const result = await useCase.execute({ first: 10 });

      expect(result.edges[0].node.id).toBe(make.id.value);
      expect(result.edges[0].node.makeId).toBe(440);
      expect(result.edges[0].node.makeName).toBe('Audi');
      expect(result.edges[0].node.vehicleTypes).toHaveLength(1);
      expect(result.edges[0].node.vehicleTypes[0].typeId).toBe(1);
    });

    it('should return empty array when no makes exist', async () => {
      const emptyResult: PaginatedResult<VehicleMake> = {
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      };

      mockRepository.findAll.mockResolvedValue(emptyResult);

      const result = await useCase.execute({ first: 10 });

      expect(result.edges).toEqual([]);
      expect(result.totalCount).toBe(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it('should use default pagination when no options provided', async () => {
      mockRepository.findAll.mockResolvedValue({
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      });

      await useCase.execute();

      expect(mockRepository.findAll.mock.calls[0][0]).toEqual({});
    });

    it('should preserve cursor information from repository', async () => {
      const make = VehicleMake.create({
        makeId: 440,
        makeName: 'Audi',
        vehicleTypes: [],
      });

      const repositoryResult: PaginatedResult<VehicleMake> = {
        edges: [{ node: make, cursor: 'custom-cursor-123' }],
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: 'start-cursor',
          endCursor: 'end-cursor',
        },
        totalCount: 50,
      };

      mockRepository.findAll.mockResolvedValue(repositoryResult);

      const result = await useCase.execute({ first: 1 });

      expect(result.edges[0].cursor).toBe('custom-cursor-123');
      expect(result.pageInfo.startCursor).toBe('start-cursor');
      expect(result.pageInfo.endCursor).toBe('end-cursor');
    });
  });

  describe('error handling', () => {
    it('should throw when repository fails', async () => {
      const error = new Error('Database connection failed');
      mockRepository.findAll.mockRejectedValue(error);

      await expect(useCase.execute({ first: 10 })).rejects.toThrow('Database connection failed');
    });

    it('should validate first parameter is positive', async () => {
      await expect(useCase.execute({ first: -1 })).rejects.toThrow(ValidationError);
      await expect(useCase.execute({ first: 0 })).rejects.toThrow(ValidationError);
    });

    it('should validate first parameter does not exceed maximum', async () => {
      await expect(useCase.execute({ first: 101 })).rejects.toThrow(ValidationError);
    });

    it('should allow valid first parameter values', async () => {
      mockRepository.findAll.mockResolvedValue({
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      });

      await expect(useCase.execute({ first: 1 })).resolves.toBeDefined();
      await expect(useCase.execute({ first: 50 })).resolves.toBeDefined();
      await expect(useCase.execute({ first: 100 })).resolves.toBeDefined();
    });

    it('should validate after cursor is a string', async () => {
      await expect(useCase.execute({ first: 10, after: '' })).rejects.toThrow(ValidationError);
      await expect(
        useCase.execute({ first: 10, after: null as unknown as string }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('pagination behavior', () => {
    it('should handle first page request', async () => {
      const makes = [
        VehicleMake.create({ makeId: 1, makeName: 'Make 1', vehicleTypes: [] }),
        VehicleMake.create({ makeId: 2, makeName: 'Make 2', vehicleTypes: [] }),
      ];

      mockRepository.findAll.mockResolvedValue({
        edges: [
          { node: makes[0], cursor: 'c1' },
          { node: makes[1], cursor: 'c2' },
        ],
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: 'c1',
          endCursor: 'c2',
        },
        totalCount: 10,
      });

      const result = await useCase.execute({ first: 2 });

      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });

    it('should handle middle page request', async () => {
      const make = VehicleMake.create({
        makeId: 5,
        makeName: 'Make 5',
        vehicleTypes: [],
      });

      mockRepository.findAll.mockResolvedValue({
        edges: [{ node: make, cursor: 'c5' }],
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: true,
          startCursor: 'c5',
          endCursor: 'c5',
        },
        totalCount: 10,
      });

      const result = await useCase.execute({ first: 1, after: 'c4' });

      expect(result.pageInfo.hasPreviousPage).toBe(true);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });

    it('should handle last page request', async () => {
      const make = VehicleMake.create({
        makeId: 10,
        makeName: 'Make 10',
        vehicleTypes: [],
      });

      mockRepository.findAll.mockResolvedValue({
        edges: [{ node: make, cursor: 'c10' }],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: true,
          startCursor: 'c10',
          endCursor: 'c10',
        },
        totalCount: 10,
      });

      const result = await useCase.execute({ first: 1, after: 'c9' });

      expect(result.pageInfo.hasPreviousPage).toBe(true);
      expect(result.pageInfo.hasNextPage).toBe(false);
    });
  });
});
