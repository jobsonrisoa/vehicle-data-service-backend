const baseModuleNameMapper = {
  '^@core/(.*)$': '<rootDir>/src/core/$1',
  '^@domain/(.*)$': '<rootDir>/src/core/domain/$1',
  '^@application/(.*)$': '<rootDir>/src/core/application/$1',
  '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
  '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  '^@test/(.*)$': '<rootDir>/test/$1',
};

module.exports = {
  preset: 'ts-jest',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  coverageDirectory: './coverage',
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testMatch: ['<rootDir>/src/**/*.spec.ts'],
      moduleNameMapper: baseModuleNameMapper,
      rootDir: '.',
      testEnvironment: 'node',
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
      },
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],
      moduleNameMapper: baseModuleNameMapper,
      rootDir: '.',
      testEnvironment: 'node',
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
      },
    },
    {
      displayName: 'e2e',
      preset: 'ts-jest',
      testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
      moduleNameMapper: baseModuleNameMapper,
      rootDir: '.',
      testEnvironment: 'node',
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
      },
    },
  ],
};
