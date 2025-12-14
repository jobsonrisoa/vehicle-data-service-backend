import { PaginatedResult, PaginationOptions } from '../../dtos/pagination.dto';
import { VehicleMakeDTO } from '../../dtos/vehicle-make.dto';

export interface VehicleMakeFilterDTO {
  readonly makeNameContains?: string;
  readonly hasVehicleType?: number;
  readonly createdAfter?: Date;
  readonly createdBefore?: Date;
}

export interface VehicleCatalogStatsDTO {
  readonly totalMakes: number;
  readonly totalVehicleTypes: number;
  readonly lastUpdated: Date | null;
}

export interface IQueryVehiclesPort {
  getAll(options: PaginationOptions): Promise<PaginatedResult<VehicleMakeDTO>>;
  getById(makeId: number): Promise<VehicleMakeDTO | null>;
  search(filter: VehicleMakeFilterDTO): Promise<VehicleMakeDTO[]>;
  getStatistics(): Promise<VehicleCatalogStatsDTO>;
}

