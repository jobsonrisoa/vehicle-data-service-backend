import 'reflect-metadata';

import { PaginationInput, VehicleMakeFilterInput } from '@infrastructure/adapters/primary/graphql/inputs/vehicle-make-filter.input';

describe('GraphQL inputs', () => {
  it('VehicleMakeFilterInput design types', () => {
    expect(Reflect.getMetadata('design:type', VehicleMakeFilterInput.prototype, 'makeName')).toBe(String);
    expect(Reflect.getMetadata('design:type', VehicleMakeFilterInput.prototype, 'hasVehicleTypes')).toBe(Boolean);
  });

  it('PaginationInput design types', () => {
    expect(Reflect.getMetadata('design:type', PaginationInput.prototype, 'first')).toBe(Number);
    expect(Reflect.getMetadata('design:type', PaginationInput.prototype, 'after')).toBe(String);
  });
});

