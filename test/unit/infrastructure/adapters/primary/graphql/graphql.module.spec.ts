import { Test } from '@nestjs/testing';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';

import { GraphQLModule } from '@infrastructure/adapters/primary/graphql/graphql.module';

describe('GraphQLModule', () => {
  it('builds module with GraphQL provider', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GraphQLModule],
    }).compile();

    const graphqlModule = moduleRef.get(NestGraphQLModule, { strict: false });
    expect(graphqlModule).toBeDefined();
  });
});

