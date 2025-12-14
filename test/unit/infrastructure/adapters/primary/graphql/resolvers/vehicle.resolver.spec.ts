import { Test } from '@nestjs/testing';

import { VehicleResolver } from '@infrastructure/adapters/primary/graphql/resolvers/vehicle.resolver';
import { IQueryVehiclesPort } from '@core/application/ports/input/query-vehicles.port';

describe('VehicleResolver', () => {
  let resolver: VehicleResolver;
  let mockQueryPort: jest.Mocked<IQueryVehiclesPort>;

  beforeEach(async () => {
    mockQueryPort = {
      getAll: jest.fn(),
      getById: jest.fn(),
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        VehicleResolver,
        {
          provide: 'IQueryVehiclesPort',
          useValue: mockQueryPort,
        },
      ],
    }).compile();

    resolver = module.get<VehicleResolver>(VehicleResolver);
  });

  describe('vehicleMakes', () => {
    it('returns paginated vehicle makes', async () => {
      const mockResult = {
        edges: [
          {
            cursor: 'cursor1',
            node: {
              id: '1',
              makeId: 440,
              makeName: 'ASTON MARTIN',
              vehicleTypes: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'cursor1',
          endCursor: 'cursor1',
        },
        totalCount: 1,
      };

      mockQueryPort.getAll.mockResolvedValue(mockResult as any);

      const result = await resolver.vehicleMakes(20, undefined, undefined);

      expect(result).toEqual(mockResult);
      expect(mockQueryPort.getAll).toHaveBeenCalledWith({
        first: 20,
        after: undefined,
        filter: undefined,
      });
    });

    it('calls use case with pagination options', async () => {
      mockQueryPort.getAll.mockResolvedValue({
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
        },
        totalCount: 0,
      } as any);

      await resolver.vehicleMakes(10, 'cursor123', undefined);

      expect(mockQueryPort.getAll).toHaveBeenCalledWith({
        first: 10,
        after: 'cursor123',
        filter: undefined,
      });
    });

    it('handles empty results', async () => {
      mockQueryPort.getAll.mockResolvedValue({
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
        },
        totalCount: 0,
      } as any);

      const result = await resolver.vehicleMakes(20);

      expect(result.edges).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('applies filters when provided', async () => {
      mockQueryPort.getAll.mockResolvedValue({
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
        },
        totalCount: 0,
      } as any);

      const filter = { makeName: 'BMW', hasVehicleTypes: true };

      await resolver.vehicleMakes(20, undefined, filter);

      expect(mockQueryPort.getAll).toHaveBeenCalledWith({
        first: 20,
        after: undefined,
        filter,
      });
    });
  });

  describe('vehicleMake', () => {
    it('returns single vehicle make by ID', async () => {
      const mockMake = {
        id: '1',
        makeId: 440,
        makeName: 'ASTON MARTIN',
        vehicleTypes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockQueryPort.getById.mockResolvedValue(mockMake as any);

      const result = await resolver.vehicleMake(440);

      expect(result).toEqual(mockMake);
      expect(mockQueryPort.getById).toHaveBeenCalledWith(440);
    });

    it('returns null when not found', async () => {
      mockQueryPort.getById.mockResolvedValue(null);

      const result = await resolver.vehicleMake(999);

      expect(result).toBeNull();
    });

    it('validates makeId is positive', async () => {
      await expect(resolver.vehicleMake(-1)).rejects.toThrow();
      expect(mockQueryPort.getById).not.toHaveBeenCalled();
    });
  });
});

