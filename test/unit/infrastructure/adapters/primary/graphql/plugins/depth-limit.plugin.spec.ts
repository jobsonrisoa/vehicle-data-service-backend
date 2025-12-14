import { Logger } from 'nestjs-pino';

import { DepthLimitPlugin } from '@infrastructure/adapters/primary/graphql/plugins/depth-limit.plugin';

jest.mock('graphql-depth-limit', () => jest.fn());

describe('DepthLimitPlugin', () => {
  let plugin: DepthLimitPlugin;
  let logger: Logger;
  let mockDepthLimit: jest.Mock;

  beforeEach(() => {
    logger = {
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;
    mockDepthLimit = require('graphql-depth-limit');
    mockDepthLimit.mockReturnValue(() => undefined);
    plugin = new DepthLimitPlugin(logger);
  });

  it('allows queries within depth', async () => {
    const listener = await plugin.requestDidStart();
    await listener.didResolveOperation?.({ document: {} } as any);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('rejects queries over depth', async () => {
    const mockError = new Error('depth');
    mockDepthLimit.mockReturnValue(() => [mockError]);
    plugin = new DepthLimitPlugin(logger);

    const listener = await plugin.requestDidStart();
    await expect(listener.didResolveOperation?.({ document: {} } as any)).rejects.toBe(mockError);
    expect(logger.warn).toHaveBeenCalled();
  });
});

