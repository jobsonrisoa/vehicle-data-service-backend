import { Inject } from '@nestjs/common';
import { Resolver, Query, Args, Int } from '@nestjs/graphql';

import { VehicleMakeType } from '../types/vehicle-make.type';
import { VehicleMakeConnection } from '../types/pagination.type';
import { VehicleMakeFilterInput } from '../inputs/vehicle-make-filter.input';
import { IQueryVehiclesPort } from '@core/application/ports/input/query-vehicles.port';
import { VehicleMakeDTO } from '@core/application/dtos/vehicle-make.dto';
import { PaginatedResult, PaginationOptions } from '@core/application/dtos/pagination.dto';
import { VehicleMakeEdge } from '../types/pagination.type';
import { VehicleTypeType } from '../types/vehicle-type.type';

@Resolver(() => VehicleMakeType)
export class VehicleResolver {
  constructor(
    @Inject('IQueryVehiclesPort')
    private readonly queryVehiclesPort: IQueryVehiclesPort
  ) {}

  @Query(() => VehicleMakeConnection, { name: 'vehicleMakes' })
  async vehicleMakes(
    @Args('first', { type: () => Int, nullable: true, defaultValue: 20 })
    first: number,
    @Args('after', { type: () => String, nullable: true })
    after?: string,
    @Args('filter', { type: () => VehicleMakeFilterInput, nullable: true })
    filter?: VehicleMakeFilterInput
  ): Promise<VehicleMakeConnection> {
    const options = { first, after, filter } as any;
    return this.queryVehiclesPort.getAll(options).then((result) => this.toConnection(result));
  }

  @Query(() => VehicleMakeType, { name: 'vehicleMake', nullable: true })
  async vehicleMake(
    @Args('makeId', { type: () => Int })
    makeId: number
  ): Promise<VehicleMakeType | null> {
    if (makeId <= 0) {
      throw new Error('makeId must be positive');
    }

    const dto = await this.queryVehiclesPort.getById(makeId);
    return dto ? this.toVehicleMake(dto) : null;
  }

  private toConnection(result: PaginatedResult<VehicleMakeDTO>): VehicleMakeConnection {
    const edges: VehicleMakeEdge[] = result.edges.map((edge) => ({
      cursor: edge.cursor,
      node: this.toVehicleMake(edge.node),
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage: result.pageInfo.hasNextPage,
        hasPreviousPage: result.pageInfo.hasPreviousPage,
        startCursor: result.pageInfo.startCursor || undefined,
        endCursor: result.pageInfo.endCursor || undefined,
      },
      totalCount: result.totalCount,
    };
  }

  private toVehicleMake(dto: VehicleMakeDTO): VehicleMakeType {
    return {
      id: dto.id,
      makeId: dto.makeId,
      makeName: dto.makeName,
      vehicleTypes: dto.vehicleTypes.map((type) => this.toVehicleType(type)),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    };
  }

  private toVehicleType(dto: { id: string; typeId: number; typeName: string }): VehicleTypeType {
    return {
      id: dto.id,
      typeId: dto.typeId,
      typeName: dto.typeName,
    };
  }
}

