process.env.TS_NODE_TRANSPILE_ONLY = 'true';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/vehicle_bdd_test';
process.env.RABBITMQ_URL = 'amqp://guest:guest@localhost:5672';
process.env.NHTSA_API_BASE_URL = 'https://vpic.nhtsa.dot.gov';

module.exports = {
  default: {
    require: ['test/bdd/step-definitions/**/*.ts', 'test/bdd/support/**/*.ts'],
    requireModule: ['ts-node/register', 'tsconfig-paths/register'],
    format: [
      'progress-bar',
      'html:cucumber-report/cucumber-report.html',
      'json:cucumber-report/cucumber-report.json',
    ],
    formatOptions: { snippetInterface: 'async-await' },
    paths: ['test/bdd/features/**/*.feature'],
    publishQuiet: true,
  },
};
