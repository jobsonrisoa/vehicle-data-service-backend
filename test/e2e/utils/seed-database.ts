import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { VehicleMakeOrmEntity } from '../../../src/infrastructure/adapters/secondary/persistence/entities/vehicle-make.orm-entity';
import { VehicleTypeOrmEntity } from '../../../src/infrastructure/adapters/secondary/persistence/entities/vehicle-type.orm-entity';

export async function seedDatabase(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);

  const makes: VehicleMakeOrmEntity[] = [];
  const types: VehicleTypeOrmEntity[] = [];

  for (let i = 1; i <= 100; i += 1) {
    const make = dataSource.getRepository(VehicleMakeOrmEntity).create({
      makeId: 400 + i,
      makeName: `TEST MAKE ${i}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    makes.push(make);
  }

  await dataSource.getRepository(VehicleMakeOrmEntity).save(makes);

  for (const make of makes) {
    const typeCount = Math.max(1, Math.floor(Math.random() * 3) + 1);
    for (let j = 1; j <= typeCount; j += 1) {
      const type = dataSource.getRepository(VehicleTypeOrmEntity).create({
        typeId: 1000 + makes.indexOf(make) * 10 + j,
        typeName: `TEST TYPE ${j}`,
        vehicleMake: make,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      types.push(type);
    }
  }

  await dataSource.getRepository(VehicleTypeOrmEntity).save(types);

  const astonMartin = dataSource.getRepository(VehicleMakeOrmEntity).create({
    makeId: 440,
    makeName: 'ASTON MARTIN',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await dataSource.getRepository(VehicleMakeOrmEntity).save(astonMartin);

  const astonTypes = [
    { typeId: 3, typeName: 'Passenger Car' },
    { typeId: 5, typeName: 'Convertible' },
  ];

  for (const typeData of astonTypes) {
    const type = dataSource.getRepository(VehicleTypeOrmEntity).create({
      ...typeData,
      vehicleMake: astonMartin,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await dataSource.getRepository(VehicleTypeOrmEntity).save(type);
  }
}

export async function clearDatabase(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);
  await dataSource.getRepository(VehicleTypeOrmEntity).delete({});
  await dataSource.getRepository(VehicleMakeOrmEntity).delete({});
}
