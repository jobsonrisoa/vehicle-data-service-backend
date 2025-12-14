import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';

import { getGraphQLConfig } from '@infrastructure/adapters/primary/graphql/graphql.config';
import { VehicleTypeDataLoader } from '@infrastructure/adapters/primary/graphql/dataloaders/vehicle-type.dataloader';

describe('GraphQL configuration', () => {
  let configService: ConfigService;

  let moduleRef: ModuleRef;

  beforeEach(() => {
    configService = new ConfigService({
      NODE_ENV: 'development',
      CORS_ORIGIN: 'http://localhost:3000',
    });
    moduleRef = {
      get: jest.fn(),
    } as any;
    (moduleRef.get as jest.Mock).mockReturnValue({
      createLoader: jest.fn().mockReturnValue('loader'),
    });
  });

  it('enables playground in development', () => {
    const config = getGraphQLConfig(configService, moduleRef);
    expect(config.playground).toBe(true);
  });

  it('enables introspection outside production', () => {
    const config = getGraphQLConfig(configService, moduleRef);
    expect(config.introspection).toBe(true);
  });

  it('disables playground in production', () => {
    configService = new ConfigService({ NODE_ENV: 'production' });
    const config = getGraphQLConfig(configService, moduleRef);
    expect(config.playground).toBe(false);
  });

  it('disables introspection in production', () => {
    configService = new ConfigService({ NODE_ENV: 'production' });
    const config = getGraphQLConfig(configService, moduleRef);
    expect(config.introspection).toBe(false);
  });

  it('sets autoschema path', () => {
    const config = getGraphQLConfig(configService, moduleRef);
    expect(config.autoSchemaFile?.toString()).toContain('schema.gql');
  });

  it('sorts schema', () => {
    const config = getGraphQLConfig(configService, moduleRef);
    expect(config.sortSchema).toBe(true);
  });

  it('formats errors with code and message', () => {
    const config = getGraphQLConfig(configService, moduleRef);
    const mockError = {
      message: 'Test error',
      extensions: { code: 'BAD_USER_INPUT' },
      path: ['test'],
      locations: [],
    } as any;

    const formatted = config.formatError!(mockError, {});
    expect(formatted.message).toBe('Test error');
    expect((formatted as any).code).toBe('BAD_USER_INPUT');
  });

  it('includes stacktrace in development', () => {
    const config = getGraphQLConfig(configService);
    const mockError = {
      message: 'Test error',
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        stacktrace: ['line 1', 'line 2'],
      },
      path: [],
      locations: [],
    } as any;

    const formatted = config.formatError!(mockError, {});
    expect((formatted as any).extensions.stacktrace).toBeDefined();
  });

  it('omits stacktrace in production', () => {
    configService = new ConfigService({ NODE_ENV: 'production' });
    const config = getGraphQLConfig(configService);
    const mockError = {
      message: 'Test error',
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        stacktrace: ['line 1', 'line 2'],
      },
      path: [],
      locations: [],
    } as any;

    const formatted = config.formatError!(mockError, {});
    expect((formatted as any).extensions.stacktrace).toBeUndefined();
  });
});

