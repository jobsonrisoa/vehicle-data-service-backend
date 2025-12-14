import { XMLParser, XMLValidator } from 'fast-xml-parser';

import { XmlParseError } from '@domain/errors/xml-parse-error';

interface NhtsaResponse<T> {
  Response?: {
    Results?: T;
  };
}

export class XmlParserService {
  private readonly parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true,
    });
  }

  parse<T = any>(xml: string): T {
    this.ensureInput(xml);
    const cleanXml = xml.trim();
    const validation = XMLValidator.validate(cleanXml);
    if (validation !== true) {
      const message = typeof validation === 'object' && validation.err?.msg ? validation.err.msg : 'Invalid XML';
      throw new XmlParseError(`Failed to parse XML: ${message}`);
    }
    try {
      return this.parser.parse(cleanXml) as T;
    } catch (error) {
      throw new XmlParseError(`Failed to parse XML: ${(error as Error).message}`, error as Error);
    }
  }

  parseVehicleMakes(xml: string): Array<{ Make_ID: number; Make_Name: string }> {
    const parsed = this.parse<NhtsaResponse<{ AllVehicleMakes?: any }>>(xml);
    return this.extract(parsed, 'AllVehicleMakes');
  }

  parseVehicleTypes(xml: string): Array<{ VehicleTypeId: number; VehicleTypeName: string }> {
    const parsed = this.parse<NhtsaResponse<{ VehicleTypesForMakeIds?: any }>>(xml);
    return this.extract(parsed, 'VehicleTypesForMakeIds');
  }

  private ensureInput(xml: string): void {
    if (!xml || typeof xml !== 'string' || xml.trim() === '') {
      throw new XmlParseError('XML input must be a non-empty string');
    }
  }

  private extract<T>(parsed: NhtsaResponse<any>, key: string): T[] {
    const results = parsed?.Response?.Results?.[key];
    if (!results) {
      return [];
    }
    return Array.isArray(results) ? results : [results];
  }
}

