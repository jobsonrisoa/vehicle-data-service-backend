import {
  IQueryVehiclesPort,
  VehicleMakeFilterDTO,
  VehicleCatalogStatsDTO,
} from '@application/ports/input/query-vehicles.port';
import { PaginationOptions, PaginatedResult } from '@application/dtos/pagination.dto';
import { VehicleMakeDTO } from '@application/dtos/vehicle-make.dto';

describe('IQueryVehiclesPort (Contract)', () => {
  class DummyQueryPort implements IQueryVehiclesPort {
    getAll(): Promise<PaginatedResult<VehicleMakeDTO>> {
      return Promise.resolve({
        edges: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
        totalCount: 0,
      });
    }

    getById(): Promise<VehicleMakeDTO | null> {
      return Promise.resolve(null);
    }

    search(): Promise<VehicleMakeDTO[]> {
      return Promise.resolve([]);
    }

    getStatistics(): Promise<VehicleCatalogStatsDTO> {
      return Promise.resolve({ totalMakes: 0, totalVehicleTypes: 0, lastUpdated: null });
    }
  }

  it('should be implementable', async () => {
    const port: IQueryVehiclesPort = new DummyQueryPort();
    await expect(port.getAll({ first: 10 })).resolves.toBeDefined();
  });

  it('should use DTOs for filters and results', async () => {
    const port: IQueryVehiclesPort = new DummyQueryPort();
    const filter: VehicleMakeFilterDTO = { makeNameContains: 'ASTON', hasVehicleType: 2 };
    const result = await port.search(filter);

    expect(Array.isArray(result)).toBe(true);
  });

  it('should provide statistics DTO', async () => {
    const port: IQueryVehiclesPort = new DummyQueryPort();
    const stats = await port.getStatistics();
    expect(stats.totalMakes).toBe(0);
    expect(stats.lastUpdated).toBeNull();
  });

  it('should accept pagination options', async () => {
    const port: IQueryVehiclesPort = new DummyQueryPort();
    const options: PaginationOptions = { first: 5, after: 'cursor' };
    const result = await port.getAll(options);
    expect(result.pageInfo.hasNextPage).toBe(false);
  });
});
