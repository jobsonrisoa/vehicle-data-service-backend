import { VehicleType } from '@domain/entities/vehicle-type.entity';
import { TypeId } from '@domain/value-objects/type-id.vo';
import { ValidationError } from '@domain/errors/validation-error';

describe('VehicleType (Unit)', () => {
  describe('create', () => {
    it('should create a valid VehicleType', () => {
      const vehicleType = VehicleType.create({
        typeId: 1,
        typeName: 'Passenger Car',
      });

      expect(vehicleType).toBeInstanceOf(VehicleType);
      expect(vehicleType.typeId).toBe(1);
      expect(vehicleType.typeName).toBe('Passenger Car');
      expect(vehicleType.id).toBeInstanceOf(TypeId);
    });

    it('should trim typeName', () => {
      const vehicleType = VehicleType.create({
        typeId: 1,
        typeName: '  Truck  ',
      });

      expect(vehicleType.typeName).toBe('Truck');
    });

    it('should throw ValidationError for negative typeId', () => {
      expect(() =>
        VehicleType.create({
          typeId: -1,
          typeName: 'Passenger Car',
        }),
      ).toThrow(ValidationError);
      expect(() =>
        VehicleType.create({
          typeId: -1,
          typeName: 'Passenger Car',
        }),
      ).toThrow('typeId must be a positive integer');
    });

    it('should throw ValidationError for zero typeId', () => {
      expect(() =>
        VehicleType.create({
          typeId: 0,
          typeName: 'Passenger Car',
        }),
      ).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-integer typeId', () => {
      expect(() =>
        VehicleType.create({
          typeId: 1.5,
          typeName: 'Passenger Car',
        }),
      ).toThrow(ValidationError);
      expect(() =>
        VehicleType.create({
          typeId: 1.5,
          typeName: 'Passenger Car',
        }),
      ).toThrow('typeId must be a positive integer');
    });

    it('should throw ValidationError for empty typeName', () => {
      expect(() =>
        VehicleType.create({
          typeId: 1,
          typeName: '',
        }),
      ).toThrow(ValidationError);
      expect(() =>
        VehicleType.create({
          typeId: 1,
          typeName: '',
        }),
      ).toThrow('typeName cannot be empty');
    });

    it('should throw ValidationError for whitespace-only typeName', () => {
      expect(() =>
        VehicleType.create({
          typeId: 1,
          typeName: '   ',
        }),
      ).toThrow(ValidationError);
      expect(() =>
        VehicleType.create({
          typeId: 1,
          typeName: '   ',
        }),
      ).toThrow('typeName cannot be empty');
    });

    it('should throw ValidationError for null typeName', () => {
      expect(() =>
        VehicleType.create({
          typeId: 1,
          typeName: null as unknown as string,
        }),
      ).toThrow(ValidationError);
    });

    it('should throw ValidationError for undefined typeName', () => {
      expect(() =>
        VehicleType.create({
          typeId: 1,
          typeName: undefined as unknown as string,
        }),
      ).toThrow(ValidationError);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute VehicleType from persistence', () => {
      const id = TypeId.create();
      const vehicleType = VehicleType.reconstitute({
        id,
        typeId: 2,
        typeName: 'Motorcycle',
      });

      expect(vehicleType.id).toBe(id);
      expect(vehicleType.typeId).toBe(2);
      expect(vehicleType.typeName).toBe('Motorcycle');
    });

    it('should throw ValidationError for invalid reconstitution data', () => {
      const id = TypeId.create();

      expect(() =>
        VehicleType.reconstitute({
          id,
          typeId: -1,
          typeName: 'Invalid',
        }),
      ).toThrow(ValidationError);
    });
  });

  describe('equals', () => {
    it('should return true for same typeId', () => {
      const type1 = VehicleType.create({
        typeId: 1,
        typeName: 'Passenger Car',
      });
      const type2 = VehicleType.create({
        typeId: 1,
        typeName: 'Car',
      });

      expect(type1.equals(type2)).toBe(true);
    });

    it('should return false for different typeId', () => {
      const type1 = VehicleType.create({
        typeId: 1,
        typeName: 'Passenger Car',
      });
      const type2 = VehicleType.create({
        typeId: 2,
        typeName: 'Truck',
      });

      expect(type1.equals(type2)).toBe(false);
    });

    it('should return false for null', () => {
      const type = VehicleType.create({
        typeId: 1,
        typeName: 'Passenger Car',
      });

      expect(type.equals(null as unknown as VehicleType)).toBe(false);
    });
  });

  describe('properties', () => {
    it('should expose id as TypeId value object', () => {
      const vehicleType = VehicleType.create({
        typeId: 1,
        typeName: 'Passenger Car',
      });

      expect(vehicleType.id).toBeInstanceOf(TypeId);
    });

    it('should expose typeId as number', () => {
      const vehicleType = VehicleType.create({
        typeId: 5,
        typeName: 'Bus',
      });

      expect(typeof vehicleType.typeId).toBe('number');
      expect(vehicleType.typeId).toBe(5);
    });

    it('should expose typeName as string', () => {
      const vehicleType = VehicleType.create({
        typeId: 1,
        typeName: 'Passenger Car',
      });

      expect(typeof vehicleType.typeName).toBe('string');
      expect(vehicleType.typeName).toBe('Passenger Car');
    });
  });

  describe('toJSON', () => {
    it('should return correct JSON structure', () => {
      const vehicleType = VehicleType.create({
        typeId: 3,
        typeName: 'Truck',
      });

      const json = vehicleType.toJSON();

      expect(json).toEqual({
        id: vehicleType.id.value,
        typeId: 3,
        typeName: 'Truck',
      });
    });
  });

  describe('immutability', () => {
    it('should not allow modification of typeId', () => {
      const vehicleType = VehicleType.create({
        typeId: 1,
        typeName: 'Passenger Car',
      });

      expect(() => {
        (vehicleType as unknown as { typeId: number }).typeId = 999;
      }).toThrow();
    });

    it('should not allow modification of typeName', () => {
      const vehicleType = VehicleType.create({
        typeId: 1,
        typeName: 'Passenger Car',
      });

      expect(() => {
        (vehicleType as unknown as { typeName: string }).typeName = 'Modified';
      }).toThrow();
    });
  });
});
