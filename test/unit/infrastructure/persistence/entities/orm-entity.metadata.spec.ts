import { getMetadataArgsStorage } from 'typeorm';

import {
  VehicleMakeOrmEntity,
  VehicleTypeOrmEntity,
  IngestionJobOrmEntity,
} from '@infrastructure/adapters/secondary/persistence/entities';

describe('ORM Entity Metadata (Unit)', () => {
  const storage = getMetadataArgsStorage();

  describe('VehicleMakeOrmEntity', () => {
    it('should have correct table and columns', () => {
      const table = storage.tables.find((t) => t.target === VehicleMakeOrmEntity);
      expect(table?.name).toBe('vehicle_makes');

      const makeIdColumn = storage.columns.find(
        (c) => c.target === VehicleMakeOrmEntity && c.propertyName === 'makeId',
      );
      expect(makeIdColumn).toBeDefined();
      expect(makeIdColumn?.options.name).toBe('make_id');
      expect(makeIdColumn?.options.type).toBe('integer');
      expect(makeIdColumn?.options.unique).toBe(true);

      const makeNameColumn = storage.columns.find(
        (c) => c.target === VehicleMakeOrmEntity && c.propertyName === 'makeName',
      );
      expect(makeNameColumn).toBeDefined();
      expect(makeNameColumn?.options.name).toBe('make_name');
      expect(makeNameColumn?.options.length).toBe(255);
    });

    it('should define indexes and relations', () => {
      const uniques = storage.uniques.filter((u) => u.target === VehicleMakeOrmEntity);
      const hasMakeIdUnique = uniques.some((u) => Array.isArray(u.columns) && u.columns.includes('makeId'));
      expect(hasMakeIdUnique).toBe(true);

      const relation = storage.relations.find(
        (r) => r.target === VehicleMakeOrmEntity && r.propertyName === 'vehicleTypes',
      );
      expect(relation).toBeDefined();
      expect(relation?.relationType).toBe('one-to-many');
      expect(relation?.options?.cascade).toBe(true);
      expect(relation?.options?.eager).toBe(true);
    });

    it('should have timestamp columns', () => {
      const createdAt = storage.columns.find(
        (c) => c.target === VehicleMakeOrmEntity && c.propertyName === 'createdAt',
      );
      const updatedAt = storage.columns.find(
        (c) => c.target === VehicleMakeOrmEntity && c.propertyName === 'updatedAt',
      );
      expect(createdAt?.options.name).toBe('created_at');
      expect(updatedAt?.options.name).toBe('updated_at');
    });
  });

  describe('VehicleTypeOrmEntity', () => {
    it('should have correct table and columns', () => {
      const table = storage.tables.find((t) => t.target === VehicleTypeOrmEntity);
      expect(table?.name).toBe('vehicle_types');

      const typeIdColumn = storage.columns.find(
        (c) => c.target === VehicleTypeOrmEntity && c.propertyName === 'typeId',
      );
      expect(typeIdColumn).toBeDefined();
      expect(typeIdColumn?.options.name).toBe('type_id');

      const typeNameColumn = storage.columns.find(
        (c) => c.target === VehicleTypeOrmEntity && c.propertyName === 'typeName',
      );
      expect(typeNameColumn?.options.name).toBe('type_name');

      const fkColumn = storage.columns.find(
        (c) => c.target === VehicleTypeOrmEntity && c.propertyName === 'vehicleMakeId',
      );
      expect(fkColumn?.options.name).toBe('vehicle_make_id');
    });

    it('should define unique constraint and relation', () => {
      const uniques = storage.uniques.filter((u) => u.target === VehicleTypeOrmEntity);
      const hasCompositeUnique = uniques.some((u) => {
        if (!Array.isArray(u.columns)) return false;
        return u.columns.includes('typeId') && u.columns.includes('vehicleMakeId');
      });
      expect(hasCompositeUnique).toBe(true);

      const relation = storage.relations.find(
        (r) => r.target === VehicleTypeOrmEntity && r.propertyName === 'vehicleMake',
      );
      expect(relation).toBeDefined();
      expect(relation?.relationType).toBe('many-to-one');
      expect(relation?.options?.onDelete).toBe('CASCADE');
    });
  });

  describe('IngestionJobOrmEntity', () => {
    it('should have correct table and columns', () => {
      const table = storage.tables.find((t) => t.target === IngestionJobOrmEntity);
      expect(table?.name).toBe('ingestion_jobs');

      const statusColumn = storage.columns.find(
        (c) => c.target === IngestionJobOrmEntity && c.propertyName === 'status',
      );
      expect(statusColumn?.options.default).toBe('PENDING');

      const errorsColumn = storage.columns.find(
        (c) => c.target === IngestionJobOrmEntity && c.propertyName === 'errors',
      );
      expect(errorsColumn?.options.type).toBe('jsonb');
    });

    it('should define indexes on status and startedAt', () => {
      const indices = storage.indices.filter((i) => i.target === IngestionJobOrmEntity);
      const hasStatusIndex = indices.some((i) => {
        const cols = typeof i.columns === 'function' ? (i.columns({}) as string[]) : i.columns;
        return Array.isArray(cols) && cols.includes('status');
      });
      const hasStartedIndex = indices.some((i) => {
        const cols = typeof i.columns === 'function' ? (i.columns({}) as string[]) : i.columns;
        return Array.isArray(cols) && cols.includes('startedAt');
      });
      expect(hasStatusIndex).toBe(true);
      expect(hasStartedIndex).toBe(true);
    });
  });
});

