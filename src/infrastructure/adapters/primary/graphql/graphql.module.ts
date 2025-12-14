import { Module } from '@nestjs/common';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloDriver } from '@nestjs/apollo';
import { ModuleRef } from '@nestjs/core';

import { getGraphQLConfig } from './graphql.config';
import { VehicleTypeDataLoader } from './dataloaders/vehicle-type.dataloader';

@Module({
  imports: [
    ConfigModule,
    NestGraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService, ModuleRef],
      useFactory: (configService: ConfigService, moduleRef: ModuleRef) =>
        getGraphQLConfig(configService, moduleRef),
    }),
  ],
  providers: [VehicleTypeDataLoader],
})
export class GraphQLModule {}

