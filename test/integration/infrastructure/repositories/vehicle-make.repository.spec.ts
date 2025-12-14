import { VehicleMakeRepository } from '@infrastructure/adapters/secondary/persistence/repositories/vehicle-make.repository';
import {
  createTestDatabase,
  cleanupTestDatabase,
  clearDatabase,
  TestDatabase,
} from '@test/helpers/testcontainers/postgres.helper';
import { VehicleMake } from '@domain/entities/vehicle-make.entity';
import { VehicleType } from '@domain/entities/vehicle-type.entity';
import { MakeId } from '@domain/value-objects/make-id.vo';

describe('VehicleMakeRepository (Integration - Testcontainers)', () => {
  let testDb: TestDatabase;
  let repository: VehicleMakeRepository;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    repository = new VehicleMakeRepository(testDb.dataSource);
  }, 60000);

  afterAll(async () => {
    await cleanupTestDatabase(testDb);
  });

  beforeEach(async () => {
    await clearDatabase(testDb.dataSource);
  });

  describe('save', () => {
    it('persists a new vehicle make', async () => {
      const make = VehicleMake.create({ makeId: 440, makeName: 'ASTON MARTIN' });

      await repository.save(make);

      const found = await repository.findByMakeId(440);
      expect(found).not.toBeNull();
      expect(found!.makeName).toBe('ASTON MARTIN');
    });

    it('persists vehicle types with cascade', async () => {
      const make = VehicleMake.create({ makeId: 440, makeName: 'ASTON MARTIN' });
      make.addVehicleType(VehicleType.create({ typeId: 2, typeName: 'Passenger Car' }));
      make.addVehicleType(
        VehicleType.create({ typeId: 7, typeName: 'Multipurpose Passenger Vehicle (MPV)' }),
      );

      await repository.save(make);

      const found = await repository.findByMakeId(440);
      expect(found!.vehicleTypes).toHaveLength(2);
      expect(found!.vehicleTypes[0].typeId).toBe(2);
    });

    it('updates an existing vehicle make', async () => {
      const make = VehicleMake.create({ makeId: 440, makeName: 'ASTON MARTIN' });
      await repository.save(make);

      const retrieved = await repository.findByMakeId(440);
      retrieved!.addVehicleType(VehicleType.create({ typeId: 2, typeName: 'Passenger Car' }));
      await repository.save(retrieved!);

      const updated = await repository.findByMakeId(440);
      expect(updated!.vehicleTypes).toHaveLength(1);
    });

    it('maintains referential integrity (types FK)', async () => {
      const make = VehicleMake.create({ makeId: 440, makeName: 'ASTON MARTIN' });
      make.addVehicleType(VehicleType.create({ typeId: 2, typeName: 'Passenger Car' }));
      await repository.save(make);

      const rows = await testDb.dataSource.query(
        'SELECT * FROM vehicle_types WHERE vehicle_make_id = $1',
        [make.id.value],
      );

      expect(rows).toHaveLength(1);
      expect(rows[0].type_id).toBe(2);
    });
  });

  describe('saveMany', () => {
    it('bulk inserts vehicle makes', async () => {
      const makes = [
        VehicleMake.create({ makeId: 440, makeName: 'ASTON MARTIN' }),
        VehicleMake.create({ makeId: 441, makeName: 'TESLA' }),
        VehicleMake.create({ makeId: 442, makeName: 'FERRARI' }),
      ];

      await repository.saveMany(makes);

      expect(await repository.count()).toBe(3);
    });

    it('handles empty array', async () => {
      await expect(repository.saveMany([])).resolves.not.toThrow();
    });
  });

  describe('findByMakeId', () => {
    it('returns make when found', async () => {
      const make = VehicleMake.create({ makeId: 440, makeName: 'ASTON MARTIN' });
      await repository.save(make);

      const found = await repository.findByMakeId(440);

      expect(found).not.toBeNull();
      expect(found).toBeInstanceOf(VehicleMake);
      expect(found!.makeName).toBe('ASTON MARTIN');
    });

    it('returns null when not found', async () => {
      const found = await repository.findByMakeId(999);
      expect(found).toBeNull();
    });

    it('eager-loads vehicle types', async () => {
      const make = VehicleMake.create({ makeId: 440, makeName: 'ASTON MARTIN' });
      make.addVehicleType(VehicleType.create({ typeId: 2, typeName: 'Passenger Car' }));
      await repository.save(make);

      const found = await repository.findByMakeId(440);
      expect(found!.vehicleTypes[0]).toBeInstanceOf(VehicleType);
    });
  });

  describe('findById', () => {
    it('finds by UUID id', async () => {
      const make = VehicleMake.create({ makeId: 440, makeName: 'ASTON MARTIN' });
      await repository.save(make);

      const found = await repository.findById(make.id);
      expect(found).not.toBeNull();
      expect(found!.id.equals(make.id)).toBe(true);
    });

    it('returns null for unknown id', async () => {
      const found = await repository.findById(MakeId.create());
      expect(found).toBeNull();
    });
  });

  describe('findAll (pagination)', () => {
    beforeEach(async () => {
      const makes = [
        VehicleMake.create({ makeId: 440, makeName: 'ASTON MARTIN' }),
        VehicleMake.create({ makeId: 441, makeName: 'TESLA' }),
        VehicleMake.create({ makeId: 442, makeName: 'FERRARI' }),
        VehicleMake.create({ makeId: 443, makeName: 'LAMBORGHINI' }),
        VehicleMake.create({ makeId: 444, makeName: 'PORSCHE' }),
      ];
      await repository.saveMany(makes);
    });

    it('returns first page of results', async () => {
      const result = await repository.findAll({ first: 2 });

      expect(result.edges).toHaveLength(2);
      expect(result.edges[0].node).toBeInstanceOf(VehicleMake);
      expect(result.edges[0].cursor).toBeDefined();
      expect(result.totalCount).toBe(5);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
    });

    it('supports cursor-based pagination (after)', async () => {
      const firstPage = await repository.findAll({ first: 2 });
      const secondPage = await repository.findAll({ first: 2, after: firstPage.pageInfo.endCursor! });

      expect(firstPage.edges[0].node.makeId).not.toBe(secondPage.edges[0].node.makeId);
      expect(secondPage.pageInfo.hasPreviousPage).toBe(true);
    });

    it('includes vehicle types in paginated results', async () => {
      const make = await repository.findByMakeId(440);
      make!.addVehicleType(VehicleType.create({ typeId: 2, typeName: 'Passenger Car' }));
      await repository.save(make!);

      const result = await repository.findAll({ first: 5 });
      const edgeWithType = result.edges.find((edge) => edge.node.makeId === 440);
      expect(edgeWithType!.node.vehicleTypes).toHaveLength(1);
    });
  });

  describe('findByFilter', () => {
    it('filters by makeNameContains (case-insensitive)', async () => {
      const makes = [
        VehicleMake.create({ makeId: 440, makeName: 'ASTON MARTIN' }),
        VehicleMake.create({ makeId: 441, makeName: 'TESLA' }),
      ];
      await repository.saveMany(makes);

      const result = await repository.findByFilter({ makeNameContains: 'tes' });

      expect(result).toHaveLength(1);
      expect(result[0].makeName).toBe('TESLA');
    });

    it('filters by hasVehicleType', async () => {
      const aston = VehicleMake.create({ makeId: 440, makeName: 'ASTON MARTIN' });
      const tesla = VehicleMake.create({ makeId: 441, makeName: 'TESLA' });
      aston.addVehicleType(VehicleType.create({ typeId: 2, typeName: 'Passenger Car' }));
      tesla.addVehicleType(VehicleType.create({ typeId: 7, typeName: 'MPV' }));
      await repository.saveMany([aston, tesla]);

      const result = await repository.findByFilter({ hasVehicleType: 7 });

      expect(result).toHaveLength(1);
      expect(result[0].makeName).toBe('TESLA');
    });

    it('filters by createdAfter/createdBefore', async () => {
      const oldDate = new Date('2020-01-01T00:00:00.000Z');
      const recentDate = new Date();

      const oldMake = VehicleMake.reconstitute({
        id: MakeId.create(),
        makeId: 440,
        makeName: 'OLD MAKE',
        vehicleTypes: [],
        createdAt: oldDate,
        updatedAt: oldDate,
      });

      const recentMake = VehicleMake.reconstitute({
        id: MakeId.create(),
        makeId: 441,
        makeName: 'RECENT MAKE',
        vehicleTypes: [],
        createdAt: recentDate,
        updatedAt: recentDate,
      });

      await repository.saveMany([oldMake, recentMake]);

      const afterOld = await repository.findByFilter({ createdAfter: oldDate });
      expect(afterOld.some((m) => m.makeName === 'OLD MAKE')).toBe(false);

      const beforeRecent = await repository.findByFilter({ createdBefore: recentDate });
      expect(beforeRecent.some((m) => m.makeName === 'RECENT MAKE')).toBe(false);
    });
  });

  describe('count', () => {
    it('returns total count of makes', async () => {
      await repository.saveMany([
        VehicleMake.create({ makeId: 440, makeName: 'ASTON MARTIN' }),
        VehicleMake.create({ makeId: 441, makeName: 'TESLA' }),
      ]);

      const count = await repository.count();
      expect(count).toBe(2);
    });

    it('returns 0 when none exist', async () => {
      const count = await repository.count();
      expect(count).toBe(0);
    });
  });

  describe('deleteAll', () => {
    it('removes all makes and cascades types', async () => {
      const make = VehicleMake.create({ makeId: 440, makeName: 'ASTON MARTIN' });
      make.addVehicleType(VehicleType.create({ typeId: 2, typeName: 'Passenger Car' }));
      await repository.save(make);

      await repository.deleteAll();

      expect(await repository.count()).toBe(0);
      const types = await testDb.dataSource.query('SELECT * FROM vehicle_types');
      expect(types).toHaveLength(0);
    });
  });
});

