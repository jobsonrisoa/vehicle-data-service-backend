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
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: baseModuleNameMapper,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.e2e-spec.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
  ],
  coverageDirectory: './coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
      },
      testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],
      setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
      moduleNameMapper: baseModuleNameMapper,
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
      },
      testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],
      testTimeout: 30000,
      setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
      moduleNameMapper: baseModuleNameMapper,
    },
    {
      displayName: 'e2e',
      preset: 'ts-jest',
      transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
      },
      testMatch: ['<rootDir>/test/e2e/**/*.e2e-spec.ts'],
      testTimeout: 60000,
      setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
      moduleNameMapper: baseModuleNameMapper,
    },
  ],
};
