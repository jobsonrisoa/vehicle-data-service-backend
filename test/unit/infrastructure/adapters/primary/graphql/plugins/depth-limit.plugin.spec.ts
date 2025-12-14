import { Logger } from 'nestjs-pino';
import { GraphQLError } from 'graphql';

import { DepthLimitPlugin } from '@infrastructure/adapters/primary/graphql/plugins/depth-limit.plugin';

describe('DepthLimitPlugin', () => {
  let plugin: DepthLimitPlugin;
  let logger: jest.Mocked<Logger>;

  beforeEach(() => {
    logger = {
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<Logger>;
    plugin = new DepthLimitPlugin(logger);
  });

  it('allows queries within depth', async () => {
    const listener = await plugin.requestDidStart();
    const end = await listener.validationDidStart?.({} as never);
    if (end) {
      await Promise.resolve(end([]));
    }
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('rejects queries over depth', async () => {
    const listener = await plugin.requestDidStart();
    const end = await listener.validationDidStart?.({} as never);
    if (end) {
      await Promise.resolve(end([new GraphQLError('depth exceeded')]));
    }
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(logger.warn).toHaveBeenCalled();
  });
});
