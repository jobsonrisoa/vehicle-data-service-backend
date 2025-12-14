import {
  IExternalVehicleAPIPort,
  ExternalMakeDTO,
  ExternalVehicleTypeDTO,
} from '@application/ports/output/external-api.port';

describe('IExternalVehicleAPIPort (Contract)', () => {
  class DummyApi implements IExternalVehicleAPIPort {
    getAllMakes(): Promise<ExternalMakeDTO[]> {
      return Promise.resolve([]);
    }

    getVehicleTypesForMake(): Promise<ExternalVehicleTypeDTO[]> {
      return Promise.resolve([]);
    }

    healthCheck(): Promise<boolean> {
      return Promise.resolve(true);
    }
  }

  it('should be implementable', async () => {
    const api: IExternalVehicleAPIPort = new DummyApi();
    await expect(api.healthCheck()).resolves.toBe(true);
  });
});
