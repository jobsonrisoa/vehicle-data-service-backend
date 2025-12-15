import { Injectable, Inject } from '@nestjs/common';

import { PaginatedResult, PaginationOptions } from '../dtos/pagination.dto';
import { VehicleMakeDTO } from '../dtos/vehicle-make.dto';
import {
  IQueryVehiclesPort,
  VehicleMakeFilterDTO,
  VehicleCatalogStatsDTO,
} from '../ports/input/query-vehicles.port';
import { IVehicleMakeRepository } from '../ports/output/vehicle-repository.port';
import { VehicleMakeMapper } from '../mappers/vehicle-make.mapper';

@Injectable()
export class VehicleQueryService implements IQueryVehiclesPort {
  constructor(
    @Inject('IVehicleMakeRepository')
    private readonly vehicleMakeRepository: IVehicleMakeRepository,
  ) {}

  async getAll(options: PaginationOptions): Promise<PaginatedResult<VehicleMakeDTO>> {
    const result = await this.vehicleMakeRepository.findAll(options);

    return {
      edges: result.edges.map((edge) => ({
        node: VehicleMakeMapper.toDTO(edge.node),
        cursor: edge.cursor,
      })),
      pageInfo: result.pageInfo,
      totalCount: result.totalCount,
    };
  }

  async getById(makeId: number): Promise<VehicleMakeDTO | null> {
    const vehicleMake = await this.vehicleMakeRepository.findByMakeId(makeId);
    return vehicleMake ? VehicleMakeMapper.toDTO(vehicleMake) : null;
  }

  async search(filter: VehicleMakeFilterDTO): Promise<VehicleMakeDTO[]> {
    const results = await this.vehicleMakeRepository.findByFilter(filter);
    return results.map((make) => VehicleMakeMapper.toDTO(make));
  }

  async getStatistics(): Promise<VehicleCatalogStatsDTO> {
    const totalMakes = await this.vehicleMakeRepository.count();
    return {
      totalMakes,
      totalVehicleTypes: 0,
      lastUpdated: null,
    };
  }
}
