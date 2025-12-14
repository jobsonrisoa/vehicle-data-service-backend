import { Test } from '@nestjs/testing';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
import { Logger } from 'nestjs-pino';

import { GraphQLModule } from '@infrastructure/adapters/primary/graphql/graphql.module';
import { VehicleTypeDataLoader } from '@infrastructure/adapters/primary/graphql/dataloaders/vehicle-type.dataloader';

describe('GraphQLModule', () => {
  it('builds module with GraphQL provider', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLModule],
      providers: [
        {
          provide: 'IVehicleMakeRepository',
          useValue: { findById: jest.fn() },
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
    }).compile();

    const graphqlModule = moduleRef.get(NestGraphQLModule, { strict: false });
    expect(graphqlModule).toBeDefined();
  });
});

