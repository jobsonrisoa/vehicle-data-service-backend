module.exports = {
  default: {
    require: ['test/bdd/step-definitions/**/*.ts', 'test/bdd/support/**/*.ts'],
    requireModule: ['ts-node/register'],
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
