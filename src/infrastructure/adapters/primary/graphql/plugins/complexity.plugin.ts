import { Optional } from '@nestjs/common';
import { Plugin } from '@nestjs/apollo';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import {
  ApolloServerPlugin,
  GraphQLRequestContextDidResolveOperation,
  GraphQLRequestListener,
  BaseContext,
} from '@apollo/server';
import { GraphQLError } from 'graphql';
import { fieldExtensionsEstimator, getComplexity, simpleEstimator } from 'graphql-query-complexity';
import { Logger } from 'nestjs-pino';

@Plugin()
export class ComplexityPlugin implements ApolloServerPlugin {
  private readonly MAX_COMPLEXITY = 1000;

  constructor(
    private readonly gqlSchemaHost: GraphQLSchemaHost,
    @Optional() private readonly logger?: Logger,
  ) {}

  requestDidStart(): Promise<GraphQLRequestListener<BaseContext>> {
    const max = this.MAX_COMPLEXITY;
    const logger = this.logger;
    const schemaHost = this.gqlSchemaHost;

    return Promise.resolve({
      didResolveOperation({
        request,
        document,
      }: GraphQLRequestContextDidResolveOperation<BaseContext>) {
        return Promise.resolve().then(() => {
          if (!schemaHost?.schema) {
            logger?.warn('GraphQL schema not available for complexity check');
            return;
          }

          const complexity = getComplexity({
            schema: schemaHost.schema,
            operationName: request.operationName,
            query: document,
            variables: request.variables,
            estimators: [fieldExtensionsEstimator(), simpleEstimator({ defaultComplexity: 1 })],
          });

          if (complexity > max) {
            logger?.warn({ complexity, maxComplexity: max }, 'Query complexity exceeded limit');

            throw new GraphQLError(
              `Query is too complex: ${complexity}. Maximum allowed complexity: ${max}`,
              {
                extensions: {
                  code: 'QUERY_TOO_COMPLEX',
                  complexity,
                  maxComplexity: max,
                },
              },
            );
          }

          logger?.debug({ complexity }, 'Query complexity calculated');
        });
      },
    });
  }
}
