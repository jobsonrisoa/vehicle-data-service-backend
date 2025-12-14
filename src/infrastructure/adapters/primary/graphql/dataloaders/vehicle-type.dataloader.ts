import { Inject, Injectable, Optional } from '@nestjs/common';
import * as DataLoader from 'dataloader';

import { IVehicleMakeRepository } from '@core/application/ports/output/vehicle-repository.port';
import { VehicleTypeDTO } from '@core/application/dtos/vehicle-type.dto';
import { MakeId } from '@core/domain/value-objects/make-id.vo';
import { VehicleMake } from '@core/domain/entities/vehicle-make.entity';

@Injectable()
export class VehicleTypeDataLoader {
  constructor(
    @Optional()
    @Inject('IVehicleMakeRepository')
    private readonly repository?: IVehicleMakeRepository,
  ) {}

  createLoader(): DataLoader<string, VehicleTypeDTO[]> {
    const DataLoaderCtor =
      (DataLoader as unknown as { default?: typeof DataLoader }).default ??
      ((DataLoader as unknown as typeof DataLoader) || DataLoader);

    return new DataLoaderCtor<string, VehicleTypeDTO[]>(async (makeIds: readonly string[]) => {
      if (!this.repository) {
        return makeIds.map(() => []);
      }

      const ids = makeIds.map((id) => MakeId.fromString(id));
      const makes = await this.repository.findByIds(ids);
      const makeMap = new Map<string, VehicleMake | { id: unknown; vehicleTypes?: unknown }>(
        makes.map((m) => [this.extractId(m.id), m]),
      );

      return makeIds.map((id) => {
        const vehicleTypes = makeMap.get(id)?.vehicleTypes;
        return this.mapVehicleTypes(vehicleTypes);
      });
    });
  }

  private extractId(id: unknown): string {
    if (typeof id === 'string') {
      return id;
    }
    if (id && typeof id === 'object' && 'value' in id) {
      const value = (id as { value: unknown }).value;
      return typeof value === 'string' ? value : '';
    }
    return '';
  }

  private mapVehicleTypes(types: unknown): VehicleTypeDTO[] {
    if (!Array.isArray(types)) {
      return [];
    }

    return types.map((type) => {
      const typeObj = type as { id?: unknown; typeId?: number; typeName?: string };
      return {
        id: this.extractId(typeObj.id),
        typeId: typeObj.typeId ?? 0,
        typeName: typeObj.typeName ?? '',
      };
    });
  }
}
