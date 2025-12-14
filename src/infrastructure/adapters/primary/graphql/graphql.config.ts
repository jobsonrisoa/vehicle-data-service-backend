import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { GraphQLFormattedError } from 'graphql';
import { join } from 'path';

import { VehicleTypeDataLoader } from './dataloaders/vehicle-type.dataloader';
import { ComplexityPlugin } from './plugins/complexity.plugin';
import { DepthLimitPlugin } from './plugins/depth-limit.plugin';

export const getGraphQLConfig = (
  configService: ConfigService,
  moduleRef?: ModuleRef
): ApolloDriverConfig => {
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  const isDevelopment = nodeEnv === 'development';

  return {
    driver: ApolloDriver,
    autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    sortSchema: true,
    playground: isDevelopment,
    introspection: nodeEnv !== 'production',
    context: ({ req, res }: { req: unknown; res: unknown }) => {
      const loaderInstance = moduleRef?.get(VehicleTypeDataLoader, { strict: false });
      return {
        req,
        res,
        vehicleTypeLoader: loaderInstance?.createLoader(),
      };
    },
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
    plugins: [
      moduleRef?.get(ComplexityPlugin, { strict: false }),
      moduleRef?.get(DepthLimitPlugin, { strict: false }),
    ].filter(Boolean) as any,
  };
};

