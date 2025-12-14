export interface ExternalMakeDTO {
  readonly Make_ID: number;
  readonly Make_Name: string;
}

export interface ExternalVehicleTypeDTO {
  readonly VehicleTypeId: number;
  readonly VehicleTypeName: string;
}

export interface ExternalMakesResponse {
  readonly Count: number;
  readonly Message: string;
  readonly SearchCriteria: string | null;
  readonly Results: ExternalMakeDTO[];
}

export interface ExternalVehicleTypesResponse {
  readonly Count: number;
  readonly Message: string;
  readonly SearchCriteria: string | null;
  readonly Results: ExternalVehicleTypeDTO[];
}
