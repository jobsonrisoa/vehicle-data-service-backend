import { Module } from '@nestjs/common';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloDriver } from '@nestjs/apollo';
import { ModuleRef } from '@nestjs/core';

import { getGraphQLConfig } from './graphql.config';
import { VehicleTypeDataLoader } from './dataloaders/vehicle-type.dataloader';
import { ComplexityPlugin } from './plugins/complexity.plugin';
import { DepthLimitPlugin } from './plugins/depth-limit.plugin';
import { VehicleResolver } from './resolvers/vehicle.resolver';
import { IngestionResolver } from './resolvers/ingestion.resolver';
import { ApplicationModule } from '@core/application/application.module';

@Module({
  imports: [
    ConfigModule,
    ApplicationModule,
    NestGraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService, ModuleRef],
      useFactory: (configService: ConfigService, moduleRef: ModuleRef) =>
        getGraphQLConfig(configService, moduleRef),
    }),
  ],
  providers: [
    VehicleTypeDataLoader,
    ComplexityPlugin,
    DepthLimitPlugin,
    VehicleResolver,
    IngestionResolver,
  ],
})
export class GraphQLModule {}
