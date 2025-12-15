/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await */
import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { VehicleWorld } from './world';
import { createTestApp, destroyTestApp } from '../../e2e/utils/test-app.factory';
import { clearDatabase } from '../../e2e/utils/seed-database';
import * as nock from 'nock';

let sharedContext: any;

BeforeAll(async function () {
  sharedContext = await createTestApp();
});

AfterAll(async function () {
  if (sharedContext) {
    await destroyTestApp(sharedContext);
  }
});

Before(async function (this: VehicleWorld) {
  await this.setTestContext(sharedContext);
  await clearDatabase(this.getApp());
  nock.cleanAll();
});

After(async function (this: VehicleWorld) {
  nock.cleanAll();
  this.context.capturedData = {};
  this.clearContext();
  this.context.currentJobId = undefined;
  this.context.currentCursor = undefined;
  this.context.error = undefined;
});
