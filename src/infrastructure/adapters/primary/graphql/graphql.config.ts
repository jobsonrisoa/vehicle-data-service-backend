import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigService } from '@nestjs/config';
import { GraphQLFormattedError } from 'graphql';
import { join } from 'path';

export const getGraphQLConfig = (configService: ConfigService): ApolloDriverConfig => {
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  const isDevelopment = nodeEnv === 'development';

  return {
    driver: ApolloDriver,
    autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    sortSchema: true,
    playground: isDevelopment,
    introspection: nodeEnv !== 'production',
    context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
    formatError: (error: GraphQLFormattedError, originalError: unknown) => {
      return {
        message: error.message,
        code: (error.extensions as any)?.code || 'INTERNAL_SERVER_ERROR',
        path: error.path,
        locations: error.locations,
        extensions: {
          ...error.extensions,
          stacktrace: isDevelopment ? (error.extensions as any)?.stacktrace : undefined,
          originalError,
        },
      };
    },
  };
};

