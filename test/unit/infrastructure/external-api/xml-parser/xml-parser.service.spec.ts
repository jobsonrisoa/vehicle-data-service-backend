import { XmlParserService } from '@infrastructure/adapters/secondary/external-api/xml-parser/xml-parser.service';
import { XmlParseError } from '@domain/errors/xml-parse-error';

describe('XmlParserService', () => {
  let parser: XmlParserService;

  beforeEach(() => {
    parser = new XmlParserService();
  });

  describe('parse', () => {
    it('parses valid XML to JSON', () => {
      const xml = '<root><name>Test</name><value>123</value></root>';
      const result = parser.parse(xml);
      expect(result).toEqual({
        root: {
          name: 'Test',
          value: 123,
        },
      });
    });

    it('handles nested elements', () => {
      const xml = '<root><parent><child>Value</child></parent></root>';
      const result = parser.parse(xml);
      expect(result.root.parent.child).toBe('Value');
    });

    it('handles arrays of elements', () => {
      const xml = '<root><item>First</item><item>Second</item><item>Third</item></root>';
      const result = parser.parse(xml);
      expect(Array.isArray(result.root.item)).toBe(true);
      expect(result.root.item).toHaveLength(3);
      expect(result.root.item[0]).toBe('First');
    });

    it('handles attributes', () => {
      const xml = '<root id="123" type="test"><name>Value</name></root>';
      const result = parser.parse(xml);
      expect(result.root['@_id']).toBe(123);
      expect(result.root['@_type']).toBe('test');
      expect(result.root.name).toBe('Value');
    });

    it('preserves numeric data types', () => {
      const xml = '<root><id>456</id><value>789.5</value></root>';
      const result = parser.parse(xml);
      expect(typeof result.root.id).toBe('number');
      expect(result.root.id).toBe(456);
      expect(typeof result.root.value).toBe('number');
      expect(result.root.value).toBe(789.5);
    });

    it('preserves boolean data types', () => {
      const xml = '<root><active>true</active><deleted>false</deleted></root>';
      const result = parser.parse(xml);
      expect(result.root.active).toBe(true);
      expect(result.root.deleted).toBe(false);
    });

    it('handles empty elements', () => {
      const xml = '<root><empty/></root>';
      const result = parser.parse(xml);
      expect(result.root.empty).toBe('');
    });

    it('handles CDATA sections', () => {
      const xml = '<root><![CDATA[Special <characters> & content]]></root>';
      const result = parser.parse(xml);
      expect(result.root).toBe('Special <characters> & content');
    });
  });

  describe('error handling', () => {
    it('throws XmlParseError for malformed XML', () => {
      const malformedXml = '<root><unclosed>';
      expect(() => parser.parse(malformedXml)).toThrow(XmlParseError);
    });

    it('throws XmlParseError for empty string', () => {
      expect(() => parser.parse('')).toThrow(XmlParseError);
    });

    it('throws XmlParseError for null', () => {
      expect(() => parser.parse(null as any)).toThrow(XmlParseError);
    });

    it('throws XmlParseError for undefined', () => {
      expect(() => parser.parse(undefined as any)).toThrow(XmlParseError);
    });

    it('includes message from underlying error', () => {
      const xml = '<root><tag></root>';
      try {
        parser.parse(xml);
      } catch (error) {
        expect(error).toBeInstanceOf(XmlParseError);
        expect((error as Error).message).toContain('Failed to parse XML');
      }
    });
  });

  describe('parseVehicleMakes', () => {
    it('parses NHTSA makes XML format', () => {
      const xml = `
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
      const result = parser.parseVehicleMakes(xml);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ Make_ID: 440, Make_Name: 'ASTON MARTIN' });
      expect(result[1]).toEqual({ Make_ID: 441, Make_Name: 'TESLA' });
    });

    it('extracts MakeId and MakeName', () => {
      const xml = `
        <Response>
          <Results>
            <AllVehicleMakes>
              <Make_ID>123</Make_ID>
              <Make_Name>ACURA</Make_Name>
            </AllVehicleMakes>
          </Results>
        </Response>
      `;
      const result = parser.parseVehicleMakes(xml);
      expect(result[0].Make_ID).toBe(123);
      expect(result[0].Make_Name).toBe('ACURA');
    });

    it('handles empty results', () => {
      const xml = '<Response><Results></Results></Response>';
      const result = parser.parseVehicleMakes(xml);
      expect(result).toEqual([]);
    });

    it('handles single result not array', () => {
      const xml = `
        <Response>
          <Results>
            <AllVehicleMakes>
              <Make_ID>100</Make_ID>
              <Make_Name>BMW</Make_Name>
            </AllVehicleMakes>
          </Results>
        </Response>
      `;
      const result = parser.parseVehicleMakes(xml);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].Make_ID).toBe(100);
    });

    it('handles missing Results element', () => {
      const xml = '<Response></Response>';
      const result = parser.parseVehicleMakes(xml);
      expect(result).toEqual([]);
    });

    it('handles large datasets', () => {
      const makes = Array.from({ length: 50 }, (_, i) => `
        <AllVehicleMakes>
          <Make_ID>${i + 1}</Make_ID>
          <Make_Name>MAKE_${i + 1}</Make_Name>
        </AllVehicleMakes>
      `).join('');
      const xml = `<Response><Results>${makes}</Results></Response>`;
      const result = parser.parseVehicleMakes(xml);
      expect(result).toHaveLength(50);
      expect(result[0].Make_ID).toBe(1);
      expect(result[49].Make_ID).toBe(50);
    });
  });

  describe('parseVehicleTypes', () => {
    it('parses NHTSA types XML format', () => {
      const xml = `
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
      const result = parser.parseVehicleTypes(xml);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ VehicleTypeId: 2, VehicleTypeName: 'Passenger Car' });
      expect(result[1]).toEqual({ VehicleTypeId: 7, VehicleTypeName: 'Multipurpose Passenger Vehicle (MPV)' });
    });

    it('extracts VehicleTypeId and VehicleTypeName', () => {
      const xml = `
        <Response>
          <Results>
            <VehicleTypesForMakeIds>
              <VehicleTypeId>3</VehicleTypeId>
              <VehicleTypeName>Truck</VehicleTypeName>
            </VehicleTypesForMakeIds>
          </Results>
        </Response>
      `;
      const result = parser.parseVehicleTypes(xml);
      expect(result[0].VehicleTypeId).toBe(3);
      expect(result[0].VehicleTypeName).toBe('Truck');
    });

    it('handles empty results', () => {
      const xml = '<Response><Results></Results></Response>';
      const result = parser.parseVehicleTypes(xml);
      expect(result).toEqual([]);
    });

    it('handles single result not array', () => {
      const xml = `
        <Response>
          <Results>
            <VehicleTypesForMakeIds>
              <VehicleTypeId>5</VehicleTypeId>
              <VehicleTypeName>Bus</VehicleTypeName>
            </VehicleTypesForMakeIds>
          </Results>
        </Response>
      `;
      const result = parser.parseVehicleTypes(xml);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].VehicleTypeId).toBe(5);
    });

    it('handles missing Results element', () => {
      const xml = '<Response></Response>';
      const result = parser.parseVehicleTypes(xml);
      expect(result).toEqual([]);
    });
  });
});

