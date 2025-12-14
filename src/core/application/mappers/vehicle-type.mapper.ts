import { VehicleTypeDTO } from '@application/dtos/vehicle-type.dto';
import { VehicleType } from '@domain/entities/vehicle-type.entity';

export class VehicleTypeMapper {
  static toDTO(entity: VehicleType): VehicleTypeDTO {
    return {
      id: entity.id.toString(),
      typeId: entity.typeId,
      typeName: entity.typeName,
    };
  }

  static toDTOList(entities: ReadonlyArray<VehicleType>): VehicleTypeDTO[] {
    return entities.map((entity) => this.toDTO(entity));
  }
}
