import 'reflect-metadata';

import {
  VehicleMakeConnection,
  VehicleMakeEdge,
  PageInfo,
} from '@infrastructure/adapters/primary/graphql/types/pagination.type';
import { VehicleMakeType } from '@infrastructure/adapters/primary/graphql/types/vehicle-make.type';

describe('Pagination types', () => {
  it('VehicleMakeEdge design types', () => {
    expect(Reflect.getMetadata('design:type', VehicleMakeEdge.prototype, 'cursor')).toBe(String);
    expect(Reflect.getMetadata('design:type', VehicleMakeEdge.prototype, 'node')).toBe(VehicleMakeType);
  });

  it('PageInfo design types', () => {
    expect(Reflect.getMetadata('design:type', PageInfo.prototype, 'hasNextPage')).toBe(Boolean);
    expect(Reflect.getMetadata('design:type', PageInfo.prototype, 'hasPreviousPage')).toBe(Boolean);
    expect(Reflect.getMetadata('design:type', PageInfo.prototype, 'startCursor')).toBe(String);
    expect(Reflect.getMetadata('design:type', PageInfo.prototype, 'endCursor')).toBe(String);
  });

  it('VehicleMakeConnection design types', () => {
    expect(Reflect.getMetadata('design:type', VehicleMakeConnection.prototype, 'edges')).toBe(Array);
    expect(Reflect.getMetadata('design:type', VehicleMakeConnection.prototype, 'pageInfo')).toBe(PageInfo);
    expect(Reflect.getMetadata('design:type', VehicleMakeConnection.prototype, 'totalCount')).toBe(Number);
  });
});

