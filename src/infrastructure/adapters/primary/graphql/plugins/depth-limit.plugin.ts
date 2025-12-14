import { Optional } from '@nestjs/common';
import { Plugin } from '@nestjs/apollo';
import { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';
import { Logger } from 'nestjs-pino';

@Plugin()
export class DepthLimitPlugin implements ApolloServerPlugin {
  private readonly MAX_DEPTH = 10;

  constructor(@Optional() private readonly logger?: Logger) {}

  requestDidStart(): Promise<GraphQLRequestListener<any>> {
    const maxDepth = this.MAX_DEPTH;
    const logger = this.logger;
    return Promise.resolve({
      async validationDidStart() {
        await Promise.resolve();
        return async (errors?: ReadonlyArray<Error>) => {
          await Promise.resolve();
          if (!errors || errors.length === 0) {
            return;
          }
          const hasDepthError = errors.some((err) => err.message.includes('depth'));
          if (hasDepthError) {
            logger?.warn({ maxDepth }, 'Query depth exceeded limit');
          }
        };
      },
    });
  }
}
