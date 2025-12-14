export interface VehicleTypeDTO {
  readonly id: string;
  readonly typeId: number;
  readonly typeName: string;
}

export interface VehicleMakeDTO {
  readonly id: string;
  readonly makeId: number;
  readonly makeName: string;
  readonly vehicleTypes: VehicleTypeDTO[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

