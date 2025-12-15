/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unused-vars */
import { Given, When, Then } from '@cucumber/cucumber';
import * as assert from 'assert';
import * as request from 'supertest';

import { VehicleWorld, GraphQLResponse } from '../support/world';

Given(
  'a vehicle make {string} with ID {int} exists',
  async function (this: VehicleWorld, makeName: string, makeId: number) {
    const dataSource = this.getDataSource();

    await dataSource.query(
      `
    INSERT INTO vehicle_makes (make_id, make_name)
    VALUES ($1, $2)
    ON CONFLICT (make_id) DO NOTHING
  `,
      [makeId, makeName],
    );
  },
);

Given('the make has {int} vehicle types', async function (this: VehicleWorld, typeCount: number) {
  const dataSource = this.getDataSource();

  const makes = await dataSource.query(
    'SELECT id, make_id FROM vehicle_makes ORDER BY make_id DESC LIMIT 1',
  );
  if (makes.length > 0) {
    const make = makes[0] as { id: string; make_id: number };

    for (let i = 0; i < typeCount; i++) {
      await dataSource.query(
        `
        INSERT INTO vehicle_types (type_id, type_name, vehicle_make_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (type_id, vehicle_make_id) DO NOTHING
      `,
        [make.make_id * 10 + i, `Vehicle Type ${i + 1}`, make.id],
      );
    }
  }
});

Given(
  'vehicle makes contain {string}, {string}, and {string}',
  async function (this: VehicleWorld, make1: string, make2: string, make3: string) {
    const dataSource = this.getDataSource();
    const makes = [make1, make2, make3];

    for (let i = 0; i < makes.length; i++) {
      await dataSource.query(
        `
      INSERT INTO vehicle_makes (make_id, make_name)
      VALUES ($1, $2)
      ON CONFLICT (make_id) DO NOTHING
    `,
        [500 + i, makes[i]],
      );
    }
  },
);

Given('there are {int} vehicle makes', async function (this: VehicleWorld, count: number) {
  const dataSource = this.getDataSource();

  for (let i = 1; i <= count; i++) {
    await dataSource.query(
      `
      INSERT INTO vehicle_makes (make_id, make_name)
      VALUES ($1, $2)
      ON CONFLICT (make_id) DO NOTHING
    `,
      [400 + i, `TEST MAKE ${i}`],
    );
  }
});

When('I execute the following GraphQL query:', async function (this: VehicleWorld, query: string) {
  const response = await request(this.getApp().getHttpServer()).post('/graphql').send({ query });

  this.setGraphQLResponse({
    status: response.status,
    body: response.body as GraphQLResponse['body'],
  });
});

When(
  'I query for the first {int} vehicle makes',
  async function (this: VehicleWorld, count: number) {
    const query = `
    query {
      vehicleMakes(first: ${count}) {
        edges {
          node {
            id
            makeId
            makeName
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        totalCount
      }
    }
  `;

    const response = await request(this.getApp().getHttpServer()).post('/graphql').send({ query });

    this.setGraphQLResponse({
      status: response.status,
      body: response.body as GraphQLResponse['body'],
    });

    const data = response.body as { data?: { vehicleMakes?: { edges?: unknown[] } } };
    if (data.data?.vehicleMakes?.edges) {
      this.setContext('previousPageResults', data.data.vehicleMakes.edges);
    }
  },
);

When('I capture the endCursor from the response', function (this: VehicleWorld) {
  const response = this.getGraphQLResponse();
  assert.ok(response, 'GraphQL response should exist');

  const data = response.body.data as
    | { vehicleMakes?: { pageInfo?: { endCursor?: string } } }
    | undefined;
  const cursor = data?.vehicleMakes?.pageInfo?.endCursor;
  assert.ok(cursor, 'End cursor should exist');
  this.setCursor(cursor);
});

When(
  'I query for the next {int} vehicle makes using the captured cursor',
  async function (this: VehicleWorld, count: number) {
    const cursor = this.getCursor();
    assert.ok(cursor, 'Cursor should be set');

    const query = `
    query {
      vehicleMakes(first: ${count}, after: "${cursor}") {
        edges {
          node {
            id
            makeId
            makeName
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
        }
      }
    }
  `;

    const response = await request(this.getApp().getHttpServer()).post('/graphql').send({ query });

    this.setGraphQLResponse({
      status: response.status,
      body: response.body as GraphQLResponse['body'],
    });

    const data = response.body as { data?: { vehicleMakes?: { edges?: unknown[] } } };
    if (data.data?.vehicleMakes?.edges) {
      this.setContext('currentPageResults', data.data.vehicleMakes.edges);
    }
  },
);

When(
  'I execute a GraphQL query with an invalid field {string}',
  async function (this: VehicleWorld, fieldName: string) {
    const query = `
    query {
      vehicleMakes {
        edges {
          node {
            ${fieldName}
          }
        }
      }
    }
  `;

    const response = await request(this.getApp().getHttpServer()).post('/graphql').send({ query });

    this.setGraphQLResponse({
      status: response.status,
      body: response.body as GraphQLResponse['body'],
    });
  },
);

When(
  'I execute a GraphQL query with complexity exceeding {int}',
  async function (this: VehicleWorld, _complexity: number) {
    const query = `
    query {
      vehicleMakes(first: 100) {
        edges {
          node {
            id
            makeId
            makeName
            vehicleTypes {
              typeId
              typeName
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        totalCount
      }
    }
  `;

    const response = await request(this.getApp().getHttpServer()).post('/graphql').send({ query });

    this.setGraphQLResponse({
      status: response.status,
      body: response.body as GraphQLResponse['body'],
    });
  },
);

When(
  'I execute a GraphQL query with depth exceeding {int}',
  async function (this: VehicleWorld, _depth: number) {
    // GraphQL depth limit testing - creating a deeply nested query
    const query = `
    query {
      vehicleMakes {
        edges {
          node {
            vehicleTypes {
              typeName
            }
          }
        }
      }
    }
  `;

    const response = await request(this.getApp().getHttpServer()).post('/graphql').send({ query });

    this.setGraphQLResponse({
      status: response.status,
      body: response.body as GraphQLResponse['body'],
    });
  },
);

When('I execute a GraphQL query', async function (this: VehicleWorld) {
  const query = `
    query {
      vehicleMakes(first: 10) {
        edges {
          node {
            makeId
            makeName
          }
        }
      }
    }
  `;

  const response = await request(this.getApp().getHttpServer()).post('/graphql').send({ query });

  this.setGraphQLResponse({
    status: response.status,
    body: response.body as GraphQLResponse['body'],
  });
});

Then('I should receive {int} vehicle makes', function (this: VehicleWorld, expectedCount: number) {
  const response = this.getGraphQLResponse();
  assert.ok(response, 'GraphQL response should exist');

  const data = response.body.data as { vehicleMakes?: { edges?: unknown[] } } | undefined;
  const edges = data?.vehicleMakes?.edges ?? [];
  assert.strictEqual(edges.length, expectedCount);
});

Then('each make should have an id, makeId, and makeName', function (this: VehicleWorld) {
  const response = this.getGraphQLResponse();
  assert.ok(response, 'GraphQL response should exist');

  type Edge = { node: { id?: string; makeId?: number; makeName?: string } };
  const data = response.body.data as { vehicleMakes?: { edges?: Edge[] } } | undefined;
  const edges = data?.vehicleMakes?.edges ?? [];

  for (const edge of edges) {
    assert.ok(edge.node.id, 'Each make should have id');
    assert.ok(edge.node.makeId, 'Each make should have makeId');
    assert.ok(edge.node.makeName, 'Each make should have makeName');
  }
});

Then(
  'the pageInfo should indicate hasNextPage is {word}',
  function (this: VehicleWorld, expected: string) {
    const response = this.getGraphQLResponse();
    assert.ok(response, 'GraphQL response should exist');

    const data = response.body.data as
      | { vehicleMakes?: { pageInfo?: { hasNextPage?: boolean } } }
      | undefined;
    const hasNextPage = data?.vehicleMakes?.pageInfo?.hasNextPage;
    assert.strictEqual(hasNextPage, expected === 'true');
  },
);

Then(
  'the pageInfo should indicate hasPreviousPage is {word}',
  function (this: VehicleWorld, expected: string) {
    const response = this.getGraphQLResponse();
    assert.ok(response, 'GraphQL response should exist');

    const data = response.body.data as
      | { vehicleMakes?: { pageInfo?: { hasPreviousPage?: boolean } } }
      | undefined;
    const hasPreviousPage = data?.vehicleMakes?.pageInfo?.hasPreviousPage;
    assert.strictEqual(hasPreviousPage, expected === 'true');
  },
);

Then('the totalCount should be {int}', function (this: VehicleWorld, expectedCount: number) {
  const response = this.getGraphQLResponse();
  assert.ok(response, 'GraphQL response should exist');

  const data = response.body.data as { vehicleMakes?: { totalCount?: number } } | undefined;
  const totalCount = data?.vehicleMakes?.totalCount ?? 0;
  assert.ok(totalCount >= expectedCount, `Total count should be at least ${expectedCount}`);
});

Then('the make should have makeId {int}', function (this: VehicleWorld, expectedId: number) {
  const response = this.getGraphQLResponse();
  assert.ok(response, 'GraphQL response should exist');

  const data = response.body.data as { vehicleMake?: { makeId?: number } } | undefined;
  assert.strictEqual(data?.vehicleMake?.makeId, expectedId);
});

Then('the make should have makeName {string}', function (this: VehicleWorld, expectedName: string) {
  const response = this.getGraphQLResponse();
  assert.ok(response, 'GraphQL response should exist');

  const data = response.body.data as { vehicleMake?: { makeName?: string } } | undefined;
  assert.strictEqual(data?.vehicleMake?.makeName, expectedName);
});

Then(
  'the make should have {int} vehicle types',
  function (this: VehicleWorld, expectedCount: number) {
    const response = this.getGraphQLResponse();
    assert.ok(response, 'GraphQL response should exist');

    const data = response.body.data as { vehicleMake?: { vehicleTypes?: unknown[] } } | undefined;
    const types = data?.vehicleMake?.vehicleTypes ?? [];
    assert.strictEqual(types.length, expectedCount);
  },
);

Then('each vehicle type should have typeId and typeName', function (this: VehicleWorld) {
  const response = this.getGraphQLResponse();
  assert.ok(response, 'GraphQL response should exist');

  type VehicleType = { typeId?: number; typeName?: string };
  const data = response.body.data as { vehicleMake?: { vehicleTypes?: VehicleType[] } } | undefined;
  const types = data?.vehicleMake?.vehicleTypes ?? [];

  for (const type of types) {
    assert.ok(type.typeId, 'Each type should have typeId');
    assert.ok(type.typeName, 'Each type should have typeName');
  }
});

Then(
  'all returned makes should contain {string} in the name',
  function (this: VehicleWorld, substring: string) {
    const response = this.getGraphQLResponse();
    assert.ok(response, 'GraphQL response should exist');

    type Edge = { node: { makeName?: string } };
    const data = response.body.data as { vehicleMakes?: { edges?: Edge[] } } | undefined;
    const edges = data?.vehicleMakes?.edges ?? [];

    for (const edge of edges) {
      assert.ok(
        edge.node.makeName?.includes(substring),
        `Make name "${edge.node.makeName}" should contain "${substring}"`,
      );
    }
  },
);

Then(
  'the make {string} should not be in the results',
  function (this: VehicleWorld, makeName: string) {
    const response = this.getGraphQLResponse();
    assert.ok(response, 'GraphQL response should exist');

    type Edge = { node: { makeName?: string } };
    const data = response.body.data as { vehicleMakes?: { edges?: Edge[] } } | undefined;
    const edges = data?.vehicleMakes?.edges ?? [];

    const found = edges.some((edge) => edge.node.makeName === makeName);
    assert.ok(!found, `Make "${makeName}" should not be in results`);
  },
);

Then('the result should be null', function (this: VehicleWorld) {
  const response = this.getGraphQLResponse();
  assert.ok(response, 'GraphQL response should exist');

  const data = response.body.data as { vehicleMake?: unknown } | undefined;
  assert.strictEqual(data?.vehicleMake, null);
});

Then('no error should be thrown', function (this: VehicleWorld) {
  const response = this.getGraphQLResponse();
  assert.ok(response, 'GraphQL response should exist');
  assert.ok(!response.body.errors, 'Should have no errors');
});

Then(
  'I should receive {int} different vehicle makes',
  function (this: VehicleWorld, expectedCount: number) {
    const currentResults = this.getContext<unknown[]>('currentPageResults') ?? [];
    assert.strictEqual(currentResults.length, expectedCount);
  },
);

Then('the results should not overlap with the previous page', function (this: VehicleWorld) {
  type Edge = { node: { makeId?: number } };
  const previousResults = this.getContext<Edge[]>('previousPageResults') ?? [];
  const currentResults = this.getContext<Edge[]>('currentPageResults') ?? [];

  const previousIds = previousResults.map((e) => e.node.makeId);
  const currentIds = currentResults.map((e) => e.node.makeId);

  const overlap = previousIds.filter((id) => currentIds.includes(id));
  assert.strictEqual(overlap.length, 0, 'Results should not overlap');
});

Then('the vehicle makes should be in the correct order', function (this: VehicleWorld) {
  type Edge = { node: { makeId?: number } };
  const currentResults = this.getContext<Edge[]>('currentPageResults') ?? [];

  const ids = currentResults.map((e) => e.node.makeId ?? 0);
  const sortedIds = [...ids].sort((a, b) => a - b);

  assert.deepStrictEqual(ids, sortedIds, 'Results should be in order');
});
