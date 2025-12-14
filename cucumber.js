module.exports = {
  default: {
    require: ['test/bdd/step-definitions/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      'html:cucumber-report/cucumber-report.html',
      'json:cucumber-report/cucumber-report.json',
    ],
    paths: ['test/bdd/features/**/*.feature'],
    publishQuiet: true,
  },
};
