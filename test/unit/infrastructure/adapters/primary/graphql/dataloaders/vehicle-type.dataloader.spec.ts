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
      findAll: jest.fn(),
      findByFilter: jest.fn(),
      count: jest.fn(),
      deleteAll: jest.fn(),
    } as any;

    dataloader = new VehicleTypeDataLoader(mockRepository);
  });

  it('batches load calls', async () => {
    const mockMakes = [
      {
        id: { toString: () => 'make-1' } as any,
        vehicleTypes: [{ typeId: 1, typeName: 'Car' }],
      },
      {
        id: { toString: () => 'make-2' } as any,
        vehicleTypes: [{ typeId: 2, typeName: 'Truck' }],
      },
    ];

    mockRepository.findById.mockImplementation((id: any) => {
      return Promise.resolve(mockMakes.find((m) => m.id.toString() === id) as any);
    });

    const loader = dataloader.createLoader();

    const [result1, result2] = await Promise.all([loader.load('make-1'), loader.load('make-2')]);

    expect(mockRepository.findById).toHaveBeenCalledTimes(2);
    expect(mockRepository.findById).toHaveBeenCalledWith('make-1');
    expect(mockRepository.findById).toHaveBeenCalledWith('make-2');
    expect(result1).toEqual([{ typeId: 1, typeName: 'Car' }]);
    expect(result2).toEqual([{ typeId: 2, typeName: 'Truck' }]);
  });

  it('returns empty array for missing make', async () => {
    mockRepository.findById.mockResolvedValue(null as any);

    const loader = dataloader.createLoader();
    const result = await loader.load('missing');

    expect(result).toEqual([]);
  });

  it('caches within request', async () => {
    const mockMakes = [
      {
        id: { toString: () => 'make-1' } as any,
        vehicleTypes: [{ typeId: 1, typeName: 'Car' }],
      },
    ];

    mockRepository.findById.mockImplementation((id: any) => {
      return Promise.resolve(mockMakes.find((m) => m.id.toString() === id) as any);
    });

    const loader = dataloader.createLoader();
    await loader.load('make-1');
    await loader.load('make-1');

    expect(mockRepository.findById).toHaveBeenCalledTimes(1);
  });
});

