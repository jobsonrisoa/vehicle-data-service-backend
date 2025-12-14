import { Before, After, BeforeAll, AfterAll, Status } from '@cucumber/cucumber';
import { CustomWorld } from './world';

BeforeAll(function () {
  process.env.NODE_ENV = 'test';
});

AfterAll(function () {
  // Cleanup after all tests
});

Before(function (this: CustomWorld) {
  this.response = null;
  this.error = null;
  this.clearContext();
});

After(async function (this: CustomWorld, scenario) {
  if (scenario.result?.status === Status.FAILED) {
    console.log('Scenario failed:', scenario.pickle.name);
    if (this.error) {
      console.log('Error:', this.error.message);
    }
  }

  if (this.app) {
    await this.app.close();
    this.app = null;
  }

  this.clearContext();
});
