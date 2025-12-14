import {
  IVehicleMakeRepository,
  VehicleMakeFilter,
} from '@application/ports/output/vehicle-repository.port';
import { PaginationOptions, PaginatedResult } from '@application/dtos/pagination.dto';
import { VehicleMake } from '@domain/entities/vehicle-make.entity';
import { MakeId } from '@domain/value-objects/make-id.vo';

class DummyRepo implements IVehicleMakeRepository {
  save(): Promise<void> {
    return Promise.resolve();
  }

  saveMany(): Promise<void> {
    return Promise.resolve();
  }

  findByMakeId(): Promise<VehicleMake | null> {
    return Promise.resolve(null);
  }

  findById(): Promise<VehicleMake | null> {
    return Promise.resolve(null);
  }

  findByIds(): Promise<VehicleMake[]> {
    return Promise.resolve([]);
  }

  findAll(): Promise<PaginatedResult<VehicleMake>> {
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

  findByFilter(): Promise<VehicleMake[]> {
    return Promise.resolve([]);
  }

  count(): Promise<number> {
    return Promise.resolve(0);
  }

  deleteAll(): Promise<void> {
    return Promise.resolve();
  }
}

describe('IVehicleMakeRepository (Contract)', () => {
  it('should be implementable', async () => {
    const repo: IVehicleMakeRepository = new DummyRepo();
    await expect(repo.save(undefined as unknown as VehicleMake)).resolves.toBeUndefined();
  });

  it('should expose filter and pagination types', () => {
    const filter: VehicleMakeFilter = { makeNameContains: 'a' };
    const options: PaginationOptions = { first: 10, after: 'cursor' };
    expect(filter.makeNameContains).toBe('a');
    expect(options.first).toBe(10);
  });

  it('should accept domain value objects', async () => {
    const repo: IVehicleMakeRepository = new DummyRepo();
    await expect(repo.findById(MakeId.create())).resolves.toBeNull();
  });
});
