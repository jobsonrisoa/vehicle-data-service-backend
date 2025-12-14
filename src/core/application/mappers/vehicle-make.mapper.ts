import { VehicleMakeDTO, VehicleMakeSummaryDTO } from '@application/dtos/vehicle-make.dto';
import { VehicleMake } from '@domain/entities/vehicle-make.entity';

import { VehicleTypeMapper } from './vehicle-type.mapper';

export class VehicleMakeMapper {
  static toDTO(entity: VehicleMake): VehicleMakeDTO {
    return {
      id: entity.id.toString(),
      makeId: entity.makeId,
      makeName: entity.makeName,
      vehicleTypes: VehicleTypeMapper.toDTOList(entity.vehicleTypes),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toSummaryDTO(entity: VehicleMake): VehicleMakeSummaryDTO {
    return {
      id: entity.id.toString(),
      makeId: entity.makeId,
      makeName: entity.makeName,
      vehicleTypeCount: entity.vehicleTypes.length,
    };
  }

  static toDTOList(entities: VehicleMake[]): VehicleMakeDTO[] {
    return entities.map((entity) => this.toDTO(entity));
  }

  static toSummaryDTOList(entities: VehicleMake[]): VehicleMakeSummaryDTO[] {
    return entities.map((entity) => this.toSummaryDTO(entity));
  }
}
