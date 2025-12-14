import 'reflect-metadata';

import { VehicleTypeType } from '@infrastructure/adapters/primary/graphql/types/vehicle-type.type';

describe('VehicleTypeType', () => {
  it('sets field design types', () => {
    expect(Reflect.getMetadata('design:type', VehicleTypeType.prototype, 'id')).toBe(String);
    expect(Reflect.getMetadata('design:type', VehicleTypeType.prototype, 'typeId')).toBe(Number);
    expect(Reflect.getMetadata('design:type', VehicleTypeType.prototype, 'typeName')).toBe(String);
    expect(Reflect.getMetadata('design:type', VehicleTypeType.prototype, 'createdAt')).toBe(Date);
  });
});

