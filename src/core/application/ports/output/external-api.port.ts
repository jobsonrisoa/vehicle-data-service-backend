export interface ExternalMakeDTO {
  readonly Make_ID: number;
  readonly Make_Name: string;
}

export interface ExternalVehicleTypeDTO {
  readonly VehicleTypeId: number;
  readonly VehicleTypeName: string;
}

export interface IExternalVehicleAPIPort {
  getAllMakes(): Promise<ExternalMakeDTO[]>;
  getVehicleTypesForMake(makeId: number): Promise<ExternalVehicleTypeDTO[]>;
  healthCheck(): Promise<boolean>;
}
