import { Inject, Injectable, Optional } from '@nestjs/common';
import * as DataLoader from 'dataloader';

import { IVehicleMakeRepository } from '@core/application/ports/output/vehicle-repository.port';
import { VehicleTypeDTO } from '@core/application/dtos/vehicle-type.dto';

@Injectable()
export class VehicleTypeDataLoader {
  constructor(
    @Optional()
    @Inject('IVehicleMakeRepository')
    private readonly repository?: IVehicleMakeRepository
  ) {}

  createLoader(): DataLoader<string, VehicleTypeDTO[]> {
    const DataLoaderCtor: typeof DataLoader = (DataLoader as any).default || (DataLoader as any);
    return new DataLoaderCtor<string, VehicleTypeDTO[]>(async (makeIds: readonly string[]) => {
      if (!this.repository) {
        return makeIds.map(() => []);
      }
      const makes = await Promise.all(makeIds.map((id) => this.repository!.findById(id as any)));
      return makeIds.map((_, index) => {
        const vehicleTypes = makes[index]?.vehicleTypes || [];
        return vehicleTypes.map((type: any) => ({
          id: type.id?.value || type.id,
          typeId: type.typeId,
          typeName: type.typeName,
        })) as VehicleTypeDTO[];
      });
    });
  }
}

