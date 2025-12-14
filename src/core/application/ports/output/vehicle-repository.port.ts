import { PaginatedResult, PaginationOptions } from '@application/dtos/pagination.dto';
import { VehicleMake } from '@domain/entities/vehicle-make.entity';
import { MakeId } from '@domain/value-objects/make-id.vo';

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
  findByIds(ids: MakeId[]): Promise<VehicleMake[]>;
  findAll(options: PaginationOptions): Promise<PaginatedResult<VehicleMake>>;
  findByFilter(filter: VehicleMakeFilter): Promise<VehicleMake[]>;
  count(): Promise<number>;
  deleteAll(): Promise<void>;
}
