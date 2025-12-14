import { Test } from '@nestjs/testing';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
import { Logger } from 'nestjs-pino';

import { GraphQLModule } from '@infrastructure/adapters/primary/graphql/graphql.module';
import { VehicleTypeDataLoader } from '@infrastructure/adapters/primary/graphql/dataloaders/vehicle-type.dataloader';
import { VehicleResolver } from '@infrastructure/adapters/primary/graphql/resolvers/vehicle.resolver';
import { IngestionResolver } from '@infrastructure/adapters/primary/graphql/resolvers/ingestion.resolver';

describe('GraphQLModule', () => {
  it('builds module with GraphQL provider', async () => {
    const moduleBuilder = Test.createTestingModule({
      imports: [GraphQLModule],
      providers: [
        {
          provide: 'IVehicleMakeRepository',
          useValue: { findById: jest.fn() },
        },
        {
          provide: 'IQueryVehiclesPort',
          useValue: { getAll: jest.fn(), getById: jest.fn() },
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
          useValue: { warn: jest.fn(), debug: jest.fn() },
        },
      ],
    });

    const moduleRef = await moduleBuilder
      .overrideProvider(VehicleResolver)
      .useValue({})
      .overrideProvider(IngestionResolver)
      .useValue({})
      .compile();

    const graphqlModule = moduleRef.get(NestGraphQLModule, { strict: false });
    expect(graphqlModule).toBeDefined();
  });
});

