/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { Given, Then } from '@cucumber/cucumber';
import * as assert from 'assert';
import * as request from 'supertest';

import { VehicleWorld } from '../support/world';

Given('the system is running', async function (this: VehicleWorld) {
  const app = this.getApp();
  assert.ok(app, 'Application should be initialized');

  const response = await request(app.getHttpServer()).get('/health');
  assert.strictEqual(response.status, 200);
});

Given('the database is available', async function (this: VehicleWorld) {
  const dataSource = this.getDataSource();
  assert.ok(dataSource.isInitialized, 'Database should be initialized');

  await dataSource.query('SELECT 1');
});

Given('the database is empty', async function (this: VehicleWorld) {
  const dataSource = this.getDataSource();
  const result = await dataSource.query('SELECT COUNT(*) as count FROM vehicle_makes');
  const count = parseInt(result[0].count, 10);
  assert.strictEqual(count, 0, 'Database should be empty');
});

Given('the database contains vehicle data', async function (this: VehicleWorld) {
  await seedVehicleData(this);
});

Given(
  'there are {int} vehicle makes in the database',
  async function (this: VehicleWorld, count: number) {
    await seedVehicleMakes(this, count);
  },
);

Given(
  'the database contains {int} vehicle makes',
  async function (this: VehicleWorld, count: number) {
    await seedVehicleMakes(this, count);
  },
);

Given('each make has at least one vehicle type', async function (this: VehicleWorld) {
  const dataSource = this.getDataSource();
  const result = await dataSource.query(`
    SELECT COUNT(DISTINCT vt.vehicle_make_id) as count
    FROM vehicle_types vt
  `);
  const count = parseInt(result[0].count, 10);
  assert.ok(count > 0, 'Each make should have at least one vehicle type');
});

Then('the response should be successful', function (this: VehicleWorld) {
  const response = this.getResponse() ?? this.getGraphQLResponse();
  assert.ok(response, 'Response should exist');
  assert.ok(response.status < 400, `Response should be successful, got ${response.status}`);
});

Then('I should receive a {int} Conflict error', function (this: VehicleWorld, statusCode: number) {
  const response = this.getResponse();
  assert.ok(response, 'Response should exist');
  assert.strictEqual(response.status, statusCode);
});

Then('I should receive a {int} Not Found error', function (this: VehicleWorld, statusCode: number) {
  const response = this.getResponse();
  assert.ok(response, 'Response should exist');
  assert.strictEqual(response.status, statusCode);
});

Then(
  'I should receive a {int} Bad Request error',
  function (this: VehicleWorld, statusCode: number) {
    const response = this.getResponse() ?? this.getGraphQLResponse();
    assert.ok(response, 'Response should exist');
    assert.strictEqual(response.status, statusCode);
  },
);

Then(
  'I should receive a {int} Service Unavailable error',
  function (this: VehicleWorld, statusCode: number) {
    const response = this.getResponse();
    assert.ok(response, 'Response should exist');
    assert.strictEqual(response.status, statusCode);
  },
);

Then(
  'the error message should be {string}',
  function (this: VehicleWorld, expectedMessage: string) {
    const response = this.getResponse();
    assert.ok(response, 'Response should exist');
    const body = response.body as { message?: string; error?: { message?: string } };
    const message = body.message ?? body.error?.message;
    assert.strictEqual(message, expectedMessage);
  },
);

Then(
  'the error message should indicate {string}',
  function (this: VehicleWorld, expectedText: string) {
    const response = this.getResponse() ?? this.getGraphQLResponse();
    assert.ok(response, 'Response should exist');
    const body = response.body as {
      message?: string;
      error?: { message?: string };
      errors?: Array<{ message: string }>;
    };
    const message = body.message ?? body.error?.message ?? body.errors?.[0]?.message ?? '';
    assert.ok(message.includes(expectedText), `Error message should contain "${expectedText}"`);
  },
);

Then(
  'the error message should contain {string}',
  function (this: VehicleWorld, expectedText: string) {
    const response = this.getGraphQLResponse();
    assert.ok(response, 'Response should exist');
    const errors = response.body.errors;
    assert.ok(errors && errors.length > 0, 'Should have errors');
    const hasMessage = errors.some((e: { message: string }) => e.message.includes(expectedText));
    assert.ok(hasMessage, `Error should contain "${expectedText}"`);
  },
);

async function seedVehicleData(world: VehicleWorld): Promise<void> {
  await seedVehicleMakes(world, 100);
}

async function seedVehicleMakes(world: VehicleWorld, count: number): Promise<void> {
  const dataSource = world.getDataSource();

  const makeValues: string[] = [];
  for (let i = 1; i <= count; i++) {
    makeValues.push(`(${400 + i}, 'TEST MAKE ${i}')`);
  }

  if (makeValues.length > 0) {
    await dataSource.query(`
      INSERT INTO vehicle_makes (make_id, make_name)
      VALUES ${makeValues.join(', ')}
      ON CONFLICT (make_id) DO NOTHING
    `);

    const makes = await dataSource.query('SELECT id, make_id FROM vehicle_makes');
    const typeValues = makes.map(
      (m: { id: string; make_id: number }) => `(${m.make_id * 10}, 'Passenger Car', '${m.id}')`,
    );

    if (typeValues.length > 0) {
      await dataSource.query(`
        INSERT INTO vehicle_types (type_id, type_name, vehicle_make_id)
        VALUES ${typeValues.join(', ')}
        ON CONFLICT (type_id, vehicle_make_id) DO NOTHING
      `);
    }
  }
}
