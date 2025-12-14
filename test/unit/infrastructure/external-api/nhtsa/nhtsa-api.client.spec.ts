import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import { ExternalApiError } from '@domain/errors/external-api-error';
import { NhtsaApiClient } from '@infrastructure/adapters/secondary/external-api/nhtsa/nhtsa-api.client';
import { XmlParserService } from '@infrastructure/adapters/secondary/external-api/xml-parser/xml-parser.service';

describe('NhtsaApiClient', () => {
  let client: NhtsaApiClient;
  let mockAxios: MockAdapter;
  let xmlParser: XmlParserService;
  let logger: any;

  const makesXml = `
    <?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Results>
        <AllVehicleMakes>
          <Make_ID>440</Make_ID>
          <Make_Name>ASTON MARTIN</Make_Name>
        </AllVehicleMakes>
        <AllVehicleMakes>
          <Make_ID>441</Make_ID>
          <Make_Name>TESLA</Make_Name>
        </AllVehicleMakes>
      </Results>
    </Response>
  `;

  const typesXml = `
    <?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Results>
        <VehicleTypesForMakeIds>
          <VehicleTypeId>2</VehicleTypeId>
          <VehicleTypeName>Passenger Car</VehicleTypeName>
        </VehicleTypesForMakeIds>
        <VehicleTypesForMakeIds>
          <VehicleTypeId>7</VehicleTypeId>
          <VehicleTypeName>Multipurpose Passenger Vehicle (MPV)</VehicleTypeName>
        </VehicleTypesForMakeIds>
      </Results>
    </Response>
  `;

  beforeEach(() => {
    const axiosInstance = axios.create();
    mockAxios = new MockAdapter(axiosInstance);
    xmlParser = new XmlParserService();
    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    client = new NhtsaApiClient(axiosInstance, xmlParser, logger);
  });

  afterEach(() => {
    mockAxios.reset();
  });

  describe('getAllMakes', () => {
    it('fetches all makes from NHTSA API', async () => {
      mockAxios.onGet('/vehicles/getallmakes?format=XML').reply(200, makesXml);

      const result = await client.getAllMakes();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ Make_ID: 440, Make_Name: 'ASTON MARTIN' });
      expect(result[1]).toEqual({ Make_ID: 441, Make_Name: 'TESLA' });
    });

    it('returns empty array for empty results', async () => {
      const emptyXml = '<Response><Results></Results></Response>';
      mockAxios.onGet('/vehicles/getallmakes?format=XML').reply(200, emptyXml);

      const result = await client.getAllMakes();

      expect(result).toEqual([]);
    });

    it('logs info before and after fetch', async () => {
      mockAxios.onGet('/vehicles/getallmakes?format=XML').reply(200, makesXml);

      await client.getAllMakes();

      expect(logger.info).toHaveBeenCalledWith('Fetching all vehicle makes from NHTSA');
      expect(logger.info).toHaveBeenCalledWith({ count: 2 }, 'Fetched vehicle makes');
    });

    it('throws ExternalApiError on network error', async () => {
      mockAxios.onGet('/vehicles/getallmakes?format=XML').networkError();
      await expect(client.getAllMakes()).rejects.toBeInstanceOf(ExternalApiError);
    });

    it('throws ExternalApiError on server error', async () => {
      mockAxios.onGet('/vehicles/getallmakes?format=XML').reply(500);
      await expect(client.getAllMakes()).rejects.toBeInstanceOf(ExternalApiError);
    });

    it('throws ExternalApiError on timeout', async () => {
      mockAxios.onGet('/vehicles/getallmakes?format=XML').timeout();
      await expect(client.getAllMakes()).rejects.toBeInstanceOf(ExternalApiError);
    });

    it('logs error on failure', async () => {
      mockAxios.onGet('/vehicles/getallmakes?format=XML').networkError();
      try {
        await client.getAllMakes();
      } catch (error) {
        expect(logger.error).toHaveBeenCalledWith(expect.anything(), 'Failed to fetch vehicle makes');
      }
    });
  });

  describe('getVehicleTypesForMake', () => {
    it('fetches vehicle types for make', async () => {
      mockAxios.onGet('/vehicles/GetVehicleTypesForMakeId/440?format=xml').reply(200, typesXml);

      const result = await client.getVehicleTypesForMake(440);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ VehicleTypeId: 2, VehicleTypeName: 'Passenger Car' });
    });

    it('includes makeId in request url', async () => {
      mockAxios.onGet('/vehicles/GetVehicleTypesForMakeId/123?format=xml').reply(200, typesXml);
      await client.getVehicleTypesForMake(123);
      expect(mockAxios.history.get[0].url).toContain('123');
    });

    it('returns empty array for empty results', async () => {
      const emptyXml = '<Response><Results></Results></Response>';
      mockAxios.onGet('/vehicles/GetVehicleTypesForMakeId/440?format=xml').reply(200, emptyXml);

      const result = await client.getVehicleTypesForMake(440);

      expect(result).toEqual([]);
    });

    it('logs debug before fetch', async () => {
      mockAxios.onGet('/vehicles/GetVehicleTypesForMakeId/440?format=xml').reply(200, typesXml);
      await client.getVehicleTypesForMake(440);
      expect(logger.debug).toHaveBeenCalledWith({ makeId: 440 }, 'Fetching vehicle types for make');
    });

    it('throws ExternalApiError on network error', async () => {
      mockAxios.onGet('/vehicles/GetVehicleTypesForMakeId/440?format=xml').networkError();
      await expect(client.getVehicleTypesForMake(440)).rejects.toBeInstanceOf(ExternalApiError);
    });

    it('error message contains makeId', async () => {
      mockAxios.onGet('/vehicles/GetVehicleTypesForMakeId/440?format=xml').networkError();
      try {
        await client.getVehicleTypesForMake(440);
      } catch (error) {
        expect((error as Error).message).toContain('440');
      }
    });
  });

  describe('healthCheck', () => {
    it('returns true when reachable', async () => {
      mockAxios.onGet('/vehicles/getallmakes?format=XML').reply(200, '<Response></Response>');
      const result = await client.healthCheck();
      expect(result).toBe(true);
    });

    it('returns false on network error', async () => {
      mockAxios.onGet('/vehicles/getallmakes?format=XML').networkError();
      const result = await client.healthCheck();
      expect(result).toBe(false);
    });

    it('returns false on server error', async () => {
      mockAxios.onGet('/vehicles/getallmakes?format=XML').reply(500);
      const result = await client.healthCheck();
      expect(result).toBe(false);
    });

    it('logs health result', async () => {
      mockAxios.onGet('/vehicles/getallmakes?format=XML').reply(200, '<Response></Response>');
      await client.healthCheck();
      expect(logger.debug).toHaveBeenCalledWith({ healthy: true }, 'NHTSA API health check result');
    });
  });
});

