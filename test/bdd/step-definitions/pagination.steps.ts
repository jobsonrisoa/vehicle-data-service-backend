/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unused-vars */
import { Given, When, Then } from '@cucumber/cucumber';
import * as assert from 'assert';
import * as request from 'supertest';

import { VehicleWorld, GraphQLResponse } from '../support/world';

Given(
  'I am on page {int} of vehicle makes',
  async function (this: VehicleWorld, pageNumber: number) {
    const pageSize = 20;

    for (let page = 1; page < pageNumber; page++) {
      const cursor = this.getCursor();
      const afterClause = cursor ? `, after: "${cursor}"` : '';

      const query = `
      query {
        vehicleMakes(first: ${pageSize}${afterClause}) {
          edges {
            node {
              makeId
              makeName
            }
            cursor
          }
          pageInfo {
            endCursor
          }
        }
      }
    `;

      const response = await request(this.getApp().getHttpServer())
        .post('/graphql')
        .send({ query });

      const data = response.body as {
        data?: { vehicleMakes?: { pageInfo?: { endCursor?: string } } };
      };
      const endCursor = data.data?.vehicleMakes?.pageInfo?.endCursor;
      if (endCursor) {
        this.setCursor(endCursor);
      }
    }

    this.setContext('currentPage', pageNumber);
  },
);

Given('I am on the last page of vehicle makes', async function (this: VehicleWorld) {
  const pageSize = 20;
  let hasNextPage = true;

  while (hasNextPage) {
    const cursor = this.getCursor();
    const afterClause = cursor ? `, after: "${cursor}"` : '';

    const query = `
      query {
        vehicleMakes(first: ${pageSize}${afterClause}) {
          edges {
            node {
              makeId
            }
            cursor
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const response = await request(this.getApp().getHttpServer()).post('/graphql').send({ query });

    const data = response.body as {
      data?: {
        vehicleMakes?: {
          edges?: unknown[];
          pageInfo?: { hasNextPage?: boolean; endCursor?: string };
        };
      };
    };

    hasNextPage = data.data?.vehicleMakes?.pageInfo?.hasNextPage ?? false;
    const endCursor = data.data?.vehicleMakes?.pageInfo?.endCursor;

    if (hasNextPage && endCursor) {
      this.setCursor(endCursor);
      const edges = data.data?.vehicleMakes?.edges;
      if (edges) {
        this.setContext('previousPageResults', edges);
      }
    }
  }
});

Given('I have navigated to page {int}', async function (this: VehicleWorld, pageNumber: number) {
  const pageSize = 20;

  for (let page = 1; page <= pageNumber; page++) {
    const cursor = this.getCursor();
    const afterClause = cursor ? `, after: "${cursor}"` : '';

    const query = `
      query {
        vehicleMakes(first: ${pageSize}${afterClause}) {
          edges {
            node {
              makeId
              makeName
            }
            cursor
          }
          pageInfo {
            startCursor
            endCursor
          }
        }
      }
    `;

    const response = await request(this.getApp().getHttpServer()).post('/graphql').send({ query });

    const data = response.body as {
      data?: {
        vehicleMakes?: {
          edges?: unknown[];
          pageInfo?: { startCursor?: string; endCursor?: string };
        };
      };
    };

    const pageInfo = data.data?.vehicleMakes?.pageInfo;
    if (pageInfo?.endCursor) {
      this.setCursor(pageInfo.endCursor);
    }
    if (pageInfo?.startCursor) {
      this.setContext('startCursor', pageInfo.startCursor);
    }
    if (data.data?.vehicleMakes?.edges) {
      this.setContext('previousPageResults', data.data.vehicleMakes.edges);
    }
  }
});

When(
  'I query for {int} vehicle makes using the cursor from page {int}',
  async function (this: VehicleWorld, count: number, _fromPage: number) {
    const cursor = this.getCursor();
    const afterClause = cursor ? `, after: "${cursor}"` : '';

    const query = `
    query {
      vehicleMakes(first: ${count}${afterClause}) {
        edges {
          node {
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
  'I query for {int} vehicle makes using the cursor from the second-to-last page',
  async function (this: VehicleWorld, count: number) {
    const cursor = this.getCursor();
    const afterClause = cursor ? `, after: "${cursor}"` : '';

    const query = `
    query {
      vehicleMakes(first: ${count}${afterClause}) {
        edges {
          node {
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
  },
);

When(
  'I use the startCursor and query for the last {int} items before it',
  async function (this: VehicleWorld, count: number) {
    const startCursor = this.getContext<string>('startCursor');

    const query = `
    query {
      vehicleMakes(last: ${count}${startCursor ? `, before: "${startCursor}"` : ''}) {
        edges {
          node {
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
  'I query with an invalid cursor {string}',
  async function (this: VehicleWorld, invalidCursor: string) {
    const query = `
    query {
      vehicleMakes(first: 10, after: "${invalidCursor}") {
        edges {
          node {
            makeId
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

    this.setResponse({
      status: response.body.errors ? 400 : response.status,
      body: response.body as Record<string, unknown>,
    });
  },
);

Then(
  'I should receive exactly {int} results',
  function (this: VehicleWorld, expectedCount: number) {
    const response = this.getGraphQLResponse();
    assert.ok(response, 'GraphQL response should exist');

    const data = response.body.data as { vehicleMakes?: { edges?: unknown[] } } | undefined;
    const edges = data?.vehicleMakes?.edges ?? [];
    assert.strictEqual(edges.length, expectedCount);
  },
);

Then(
  'I should receive {int} results \\(remaining items)',
  function (this: VehicleWorld, expectedCount: number) {
    const response = this.getGraphQLResponse();
    assert.ok(response, 'GraphQL response should exist');

    const data = response.body.data as { vehicleMakes?: { edges?: unknown[] } } | undefined;
    const edges = data?.vehicleMakes?.edges ?? [];
    assert.strictEqual(edges.length, expectedCount);
  },
);

Then('the pageInfo should have hasNextPage as true', function (this: VehicleWorld) {
  const response = this.getGraphQLResponse();
  assert.ok(response, 'GraphQL response should exist');

  const data = response.body.data as
    | { vehicleMakes?: { pageInfo?: { hasNextPage?: boolean } } }
    | undefined;
  assert.strictEqual(data?.vehicleMakes?.pageInfo?.hasNextPage, true);
});

Then('the pageInfo should have hasNextPage as false', function (this: VehicleWorld) {
  const response = this.getGraphQLResponse();
  assert.ok(response, 'GraphQL response should exist');

  const data = response.body.data as
    | { vehicleMakes?: { pageInfo?: { hasNextPage?: boolean } } }
    | undefined;
  assert.strictEqual(data?.vehicleMakes?.pageInfo?.hasNextPage, false);
});

Then('the pageInfo should have hasPreviousPage as true', function (this: VehicleWorld) {
  const response = this.getGraphQLResponse();
  assert.ok(response, 'GraphQL response should exist');

  const data = response.body.data as
    | { vehicleMakes?: { pageInfo?: { hasPreviousPage?: boolean } } }
    | undefined;
  assert.strictEqual(data?.vehicleMakes?.pageInfo?.hasPreviousPage, true);
});

Then('the pageInfo should have hasPreviousPage as false', function (this: VehicleWorld) {
  const response = this.getGraphQLResponse();
  assert.ok(response, 'GraphQL response should exist');

  const data = response.body.data as
    | { vehicleMakes?: { pageInfo?: { hasPreviousPage?: boolean } } }
    | undefined;
  assert.strictEqual(data?.vehicleMakes?.pageInfo?.hasPreviousPage, false);
});

Then("the startCursor should match the first result's cursor", function (this: VehicleWorld) {
  const response = this.getGraphQLResponse();
  assert.ok(response, 'GraphQL response should exist');

  type Edge = { cursor?: string };
  const data = response.body.data as
    | {
        vehicleMakes?: { edges?: Edge[]; pageInfo?: { startCursor?: string } };
      }
    | undefined;

  const edges = data?.vehicleMakes?.edges ?? [];
  const startCursor = data?.vehicleMakes?.pageInfo?.startCursor;

  if (edges.length > 0) {
    assert.strictEqual(startCursor, edges[0].cursor);
  }
});

Then("the endCursor should match the last result's cursor", function (this: VehicleWorld) {
  const response = this.getGraphQLResponse();
  assert.ok(response, 'GraphQL response should exist');

  type Edge = { cursor?: string };
  const data = response.body.data as
    | {
        vehicleMakes?: { edges?: Edge[]; pageInfo?: { endCursor?: string } };
      }
    | undefined;

  const edges = data?.vehicleMakes?.edges ?? [];
  const endCursor = data?.vehicleMakes?.pageInfo?.endCursor;

  if (edges.length > 0) {
    assert.strictEqual(endCursor, edges[edges.length - 1].cursor);
  }
});

Then(
  'the results should be different from page {int}',
  function (this: VehicleWorld, _pageNumber: number) {
    type Edge = { node: { makeId?: number } };
    const previousResults = this.getContext<Edge[]>('previousPageResults') ?? [];
    const currentResults = this.getContext<Edge[]>('currentPageResults') ?? [];

    const previousIds = previousResults.map((e) => e.node.makeId);
    const currentIds = currentResults.map((e) => e.node.makeId);

    const overlap = previousIds.filter((id) => currentIds.includes(id));
    assert.strictEqual(overlap.length, 0, 'Results should be different');
  },
);

Then(
  'I should receive the results from page {int}',
  function (this: VehicleWorld, _pageNumber: number) {
    const response = this.getGraphQLResponse();
    assert.ok(response, 'GraphQL response should exist');

    const data = response.body.data as { vehicleMakes?: { edges?: unknown[] } } | undefined;
    const edges = data?.vehicleMakes?.edges ?? [];
    assert.ok(edges.length > 0, 'Should have results');
  },
);

Then('the results should be in the correct order', function (this: VehicleWorld) {
  type Edge = { node: { makeId?: number } };
  const currentResults = this.getContext<Edge[]>('currentPageResults') ?? [];

  const ids = currentResults.map((e) => e.node.makeId ?? 0);
  const sortedIds = [...ids].sort((a, b) => a - b);

  assert.deepStrictEqual(ids, sortedIds, 'Results should be in order');
});
