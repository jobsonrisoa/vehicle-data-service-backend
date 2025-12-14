import 'reflect-metadata';

import { VehicleMakeType } from '@infrastructure/adapters/primary/graphql/types/vehicle-make.type';
import { VehicleTypeType } from '@infrastructure/adapters/primary/graphql/types/vehicle-type.type';

describe('VehicleMakeType', () => {
  it('sets field design types', () => {
    expect(Reflect.getMetadata('design:type', VehicleMakeType.prototype, 'id')).toBe(String);
    expect(Reflect.getMetadata('design:type', VehicleMakeType.prototype, 'makeId')).toBe(Number);
    expect(Reflect.getMetadata('design:type', VehicleMakeType.prototype, 'makeName')).toBe(String);
    expect(Reflect.getMetadata('design:type', VehicleMakeType.prototype, 'vehicleTypes')).toBe(Array);
    expect(Reflect.getMetadata('design:type', VehicleMakeType.prototype, 'createdAt')).toBe(Date);
    expect(Reflect.getMetadata('design:type', VehicleMakeType.prototype, 'updatedAt')).toBe(Date);
  });

  it('links vehicle types', () => {
    const related = Reflect.getMetadata('design:type', VehicleMakeType.prototype, 'vehicleTypes');
    expect(related).toBe(Array);
    expect(VehicleTypeType).toBeDefined();
  });
});

