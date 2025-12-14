import { VehicleMake } from '@domain/entities/vehicle-make.entity';
import { VehicleType } from '@domain/entities/vehicle-type.entity';
import { MakeId } from '@domain/value-objects/make-id.vo';
import { TypeId } from '@domain/value-objects/type-id.vo';

import { VehicleMakeOrmEntity, VehicleTypeOrmEntity } from '../entities';

export class VehicleMakeMapper {
  static toDomain(ormEntity: VehicleMakeOrmEntity): VehicleMake {
    const makeId = MakeId.fromString(ormEntity.id);
    const vehicleTypes = (ormEntity.vehicleTypes || []).map((typeOrm) => this.vehicleTypeToDomain(typeOrm));

    return VehicleMake.reconstitute({
      id: makeId,
      makeId: ormEntity.makeId,
      makeName: ormEntity.makeName,
      vehicleTypes,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toORM(domainEntity: VehicleMake): VehicleMakeOrmEntity {
    const ormEntity = new VehicleMakeOrmEntity();
    ormEntity.id = domainEntity.id.value;
    ormEntity.makeId = domainEntity.makeId;
    ormEntity.makeName = domainEntity.makeName;
    ormEntity.createdAt = domainEntity.createdAt;
    ormEntity.updatedAt = domainEntity.updatedAt;
    ormEntity.vehicleTypes = domainEntity.vehicleTypes.map((vt) =>
      this.vehicleTypeToORM(vt, domainEntity.id.value),
    );
    return ormEntity;
  }

  private static vehicleTypeToDomain(ormEntity: VehicleTypeOrmEntity): VehicleType {
    const typeId = TypeId.fromString(ormEntity.id);
    return VehicleType.reconstitute({
      id: typeId,
      typeId: ormEntity.typeId,
      typeName: ormEntity.typeName,
    });
  }

  private static vehicleTypeToORM(domainEntity: VehicleType, vehicleMakeId: string): VehicleTypeOrmEntity {
    const ormEntity = new VehicleTypeOrmEntity();
    ormEntity.id = domainEntity.id.value;
    ormEntity.typeId = domainEntity.typeId;
    ormEntity.typeName = domainEntity.typeName;
    ormEntity.vehicleMakeId = vehicleMakeId;
    return ormEntity;
  }
}

