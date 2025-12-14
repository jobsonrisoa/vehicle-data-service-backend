import { VehicleMake } from '@domain/entities/vehicle-make.entity';
import { VehicleType } from '@domain/entities/vehicle-type.entity';
import { MakeId } from '@domain/value-objects/make-id.vo';
import { ValidationError } from '@domain/errors/validation-error';

describe('VehicleMake (Unit)', () => {
  describe('create', () => {
    it('should create a valid VehicleMake', () => {
      const vehicleMake = VehicleMake.create({
        makeId: 440,
        makeName: 'ASTON MARTIN',
      });

      expect(vehicleMake).toBeInstanceOf(VehicleMake);
      expect(vehicleMake.makeId).toBe(440);
      expect(vehicleMake.makeName).toBe('ASTON MARTIN');
      expect(vehicleMake.id).toBeInstanceOf(MakeId);
      expect(vehicleMake.vehicleTypes).toEqual([]);
    });

    it('should create with empty vehicleTypes array', () => {
      const vehicleMake = VehicleMake.create({
        makeId: 440,
        makeName: 'ASTON MARTIN',
      });

      expect(vehicleMake.vehicleTypes).toHaveLength(0);
    });

    it('should trim makeName', () => {
      const vehicleMake = VehicleMake.create({
        makeId: 440,
        makeName: '  ASTON MARTIN  ',
      });

      expect(vehicleMake.makeName).toBe('ASTON MARTIN');
    });

    it('should set createdAt and updatedAt timestamps', () => {
      const beforeCreate = new Date();
      const vehicleMake = VehicleMake.create({
        makeId: 440,
        makeName: 'ASTON MARTIN',
      });
      const afterCreate = new Date();

      expect(vehicleMake.createdAt).toBeInstanceOf(Date);
      expect(vehicleMake.updatedAt).toBeInstanceOf(Date);
      expect(vehicleMake.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(vehicleMake.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(vehicleMake.createdAt).toEqual(vehicleMake.updatedAt);
    });

    it('should throw ValidationError for negative makeId', () => {
      expect(() =>
        VehicleMake.create({
          makeId: -1,
          makeName: 'ASTON MARTIN',
        }),
      ).toThrow(ValidationError);
      expect(() =>
        VehicleMake.create({
          makeId: -1,
          makeName: 'ASTON MARTIN',
        }),
      ).toThrow('makeId must be a positive integer');
    });

    it('should throw ValidationError for zero makeId', () => {
      expect(() =>
        VehicleMake.create({
          makeId: 0,
          makeName: 'ASTON MARTIN',
        }),
      ).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-integer makeId', () => {
      expect(() =>
        VehicleMake.create({
          makeId: 440.5,
          makeName: 'ASTON MARTIN',
        }),
      ).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty makeName', () => {
      expect(() =>
        VehicleMake.create({
          makeId: 440,
          makeName: '',
        }),
      ).toThrow(ValidationError);
      expect(() =>
        VehicleMake.create({
          makeId: 440,
          makeName: '',
        }),
      ).toThrow('makeName cannot be empty');
    });

    it('should throw ValidationError for whitespace-only makeName', () => {
      expect(() =>
        VehicleMake.create({
          makeId: 440,
          makeName: '   ',
        }),
      ).toThrow(ValidationError);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute VehicleMake from persistence', () => {
      const id = MakeId.create();
      const createdAt = new Date('2025-01-01T00:00:00Z');
      const updatedAt = new Date('2025-01-02T00:00:00Z');
      const vehicleType = VehicleType.create({
        typeId: 2,
        typeName: 'Passenger Car',
      });

      const vehicleMake = VehicleMake.reconstitute({
        id,
        makeId: 440,
        makeName: 'ASTON MARTIN',
        vehicleTypes: [vehicleType],
        createdAt,
        updatedAt,
      });

      expect(vehicleMake.id).toBe(id);
      expect(vehicleMake.makeId).toBe(440);
      expect(vehicleMake.makeName).toBe('ASTON MARTIN');
      expect(vehicleMake.vehicleTypes).toHaveLength(1);
      expect(vehicleMake.createdAt).toEqual(createdAt);
      expect(vehicleMake.updatedAt).toEqual(updatedAt);
    });
  });

  describe('equals', () => {
    it('should return true for reconstituted aggregate with same ID', () => {
      const id = MakeId.create();
      const make1 = VehicleMake.reconstitute({
        id,
        makeId: 440,
        makeName: 'ASTON MARTIN',
        vehicleTypes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const make2 = VehicleMake.reconstitute({
        id,
        makeId: 440,
        makeName: 'ASTON MARTIN',
        vehicleTypes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(make1.equals(make2)).toBe(true);
    });

    it('should return false for different IDs', () => {
      const make1 = VehicleMake.create({
        makeId: 440,
        makeName: 'ASTON MARTIN',
      });
      const make2 = VehicleMake.create({
        makeId: 440,
        makeName: 'ASTON MARTIN',
      });

      expect(make1.equals(make2)).toBe(false);
    });
  });

  describe('addVehicleType', () => {
    it('should add a vehicle type', () => {
      const vehicleMake = VehicleMake.create({
        makeId: 440,
        makeName: 'ASTON MARTIN',
      });
      const vehicleType = VehicleType.create({
        typeId: 2,
        typeName: 'Passenger Car',
      });

      vehicleMake.addVehicleType(vehicleType);

      expect(vehicleMake.vehicleTypes).toHaveLength(1);
      expect(vehicleMake.vehicleTypes[0]).toBe(vehicleType);
    });

    it('should not add duplicate vehicle type', () => {
      const vehicleMake = VehicleMake.create({
        makeId: 440,
        makeName: 'ASTON MARTIN',
      });
      const vehicleType = VehicleType.create({
        typeId: 2,
        typeName: 'Passenger Car',
      });

      vehicleMake.addVehicleType(vehicleType);
      vehicleMake.addVehicleType(vehicleType);

      expect(vehicleMake.vehicleTypes).toHaveLength(1);
    });

    it('should not add vehicle type with duplicate typeId', () => {
      const vehicleMake = VehicleMake.create({
        makeId: 440,
        makeName: 'ASTON MARTIN',
      });
      const type1 = VehicleType.create({
        typeId: 2,
        typeName: 'Passenger Car',
      });
      const type2 = VehicleType.create({
        typeId: 2,
        typeName: 'Car',
      });

      vehicleMake.addVehicleType(type1);
      vehicleMake.addVehicleType(type2);

      expect(vehicleMake.vehicleTypes).toHaveLength(1);
      expect(vehicleMake.vehicleTypes[0]).toBe(type1);
    });

    it('should update updatedAt timestamp', () => {
      const vehicleMake = VehicleMake.create({
        makeId: 440,
        makeName: 'ASTON MARTIN',
      });
      const originalUpdatedAt = vehicleMake.updatedAt;

      const vehicleType = VehicleType.create({
        typeId: 2,
        typeName: 'Passenger Car',
      });

      vehicleMake.addVehicleType(vehicleType);

      expect(vehicleMake.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('removeVehicleType', () => {
    it('should remove existing vehicle type', () => {
      const vehicleMake = VehicleMake.create({
        makeId: 440,
        makeName: 'ASTON MARTIN',
      });
      const vehicleType = VehicleType.create({
        typeId: 2,
        typeName: 'Passenger Car',
      });

      vehicleMake.addVehicleType(vehicleType);
      expect(vehicleMake.vehicleTypes).toHaveLength(1);

      vehicleMake.removeVehicleType(vehicleType.typeId);
      expect(vehicleMake.vehicleTypes).toHaveLength(0);
    });

    it('should do nothing for non-existent type', () => {
      const vehicleMake = VehicleMake.create({
        makeId: 440,
        makeName: 'ASTON MARTIN',
      });

      vehicleMake.removeVehicleType(999);

      expect(vehicleMake.vehicleTypes).toHaveLength(0);
    });

    it('should update updatedAt timestamp', () => {
      const vehicleMake = VehicleMake.create({
        makeId: 440,
        makeName: 'ASTON MARTIN',
      });
      const vehicleType = VehicleType.create({
        typeId: 2,
        typeName: 'Passenger Car',
      });
      vehicleMake.addVehicleType(vehicleType);

      const originalUpdatedAt = vehicleMake.updatedAt;

      vehicleMake.removeVehicleType(vehicleType.typeId);

      expect(vehicleMake.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('updateVehicleTypes', () => {
    it('should replace all vehicle types', () => {
      const vehicleMake = VehicleMake.create({
        makeId: 440,
        makeName: 'ASTON MARTIN',
      });
      const type1 = VehicleType.create({
        typeId: 2,
        typeName: 'Passenger Car',
      });
      vehicleMake.addVehicleType(type1);

      const type2 = VehicleType.create({
        typeId: 3,
        typeName: 'Truck',
      });
      const type3 = VehicleType.create({
        typeId: 7,
        typeName: 'Multipurpose Passenger Vehicle (MPV)',
      });

      vehicleMake.updateVehicleTypes([type2, type3]);

      expect(vehicleMake.vehicleTypes).toHaveLength(2);
      expect(vehicleMake.vehicleTypes[0]).toBe(type2);
      expect(vehicleMake.vehicleTypes[1]).toBe(type3);
    });

    it('should remove duplicates', () => {
      const vehicleMake = VehicleMake.create({
        makeId: 440,
        makeName: 'ASTON MARTIN',
      });
      const type1 = VehicleType.create({
        typeId: 2,
        typeName: 'Passenger Car',
      });
      const type2 = VehicleType.create({
        typeId: 2,
        typeName: 'Car',
      });

      vehicleMake.updateVehicleTypes([type1, type2]);

      expect(vehicleMake.vehicleTypes).toHaveLength(1);
    });

    it('should update updatedAt timestamp', () => {
      const vehicleMake = VehicleMake.create({
        makeId: 440,
        makeName: 'ASTON MARTIN',
      });
      const originalUpdatedAt = vehicleMake.updatedAt;

      const type = VehicleType.create({
        typeId: 2,
        typeName: 'Passenger Car',
      });
      vehicleMake.updateVehicleTypes([type]);

      expect(vehicleMake.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });
  });

  describe('toJSON', () => {
    it('should return correct JSON structure', () => {
      const vehicleMake = VehicleMake.create({
        makeId: 440,
        makeName: 'ASTON MARTIN',
      });
      const vehicleType = VehicleType.create({
        typeId: 2,
        typeName: 'Passenger Car',
      });
      vehicleMake.addVehicleType(vehicleType);

      const json = vehicleMake.toJSON();

      expect(json).toEqual({
        id: vehicleMake.id.value,
        makeId: 440,
        makeName: 'ASTON MARTIN',
        vehicleTypes: [
          {
            id: vehicleType.id.value,
            typeId: 2,
            typeName: 'Passenger Car',
          },
        ],
        createdAt: vehicleMake.createdAt.toISOString(),
        updatedAt: vehicleMake.updatedAt.toISOString(),
      });
    });
  });

  describe('invariants', () => {
    it('should not allow duplicate typeIds in vehicleTypes', () => {
      const vehicleMake = VehicleMake.create({
        makeId: 440,
        makeName: 'ASTON MARTIN',
      });
      const type1 = VehicleType.create({
        typeId: 2,
        typeName: 'Passenger Car',
      });
      const type2 = VehicleType.create({
        typeId: 2,
        typeName: 'Different Name',
      });

      vehicleMake.addVehicleType(type1);
      vehicleMake.addVehicleType(type2);

      expect(vehicleMake.vehicleTypes).toHaveLength(1);
    });

    it('should maintain immutability of internal collections', () => {
      const vehicleMake = VehicleMake.create({
        makeId: 440,
        makeName: 'ASTON MARTIN',
      });
      const type = VehicleType.create({
        typeId: 2,
        typeName: 'Passenger Car',
      });
      vehicleMake.addVehicleType(type);

      const types = vehicleMake.vehicleTypes;

      expect(() => {
        (types as unknown as Array<unknown>).push(
          VehicleType.create({ typeId: 3, typeName: 'Truck' }),
        );
      }).toThrow();
    });
  });
});
