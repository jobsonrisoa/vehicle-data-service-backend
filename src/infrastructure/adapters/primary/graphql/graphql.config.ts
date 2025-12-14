import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import depthLimitImport from 'graphql-depth-limit';
import { GraphQLFormattedError, ValidationRule } from 'graphql';
import { join } from 'path';

import { VehicleTypeDataLoader } from './dataloaders/vehicle-type.dataloader';
import { ComplexityPlugin } from './plugins/complexity.plugin';
import { DepthLimitPlugin } from './plugins/depth-limit.plugin';

export const getGraphQLConfig = (
  configService: ConfigService,
  moduleRef?: ModuleRef,
): ApolloDriverConfig => {
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
  const isDevelopment = nodeEnv === 'development';
  const depthLimitModule: unknown = depthLimitImport;
  type DepthLimitFunction = (maxDepth: number) => unknown;
  const depthLimitFn =
    (depthLimitModule as { default?: DepthLimitFunction })?.default ??
    (depthLimitModule as DepthLimitFunction | undefined);
  const depthLimitRule = typeof depthLimitFn === 'function' ? depthLimitFn(10) : undefined;

  return {
    driver: ApolloDriver,
    autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    sortSchema: true,
    playground: isDevelopment,
    introspection: nodeEnv !== 'production',
    validationRules: depthLimitRule ? [depthLimitRule as ValidationRule] : [],
    context: ({ req, res }: { req: unknown; res: unknown }) => {
      const loaderInstance = moduleRef?.get(VehicleTypeDataLoader, { strict: false });
      return {
        req,
        res,
        vehicleTypeLoader: loaderInstance?.createLoader(),
      };
    },
    formatError: (error: GraphQLFormattedError, originalError: unknown) => {
      const extensions = error.extensions ?? {};
      return {
        message: error.message,
        code: (extensions.code as string | undefined) ?? 'INTERNAL_SERVER_ERROR',
        path: error.path,
        locations: error.locations,
        extensions: {
          ...extensions,
          stacktrace: isDevelopment ? extensions.stacktrace : undefined,
          originalError,
        },
      };
    },
    plugins: [
      moduleRef?.get(ComplexityPlugin, { strict: false }),
      moduleRef?.get(DepthLimitPlugin, { strict: false }),
    ].filter((plugin): plugin is NonNullable<typeof plugin> => Boolean(plugin)),
  };
};
