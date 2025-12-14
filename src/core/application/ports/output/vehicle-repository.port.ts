import { VehicleMake } from '@domain/entities/vehicle-make.entity';
import { MakeId } from '@domain/value-objects/make-id.vo';

export interface PaginationOptions {
  readonly first?: number;
  readonly after?: string | null;
}

export interface PageInfo {
  readonly hasNextPage: boolean;
  readonly endCursor: string | null;
}

export interface PaginatedResult<T> {
  readonly edges: T[];
  readonly pageInfo: PageInfo;
  readonly totalCount: number;
}

export interface VehicleMakeFilter {
  readonly makeNameContains?: string;
  readonly hasVehicleType?: number;
  readonly createdAfter?: Date;
  readonly createdBefore?: Date;
}

export interface IVehicleMakeRepository {
  save(vehicleMake: VehicleMake): Promise<void>;
  saveMany(vehicleMakes: VehicleMake[]): Promise<void>;
  findByMakeId(makeId: number): Promise<VehicleMake | null>;
  findById(id: MakeId): Promise<VehicleMake | null>;
  findAll(options: PaginationOptions): Promise<PaginatedResult<VehicleMake>>;
  findByFilter(filter: VehicleMakeFilter): Promise<VehicleMake[]>;
  count(): Promise<number>;
  deleteAll(): Promise<void>;
}

