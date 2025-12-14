import { AxiosInstance } from 'axios';

import { ExternalMakeDTO, ExternalVehicleTypeDTO } from '@application/dtos/external-api.dto';
import { IExternalVehicleAPIPort } from '@application/ports/output/external-api.port';
import { ExternalApiError } from '@domain/errors/external-api-error';
import { XmlParserService } from '../xml-parser/xml-parser.service';

interface LoggerLike {
  debug: (meta: any, msg?: string) => void;
  info: (meta: any, msg?: string) => void;
  error: (meta: any, msg?: string) => void;
}

export class NhtsaApiClient implements IExternalVehicleAPIPort {
  constructor(
    private readonly httpClient: AxiosInstance,
    private readonly xmlParser: XmlParserService,
    private readonly logger: LoggerLike,
  ) {}

  async getAllMakes(): Promise<ExternalMakeDTO[]> {
    try {
      this.logger.info('Fetching all vehicle makes from NHTSA');
      const response = await this.httpClient.get<string>('/vehicles/getallmakes?format=XML');
      const makes = this.xmlParser.parseVehicleMakes(response.data);
      this.logger.info({ count: makes.length }, 'Fetched vehicle makes');
      return makes.map((make) => ({
        Make_ID: make.Make_ID,
        Make_Name: make.Make_Name,
      }));
    } catch (error) {
      this.logger.error({ error }, 'Failed to fetch vehicle makes');
      throw new ExternalApiError('Failed to fetch vehicle makes from NHTSA', error);
    }
  }

  async getVehicleTypesForMake(makeId: number): Promise<ExternalVehicleTypeDTO[]> {
    try {
      this.logger.debug({ makeId }, 'Fetching vehicle types for make');
      const response = await this.httpClient.get<string>(
        `/vehicles/GetVehicleTypesForMakeId/${makeId}?format=xml`,
      );
      const types = this.xmlParser.parseVehicleTypes(response.data);
      return types.map((type) => ({
        VehicleTypeId: type.VehicleTypeId,
        VehicleTypeName: type.VehicleTypeName,
      }));
    } catch (error) {
      this.logger.error({ error, makeId }, 'Failed to fetch vehicle types');
      throw new ExternalApiError(`Failed to fetch vehicle types for make ${makeId}`, error);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.httpClient.get('/vehicles/getallmakes?format=XML');
      this.logger.debug({ healthy: true }, 'NHTSA API health check result');
      return true;
    } catch (error) {
      this.logger.debug({ healthy: false }, 'NHTSA API health check result');
      return false;
    }
  }
}

