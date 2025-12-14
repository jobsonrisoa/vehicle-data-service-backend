import { TransformXmlToJsonUseCase } from '@application/use-cases/transform-xml-to-json.use-case';
import { ExternalMakeDTO, ExternalVehicleTypeDTO } from '@application/dtos/external-api.dto';
import { TransformationError } from '@domain/errors/transformation-error';
import { ValidationError } from '@domain/errors/validation-error';

describe('TransformXmlToJsonUseCase (Unit)', () => {
  let useCase: TransformXmlToJsonUseCase;

  beforeEach(() => {
    useCase = new TransformXmlToJsonUseCase();
  });

  describe('transformMakes', () => {
    it('should transform external makes to domain models', () => {
      const externalMakes: ExternalMakeDTO[] = [
        { Make_ID: 440, Make_Name: 'Audi' },
        { Make_ID: 441, Make_Name: 'BMW' },
        { Make_ID: 442, Make_Name: 'Mercedes-Benz' },
      ];

      const result = useCase.transformMakes(externalMakes);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        makeId: 440,
        makeName: 'Audi',
      });
      expect(result[1]).toEqual({
        makeId: 441,
        makeName: 'BMW',
      });
      expect(result[2]).toEqual({
        makeId: 442,
        makeName: 'Mercedes-Benz',
      });
    });

    it('should handle empty makes array', () => {
      const result = useCase.transformMakes([]);

      expect(result).toEqual([]);
    });

    it('should skip invalid makes with missing Make_ID', () => {
      const externalMakes: ExternalMakeDTO[] = [
        { Make_ID: 440, Make_Name: 'Audi' },
        { Make_ID: null as any, Make_Name: 'Invalid' },
        { Make_ID: 442, Make_Name: 'BMW' },
      ];

      const result = useCase.transformMakes(externalMakes);

      expect(result).toHaveLength(2);
      expect(result[0].makeId).toBe(440);
      expect(result[1].makeId).toBe(442);
    });

    it('should skip invalid makes with missing Make_Name', () => {
      const externalMakes: ExternalMakeDTO[] = [
        { Make_ID: 440, Make_Name: 'Audi' },
        { Make_ID: 441, Make_Name: '' },
        { Make_ID: 442, Make_Name: 'BMW' },
      ];

      const result = useCase.transformMakes(externalMakes);

      expect(result).toHaveLength(2);
      expect(result[0].makeId).toBe(440);
      expect(result[1].makeId).toBe(442);
    });

    it('should trim make names', () => {
      const externalMakes: ExternalMakeDTO[] = [{ Make_ID: 440, Make_Name: '  Audi  ' }];

      const result = useCase.transformMakes(externalMakes);

      expect(result[0].makeName).toBe('Audi');
    });

    it('should skip makes with negative Make_ID', () => {
      const externalMakes: ExternalMakeDTO[] = [
        { Make_ID: 440, Make_Name: 'Audi' },
        { Make_ID: -1, Make_Name: 'Invalid' },
        { Make_ID: 442, Make_Name: 'BMW' },
      ];

      const result = useCase.transformMakes(externalMakes);

      expect(result).toHaveLength(2);
    });
  });

  describe('transformVehicleTypes', () => {
    it('should transform external types to domain models', () => {
      const externalTypes: ExternalVehicleTypeDTO[] = [
        { VehicleTypeId: 1, VehicleTypeName: 'Passenger Car' },
        { VehicleTypeId: 2, VehicleTypeName: 'Truck' },
        { VehicleTypeId: 3, VehicleTypeName: 'Motorcycle' },
      ];

      const result = useCase.transformVehicleTypes(externalTypes);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        typeId: 1,
        typeName: 'Passenger Car',
      });
      expect(result[1]).toEqual({
        typeId: 2,
        typeName: 'Truck',
      });
      expect(result[2]).toEqual({
        typeId: 3,
        typeName: 'Motorcycle',
      });
    });

    it('should handle empty types array', () => {
      const result = useCase.transformVehicleTypes([]);

      expect(result).toEqual([]);
    });

    it('should remove duplicate types by VehicleTypeId', () => {
      const externalTypes: ExternalVehicleTypeDTO[] = [
        { VehicleTypeId: 1, VehicleTypeName: 'Passenger Car' },
        { VehicleTypeId: 1, VehicleTypeName: 'Car' },
        { VehicleTypeId: 2, VehicleTypeName: 'Truck' },
      ];

      const result = useCase.transformVehicleTypes(externalTypes);

      expect(result).toHaveLength(2);
      expect(result[0].typeId).toBe(1);
      expect(result[1].typeId).toBe(2);
    });

    it('should skip invalid types with missing VehicleTypeId', () => {
      const externalTypes: ExternalVehicleTypeDTO[] = [
        { VehicleTypeId: 1, VehicleTypeName: 'Passenger Car' },
        { VehicleTypeId: null as any, VehicleTypeName: 'Invalid' },
        { VehicleTypeId: 2, VehicleTypeName: 'Truck' },
      ];

      const result = useCase.transformVehicleTypes(externalTypes);

      expect(result).toHaveLength(2);
    });

    it('should trim type names', () => {
      const externalTypes: ExternalVehicleTypeDTO[] = [
        { VehicleTypeId: 1, VehicleTypeName: '  Passenger Car  ' },
      ];

      const result = useCase.transformVehicleTypes(externalTypes);

      expect(result[0].typeName).toBe('Passenger Car');
    });
  });

  describe('combineData', () => {
    it('should combine makes with their types', () => {
      const makes = [
        { makeId: 440, makeName: 'Audi' },
        { makeId: 441, makeName: 'BMW' },
      ];

      const typesMap = new Map([
        [440, [{ typeId: 1, typeName: 'Passenger Car' }]],
        [441, [{ typeId: 2, typeName: 'Truck' }]],
      ]);

      const result = useCase.combineData(makes, typesMap);

      expect(result).toHaveLength(2);
      expect(result[0].makeId).toBe(440);
      expect(result[0].makeName).toBe('Audi');
      expect(result[0].vehicleTypes).toHaveLength(1);
      expect(result[0].vehicleTypes[0].typeId).toBe(1);

      expect(result[1].makeId).toBe(441);
      expect(result[1].makeName).toBe('BMW');
      expect(result[1].vehicleTypes).toHaveLength(1);
      expect(result[1].vehicleTypes[0].typeId).toBe(2);
    });

    it('should handle makes without types', () => {
      const makes = [
        { makeId: 440, makeName: 'Audi' },
        { makeId: 441, makeName: 'BMW' },
      ];

      const typesMap = new Map([[440, [{ typeId: 1, typeName: 'Passenger Car' }]]]);

      const result = useCase.combineData(makes, typesMap);

      expect(result).toHaveLength(2);
      expect(result[0].vehicleTypes).toHaveLength(1);
      expect(result[1].vehicleTypes).toHaveLength(0);
    });

    it('should handle multiple types per make', () => {
      const makes = [{ makeId: 440, makeName: 'Audi' }];

      const typesMap = new Map([
        [
          440,
          [
            { typeId: 1, typeName: 'Passenger Car' },
            { typeId: 2, typeName: 'Truck' },
            { typeId: 3, typeName: 'SUV' },
          ],
        ],
      ]);

      const result = useCase.combineData(makes, typesMap);

      expect(result).toHaveLength(1);
      expect(result[0].vehicleTypes).toHaveLength(3);
    });
  });

  describe('execute', () => {
    it('should transform complete external data to domain format', () => {
      const externalMakes: ExternalMakeDTO[] = [
        { Make_ID: 440, Make_Name: 'Audi' },
        { Make_ID: 441, Make_Name: 'BMW' },
      ];

      const externalTypesMap = new Map<number, ExternalVehicleTypeDTO[]>([
        [440, [{ VehicleTypeId: 1, VehicleTypeName: 'Passenger Car' }]],
        [441, [{ VehicleTypeId: 2, VehicleTypeName: 'Truck' }]],
      ]);

      const result = useCase.execute(externalMakes, externalTypesMap);

      expect(result).toHaveLength(2);
      expect(result[0].makeId).toBe(440);
      expect(result[0].makeName).toBe('Audi');
      expect(result[0].vehicleTypes).toHaveLength(1);

      expect(result[1].makeId).toBe(441);
      expect(result[1].makeName).toBe('BMW');
      expect(result[1].vehicleTypes).toHaveLength(1);
    });

    it('should throw TransformationError for null makes', () => {
      expect(() => {
        useCase.execute(null as any, new Map());
      }).toThrow(TransformationError);
    });

    it('should throw TransformationError for null types map', () => {
      expect(() => {
        useCase.execute([], null as any);
      }).toThrow(TransformationError);
    });

    it('should handle empty data gracefully', () => {
      const result = useCase.execute([], new Map());

      expect(result).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should provide detailed error messages', () => {
      try {
        useCase.execute(null as any, new Map());
        fail('Should have thrown TransformationError');
      } catch (error) {
        expect(error).toBeInstanceOf(TransformationError);
        expect((error as TransformationError).message).toContain('makes');
      }
    });

    it('should handle malformed data without crashing', () => {
      const malformedMakes = [
        { Make_ID: 440, Make_Name: 'Audi' },
        {} as any,
        { Make_ID: 442, Make_Name: 'BMW' },
      ];

      const result = useCase.transformMakes(malformedMakes);

      expect(result).toHaveLength(2);
    });
  });

  describe('data validation', () => {
    it('should validate make IDs are positive integers', () => {
      const invalidMakes: ExternalMakeDTO[] = [
        { Make_ID: 0, Make_Name: 'Invalid' },
        { Make_ID: 1.5, Make_Name: 'Invalid' },
        { Make_ID: -10, Make_Name: 'Invalid' },
      ];

      const result = useCase.transformMakes(invalidMakes);

      expect(result).toEqual([]);
    });

    it('should validate type IDs are positive integers', () => {
      const invalidTypes: ExternalVehicleTypeDTO[] = [
        { VehicleTypeId: 0, VehicleTypeName: 'Invalid' },
        { VehicleTypeId: 1.5, VehicleTypeName: 'Invalid' },
        { VehicleTypeId: -10, VehicleTypeName: 'Invalid' },
      ];

      const result = useCase.transformVehicleTypes(invalidTypes);

      expect(result).toEqual([]);
    });
  });
});

