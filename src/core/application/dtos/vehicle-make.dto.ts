import { VehicleTypeDTO } from './vehicle-type.dto';

export interface VehicleMakeDTO {
  readonly id: string;
  readonly makeId: number;
  readonly makeName: string;
  readonly vehicleTypes: VehicleTypeDTO[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface VehicleMakeSummaryDTO {
  readonly id: string;
  readonly makeId: number;
  readonly makeName: string;
  readonly vehicleTypeCount: number;
}
