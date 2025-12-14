import { VehicleTypeDataLoader } from '@infrastructure/adapters/primary/graphql/dataloaders/vehicle-type.dataloader';
import { IVehicleMakeRepository } from '@core/application/ports/output/vehicle-repository.port';

describe('VehicleTypeDataLoader', () => {
  let dataloader: VehicleTypeDataLoader;
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
    } as jest.Mocked<IVehicleMakeRepository>;

    dataloader = new VehicleTypeDataLoader(mockRepository);
  });

  it('batches load calls', async () => {
    const makeId1 = '550e8400-e29b-41d4-a716-446655440000';
    const makeId2 = '123e4567-e89b-12d3-a456-426614174000';
    const mockMakes: Array<{
      id: { value: string };
      vehicleTypes: Array<{ id: { value: string }; typeId: number; typeName: string }>;
    }> = [
      {
        id: { value: makeId1 },
        vehicleTypes: [{ id: { value: 'type-1' }, typeId: 1, typeName: 'Car' }],
      },
      {
        id: { value: makeId2 },
        vehicleTypes: [{ id: { value: 'type-2' }, typeId: 2, typeName: 'Truck' }],
      },
    ];

    mockRepository.findByIds.mockResolvedValue(mockMakes as never);

    const loader = dataloader.createLoader();

    const [result1, result2] = await Promise.all([loader.load(makeId1), loader.load(makeId2)]);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockRepository.findByIds).toHaveBeenCalledTimes(1);
    const findByIdsCall = mockRepository.findByIds.mock.calls[0];
    if (findByIdsCall) {
      const passedIds = findByIdsCall[0]?.map((id: { value: string }) => id.value) ?? [];
      expect(passedIds).toEqual([makeId1, makeId2]);
    }
    expect(result1).toEqual([{ id: 'type-1', typeId: 1, typeName: 'Car' }]);
    expect(result2).toEqual([{ id: 'type-2', typeId: 2, typeName: 'Truck' }]);
  });

  it('returns empty array for missing make', async () => {
    mockRepository.findByIds.mockResolvedValue([]);

    const loader = dataloader.createLoader();
    const result = await loader.load('6ba7b810-9dad-11d1-80b4-00c04fd430c8');

    expect(result).toEqual([]);
  });

  it('caches within request', async () => {
    const makeId = '9f9c6ad5-83de-4a7a-8b90-4bce6ad5ef11';
    const mockMakes: Array<{
      id: { value: string };
      vehicleTypes: Array<{ id: { value: string }; typeId: number; typeName: string }>;
    }> = [
      {
        id: { value: makeId },
        vehicleTypes: [{ id: { value: 'type-1' }, typeId: 1, typeName: 'Car' }],
      },
    ];

    mockRepository.findByIds.mockResolvedValue(mockMakes as never);

    const loader = dataloader.createLoader();
    await loader.load(makeId);
    await loader.load(makeId);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockRepository.findByIds).toHaveBeenCalledTimes(1);
  });
});
