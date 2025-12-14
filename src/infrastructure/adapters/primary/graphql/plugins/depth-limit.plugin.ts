import { Optional } from '@nestjs/common';
import { Plugin } from '@nestjs/apollo';
import {
  ApolloServerPlugin,
  GraphQLRequestListener,
} from 'apollo-server-plugin-base';
import { Logger } from 'nestjs-pino';
import * as depthLimitModule from 'graphql-depth-limit';

@Plugin()
export class DepthLimitPlugin implements ApolloServerPlugin {
  private readonly MAX_DEPTH = 10;

  constructor(@Optional() private readonly logger?: Logger) {}

  async requestDidStart(): Promise<GraphQLRequestListener> {
    const maxDepth = this.MAX_DEPTH;
    const logger = this.logger;
    const depthLimitFn: any = (depthLimitModule as any).default || (depthLimitModule as any);
    return {
      async didResolveOperation({ document }) {
        const validationErrors = depthLimitFn(
          maxDepth,
          {},
          (depths: Record<string, number>) => {
            logger?.debug({ depths }, 'Query depth calculated');
          }
        )(document);

        if (validationErrors && validationErrors.length > 0) {
          logger?.warn(
            { maxDepth },
            'Query depth exceeded limit'
          );

          throw validationErrors[0];
        }
      },
    };
  }
}

