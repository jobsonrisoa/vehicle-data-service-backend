import { GraphQLSchemaHost } from '@nestjs/graphql';
import { Logger } from 'nestjs-pino';
import { GraphQLError } from 'graphql';

import { ComplexityPlugin } from '@infrastructure/adapters/primary/graphql/plugins/complexity.plugin';

jest.mock('graphql-query-complexity', () => ({
  getComplexity: jest.fn(),
  fieldExtensionsEstimator: jest.fn(() => 'ext'),
  simpleEstimator: jest.fn(() => 'simple'),
}));

const { getComplexity } = jest.requireMock('graphql-query-complexity');

describe('ComplexityPlugin', () => {
  let plugin: ComplexityPlugin;
  let logger: Logger;

  beforeEach(() => {
    logger = {
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;
    const schemaHost = { schema: {} } as GraphQLSchemaHost;
    plugin = new ComplexityPlugin(schemaHost, logger);
  });

  it('allows queries within limit', async () => {
    getComplexity.mockReturnValue(10);
    const listener = await plugin.requestDidStart();
    await listener.didResolveOperation?.({
      request: {},
      document: {},
    } as any);
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalled();
  });

  it('rejects queries over limit', async () => {
    getComplexity.mockReturnValue(2000);
    const listener = await plugin.requestDidStart();
    await expect(
      listener.didResolveOperation?.({
        request: {},
        document: {},
      } as any)
    ).rejects.toBeInstanceOf(GraphQLError);
    expect(logger.warn).toHaveBeenCalled();
  });
});

