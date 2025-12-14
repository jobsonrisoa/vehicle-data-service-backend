import { Injectable } from '@nestjs/common';

import {
  ExternalMakeDTO,
  ExternalVehicleTypeDTO,
} from '@application/dtos/external-api.dto';
import { TransformationError } from '@domain/errors/transformation-error';

interface TransformedMake {
  makeId: number;
  makeName: string;
}

interface TransformedVehicleType {
  typeId: number;
  typeName: string;
}

export interface CombinedVehicleData {
  makeId: number;
  makeName: string;
  vehicleTypes: TransformedVehicleType[];
}

@Injectable()
export class TransformXmlToJsonUseCase {
  transformMakes(externalMakes: ExternalMakeDTO[]): TransformedMake[] {
    if (!Array.isArray(externalMakes)) {
      return [];
    }

    return externalMakes
      .filter((make) => this.isValidMake(make))
      .map((make) => ({
        makeId: make.Make_ID,
        makeName: make.Make_Name.trim(),
      }));
  }

  transformVehicleTypes(externalTypes: ExternalVehicleTypeDTO[]): TransformedVehicleType[] {
    if (!Array.isArray(externalTypes)) {
      return [];
    }

    const uniqueTypes = new Map<number, TransformedVehicleType>();

    externalTypes
      .filter((type) => this.isValidVehicleType(type))
      .forEach((type) => {
        if (!uniqueTypes.has(type.VehicleTypeId)) {
          uniqueTypes.set(type.VehicleTypeId, {
            typeId: type.VehicleTypeId,
            typeName: type.VehicleTypeName.trim(),
          });
        }
      });

    return Array.from(uniqueTypes.values());
  }

  combineData(
    makes: TransformedMake[],
    typesMap: Map<number, TransformedVehicleType[]>,
  ): CombinedVehicleData[] {
    return makes.map((make) => ({
      makeId: make.makeId,
      makeName: make.makeName,
      vehicleTypes: typesMap.get(make.makeId) || [],
    }));
  }

  execute(
    externalMakes: ExternalMakeDTO[],
    externalTypesMap: Map<number, ExternalVehicleTypeDTO[]>,
  ): CombinedVehicleData[] {
    if (!Array.isArray(externalMakes)) {
      throw new TransformationError('Invalid input: makes must be an array');
    }

    if (!(externalTypesMap instanceof Map)) {
      throw new TransformationError('Invalid input: externalTypesMap must be a Map');
    }

    const transformedMakes = this.transformMakes(externalMakes);
    const transformedTypesMap = new Map<number, TransformedVehicleType[]>();

    externalTypesMap.forEach((types, makeId) => {
      const transformedTypes = this.transformVehicleTypes(types);
      transformedTypesMap.set(makeId, transformedTypes);
    });

    return this.combineData(transformedMakes, transformedTypesMap);
  }

  private isValidMake(make: unknown): make is ExternalMakeDTO {
    return (
      !!make &&
      typeof (make as ExternalMakeDTO).Make_ID === 'number' &&
      this.isPositiveInteger((make as ExternalMakeDTO).Make_ID) &&
      typeof (make as ExternalMakeDTO).Make_Name === 'string' &&
      this.isNonEmptyString((make as ExternalMakeDTO).Make_Name)
    );
  }

  private isValidVehicleType(type: unknown): type is ExternalVehicleTypeDTO {
    return (
      !!type &&
      typeof (type as ExternalVehicleTypeDTO).VehicleTypeId === 'number' &&
      this.isPositiveInteger((type as ExternalVehicleTypeDTO).VehicleTypeId) &&
      typeof (type as ExternalVehicleTypeDTO).VehicleTypeName === 'string' &&
      this.isNonEmptyString((type as ExternalVehicleTypeDTO).VehicleTypeName)
    );
  }

  private isPositiveInteger(value: unknown): boolean {
    return typeof value === 'number' && Number.isInteger(value) && value > 0;
  }

  private isNonEmptyString(value: unknown): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }
}

