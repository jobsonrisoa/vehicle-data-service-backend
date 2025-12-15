import { Test } from '@nestjs/testing';
import { GraphQLModule as NestGraphQLModule, GraphQLSchemaHost } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Logger } from 'nestjs-pino';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';

import { VehicleTypeDataLoader } from '@infrastructure/adapters/primary/graphql/dataloaders/vehicle-type.dataloader';
import { VehicleResolver } from '@infrastructure/adapters/primary/graphql/resolvers/vehicle.resolver';
import { IngestionResolver } from '@infrastructure/adapters/primary/graphql/resolvers/ingestion.resolver';
import { ComplexityPlugin } from '@infrastructure/adapters/primary/graphql/plugins/complexity.plugin';
import { DepthLimitPlugin } from '@infrastructure/adapters/primary/graphql/plugins/depth-limit.plugin';

describe('GraphQLModule', () => {
  it('builds module with GraphQL provider', async () => {
    const moduleBuilder = Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        NestGraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: join(process.cwd(), 'test-schema.gql'),
          sortSchema: true,
        }),
      ],
      providers: [
        {
          provide: 'IVehicleMakeRepository',
          useValue: { findById: jest.fn(), findAll: jest.fn() },
        },
        {
          provide: 'IQueryVehiclesPort',
          useValue: {
            getAll: jest.fn(),
            getById: jest.fn(),
            search: jest.fn(),
            getStatistics: jest.fn(),
          },
        },
        {
          provide: 'IIngestDataPort',
          useValue: {
            triggerIngestion: jest.fn(),
            getCurrentIngestion: jest.fn(),
            getIngestionStatus: jest.fn(),
            getIngestionHistory: jest.fn(),
          },
        },
        {
          provide: VehicleTypeDataLoader,
          useValue: { createLoader: jest.fn() },
        },
        {
          provide: Logger,
          useValue: { warn: jest.fn(), debug: jest.fn(), info: jest.fn() },
        },
        {
          provide: GraphQLSchemaHost,
          useValue: { schema: null },
        },
        VehicleResolver,
        IngestionResolver,
        ComplexityPlugin,
        DepthLimitPlugin,
      ],
    });

    const moduleRef = await moduleBuilder.compile();

    const graphqlModule = moduleRef.get(NestGraphQLModule, { strict: false });
    expect(graphqlModule).toBeDefined();
  });
});
