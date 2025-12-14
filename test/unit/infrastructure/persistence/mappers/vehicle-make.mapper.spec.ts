import { VehicleMakeMapper } from '@infrastructure/adapters/secondary/persistence/mappers/vehicle-make.mapper';
import {
  VehicleMakeOrmEntity,
  VehicleTypeOrmEntity,
} from '@infrastructure/adapters/secondary/persistence/entities';
import { VehicleMake } from '@domain/entities/vehicle-make.entity';
import { VehicleType } from '@domain/entities/vehicle-type.entity';
import { MakeId } from '@domain/value-objects/make-id.vo';
import { TypeId } from '@domain/value-objects/type-id.vo';

describe('VehicleMakeMapper (Unit)', () => {
  describe('toDomain', () => {
    it('maps ORM entity to domain entity', () => {
      const ormEntity = new VehicleMakeOrmEntity();
      ormEntity.id = '123e4567-e89b-12d3-a456-426614174000';
      ormEntity.makeId = 440;
      ormEntity.makeName = 'ASTON MARTIN';
      ormEntity.vehicleTypes = [];
      ormEntity.createdAt = new Date('2025-01-01T00:00:00Z');
      ormEntity.updatedAt = new Date('2025-01-02T00:00:00Z');

      const domain = VehicleMakeMapper.toDomain(ormEntity);

      expect(domain).toBeInstanceOf(VehicleMake);
      expect(domain.id).toBeInstanceOf(MakeId);
      expect(domain.id.value).toBe(ormEntity.id);
      expect(domain.makeId).toBe(440);
      expect(domain.makeName).toBe('ASTON MARTIN');
      expect(domain.vehicleTypes).toHaveLength(0);
      expect(domain.createdAt).toEqual(ormEntity.createdAt);
      expect(domain.updatedAt).toEqual(ormEntity.updatedAt);
    });

    it('maps vehicle types', () => {
      const typeOrm1 = new VehicleTypeOrmEntity();
      typeOrm1.id = '223e4567-e89b-12d3-a456-426614174000';
      typeOrm1.typeId = 2;
      typeOrm1.typeName = 'Passenger Car';
      typeOrm1.vehicleMakeId = '123e4567-e89b-12d3-a456-426614174000';
      typeOrm1.createdAt = new Date('2025-01-01T00:00:00Z');

      const typeOrm2 = new VehicleTypeOrmEntity();
      typeOrm2.id = '323e4567-e89b-12d3-a456-426614174000';
      typeOrm2.typeId = 7;
      typeOrm2.typeName = 'MPV';
      typeOrm2.vehicleMakeId = '123e4567-e89b-12d3-a456-426614174000';
      typeOrm2.createdAt = new Date('2025-01-01T00:00:00Z');

      const ormEntity = new VehicleMakeOrmEntity();
      ormEntity.id = '123e4567-e89b-12d3-a456-426614174000';
      ormEntity.makeId = 440;
      ormEntity.makeName = 'ASTON MARTIN';
      ormEntity.vehicleTypes = [typeOrm1, typeOrm2];
      ormEntity.createdAt = new Date('2025-01-01T00:00:00Z');
      ormEntity.updatedAt = new Date('2025-01-02T00:00:00Z');

      const domain = VehicleMakeMapper.toDomain(ormEntity);

      expect(domain.vehicleTypes).toHaveLength(2);
      expect(domain.vehicleTypes[0]).toBeInstanceOf(VehicleType);
      expect(domain.vehicleTypes[0].id).toBeInstanceOf(TypeId);
      expect(domain.vehicleTypes[0].typeId).toBe(2);
      expect(domain.vehicleTypes[0].typeName).toBe('Passenger Car');
      expect(domain.vehicleTypes[1].typeId).toBe(7);
    });

    it('creates value objects for IDs', () => {
      const ormEntity = new VehicleMakeOrmEntity();
      ormEntity.id = '123e4567-e89b-12d3-a456-426614174000';
      ormEntity.makeId = 440;
      ormEntity.makeName = 'ASTON MARTIN';
      ormEntity.vehicleTypes = [];
      ormEntity.createdAt = new Date('2025-01-01T00:00:00Z');
      ormEntity.updatedAt = new Date('2025-01-02T00:00:00Z');

      const domain = VehicleMakeMapper.toDomain(ormEntity);

      expect(domain.id.value).toBe(ormEntity.id);
    });
  });

  describe('toORM', () => {
    it('maps domain entity to ORM entity', () => {
      const makeId = MakeId.fromString('123e4567-e89b-12d3-a456-426614174000');
      const domain = VehicleMake.reconstitute({
        id: makeId,
        makeId: 440,
        makeName: 'ASTON MARTIN',
        vehicleTypes: [],
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-02T00:00:00Z'),
      });

      const ormEntity = VehicleMakeMapper.toORM(domain);

      expect(ormEntity).toBeInstanceOf(VehicleMakeOrmEntity);
      expect(ormEntity.id).toBe(makeId.value);
      expect(ormEntity.makeId).toBe(440);
      expect(ormEntity.makeName).toBe('ASTON MARTIN');
      expect(ormEntity.vehicleTypes).toHaveLength(0);
      expect(ormEntity.createdAt).toEqual(domain.createdAt);
      expect(ormEntity.updatedAt).toEqual(domain.updatedAt);
    });

    it('maps vehicle types and sets FK', () => {
      const makeId = MakeId.fromString('123e4567-e89b-12d3-a456-426614174000');
      const typeId = TypeId.fromString('223e4567-e89b-12d3-a456-426614174000');
      const vehicleType = VehicleType.reconstitute({
        id: typeId,
        typeId: 2,
        typeName: 'Passenger Car',
      });

      const domain = VehicleMake.reconstitute({
        id: makeId,
        makeId: 440,
        makeName: 'ASTON MARTIN',
        vehicleTypes: [vehicleType],
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-02T00:00:00Z'),
      });

      const ormEntity = VehicleMakeMapper.toORM(domain);

      expect(ormEntity.vehicleTypes).toHaveLength(1);
      expect(ormEntity.vehicleTypes[0]).toBeInstanceOf(VehicleTypeOrmEntity);
      expect(ormEntity.vehicleTypes[0].vehicleMakeId).toBe(makeId.value);
      expect(ormEntity.vehicleTypes[0].typeId).toBe(2);
      expect(ormEntity.vehicleTypes[0].typeName).toBe('Passenger Car');
    });

    it('round-trips ORM -> Domain -> ORM', () => {
      const ormEntity = new VehicleMakeOrmEntity();
      ormEntity.id = '123e4567-e89b-12d3-a456-426614174000';
      ormEntity.makeId = 440;
      ormEntity.makeName = 'ASTON MARTIN';
      ormEntity.vehicleTypes = [];
      ormEntity.createdAt = new Date('2025-01-01T00:00:00Z');
      ormEntity.updatedAt = new Date('2025-01-02T00:00:00Z');

      const domain = VehicleMakeMapper.toDomain(ormEntity);
      const roundTrip = VehicleMakeMapper.toORM(domain);

      expect(roundTrip.id).toBe(ormEntity.id);
      expect(roundTrip.makeId).toBe(ormEntity.makeId);
      expect(roundTrip.makeName).toBe(ormEntity.makeName);
      expect(roundTrip.createdAt).toEqual(ormEntity.createdAt);
      expect(roundTrip.updatedAt).toEqual(ormEntity.updatedAt);
    });
  });
});

