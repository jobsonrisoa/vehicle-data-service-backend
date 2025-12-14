import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource, In } from 'typeorm';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Module, Global } from '@nestjs/common';
import 'pg';

import { AppModule } from '../../../src/app.module';
import { GraphQLModule } from '../../../src/infrastructure/adapters/primary/graphql/graphql.module';
import { VehicleMakeOrmEntity } from '../../../src/infrastructure/adapters/secondary/persistence/entities/vehicle-make.orm-entity';
import { VehicleTypeOrmEntity } from '../../../src/infrastructure/adapters/secondary/persistence/entities/vehicle-type.orm-entity';
import { IQueryVehiclesPort } from '../../../src/core/application/ports/input/query-vehicles.port';
import {
  PaginatedResult,
  PaginationOptions,
} from '../../../src/core/application/dtos/pagination.dto';
import { VehicleMakeDTO } from '../../../src/core/application/dtos/vehicle-make.dto';

type VehicleTypeNode = {
  typeId: number;
  typeName: string;
};

type VehicleMakeNode = {
  id: string;
  makeId: number;
  makeName: string;
  vehicleTypes: VehicleTypeNode[];
  createdAt: Date;
  updatedAt: Date;
};

type VehicleMakesResponse = {
  vehicleMakes: {
    edges: Array<{ cursor: string; node: VehicleMakeNode }>;
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor?: string;
      endCursor?: string;
    };
    totalCount: number;
  };
};

type VehicleMakeResponse = {
  vehicleMake: VehicleMakeNode | null;
};

describe('GraphQL Vehicle Queries (E2E)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let queryPort: IQueryVehiclesPort;
  let makeRepoMock: {
    findByIds: (ids: Array<{ value?: string } | string>) => Promise<VehicleMakeOrmEntity[]>;
  };

  const seed = async () => {
    const makeRepo = dataSource.getRepository(VehicleMakeOrmEntity);
    const typeRepo = dataSource.getRepository(VehicleTypeOrmEntity);
    await typeRepo.createQueryBuilder().delete().where('1=1').execute();
    await makeRepo.createQueryBuilder().delete().where('1=1').execute();

    const makes: VehicleMakeOrmEntity[] = [];
    for (let i = 1; i <= 15; i += 1) {
      const make = makeRepo.create({
        makeId: 400 + i,
        makeName: `TEST MAKE ${i}`,
      });
      makes.push(make);
    }

    const aston = makeRepo.create({
      makeId: 440,
      makeName: 'ASTON MARTIN',
    });
    makes.push(aston);

    const savedMakes = await makeRepo.save(makes);

    const types: VehicleTypeOrmEntity[] = [];
    for (const make of savedMakes) {
      types.push(
        typeRepo.create({
          typeId: make.makeId * 10,
          typeName: 'Passenger Car',
          vehicleMakeId: make.id,
        }),
      );
    }
    await typeRepo.save(types);
  };

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('vehicle_test')
      .withUsername('test')
      .withPassword('test')
      .start();

    process.env.DATABASE_URL = container.getConnectionUri();
    process.env.RABBITMQ_URL = 'amqp://guest:guest@localhost:5672';
    process.env.NODE_ENV = 'test';

    queryPort = {
      getAll: async (
        options: PaginationOptions & { filter?: { makeName?: string; makeId?: number } },
      ): Promise<PaginatedResult<VehicleMakeDTO>> => {
        const makeRepo = dataSource.getRepository(VehicleMakeOrmEntity);
        let makes = await makeRepo.find({
          relations: ['vehicleTypes'],
          order: { makeId: 'ASC' },
        });

        const filter = (options as { filter?: { makeName?: string; makeId?: number } }).filter;
        if (filter?.makeName) {
          const filterName = filter.makeName;
          makes = makes.filter((m) => m.makeName.includes(filterName));
        }
        if (filter?.makeId) {
          const filterId = filter.makeId;
          makes = makes.filter((m) => m.makeId === filterId);
        }

        const totalCount = makes.length;
        const first = options.first ?? totalCount;
        const paginatedMakes = makes.slice(0, first);

        const edges = paginatedMakes.map((make) => ({
          cursor: make.id,
          node: {
            id: make.id,
            makeId: make.makeId,
            makeName: make.makeName,
            vehicleTypes: (make.vehicleTypes ?? []).map((t) => ({
              id: t.id,
              typeId: t.typeId,
              typeName: t.typeName,
            })),
            createdAt: make.createdAt,
            updatedAt: make.updatedAt,
          } as VehicleMakeDTO,
        }));

        return {
          edges,
          pageInfo: {
            hasNextPage: totalCount > first,
            hasPreviousPage: false,
            startCursor: edges[0]?.cursor ?? null,
            endCursor: edges[edges.length - 1]?.cursor ?? null,
          },
          totalCount,
        };
      },
      getById: async (makeId: number): Promise<VehicleMakeDTO | null> => {
        const makeRepo = dataSource.getRepository(VehicleMakeOrmEntity);
        const make = await makeRepo.findOne({
          where: { makeId },
          relations: ['vehicleTypes'],
        });
        if (!make) {
          return null;
        }
        return {
          id: make.id,
          makeId: make.makeId,
          makeName: make.makeName,
          vehicleTypes: (make.vehicleTypes ?? []).map((t) => ({
            id: t.id,
            typeId: t.typeId,
            typeName: t.typeName,
          })),
          createdAt: make.createdAt,
          updatedAt: make.updatedAt,
        };
      },
      search: async (): Promise<VehicleMakeDTO[]> => {
        await Promise.resolve();
        return [];
      },
      getStatistics: async () => {
        await Promise.resolve();
        return {
          totalMakes: 0,
          totalVehicleTypes: 0,
          lastUpdated: null,
        };
      },
    };

    makeRepoMock = {
      findByIds: async (ids: Array<{ value?: string } | string>) => {
        const repo = dataSource.getRepository(VehicleMakeOrmEntity);
        const stringIds = ids.map((id) => (typeof id === 'string' ? id : (id.value ?? '')));
        return repo.findBy({ id: In(stringIds) });
      },
    };

    @Global()
    @Module({
      providers: [
        { provide: 'IQueryVehiclesPort', useValue: queryPort },
        { provide: 'IVehicleMakeRepository', useValue: makeRepoMock },
        {
          provide: 'IIngestDataPort',
          useValue: {
            triggerIngestion: jest.fn(),
            getCurrentIngestion: jest.fn(),
            getIngestionStatus: jest.fn(),
            getIngestionHistory: jest.fn(),
          },
        },
      ],
      exports: ['IQueryVehiclesPort', 'IVehicleMakeRepository', 'IIngestDataPort'],
    })
    class GraphQLTestProvidersModule {}

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, GraphQLModule, GraphQLTestProvidersModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);
    await dataSource.synchronize(true);
    await seed();
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  it('returns paginated vehicle makes', async () => {
    const server = app.getHttpServer() as unknown as import('http').Server;
    const response = await request(server)
      .post('/graphql')
      .send({
        query: `
          query {
            vehicleMakes(first: 10) {
              edges {
                node {
                  makeId
                  makeName
                  vehicleTypes {
                    typeId
                    typeName
                  }
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
        `,
      })
      .expect(200);

    const body = response.body as { data?: VehicleMakesResponse };
    expect(body.data).toBeDefined();
    const data = body.data as VehicleMakesResponse;
    expect(data.vehicleMakes.edges).toHaveLength(10);
    expect(data.vehicleMakes.totalCount).toBeGreaterThan(10);
    expect(data.vehicleMakes.pageInfo.hasNextPage).toBe(true);
  });

  it('filters by make name', async () => {
    const server = app.getHttpServer() as unknown as import('http').Server;
    const response = await request(server)
      .post('/graphql')
      .send({
        query: `
          query {
            vehicleMakes(filter: { makeName: "ASTON" }) {
              edges {
                node {
                  makeId
                  makeName
                }
              }
            }
          }
        `,
      })
      .expect(200);

    const body = response.body as { data?: VehicleMakesResponse };
    expect(body.data).toBeDefined();
    const data = body.data as VehicleMakesResponse;
    const makes = data.vehicleMakes.edges;
    expect(makes.length).toBe(1);
    expect(makes[0].node.makeId).toBe(440);
    expect(makes[0].node.makeName).toBe('ASTON MARTIN');
  });

  it('returns single make by id', async () => {
    const server = app.getHttpServer() as unknown as import('http').Server;
    const response = await request(server)
      .post('/graphql')
      .send({
        query: `
          query {
            vehicleMake(makeId: 440) {
              makeId
              makeName
              vehicleTypes {
                typeId
                typeName
              }
            }
          }
        `,
      })
      .expect(200);

    const body = response.body as { data?: VehicleMakeResponse };
    expect(body.data).toBeDefined();
    const { vehicleMake } = body.data as VehicleMakeResponse;
    expect(vehicleMake).not.toBeNull();
    const make = vehicleMake as VehicleMakeNode;
    expect(make.makeId).toBe(440);
    expect(make.makeName).toBe('ASTON MARTIN');
    expect(make.vehicleTypes.length).toBeGreaterThan(0);
  });

  it('returns null for missing make', async () => {
    const server = app.getHttpServer() as unknown as import('http').Server;
    const response = await request(server)
      .post('/graphql')
      .send({
        query: `
          query {
            vehicleMake(makeId: 99999) {
              makeId
            }
          }
        `,
      })
      .expect(200);

    const body = response.body as { data?: VehicleMakeResponse };
    expect(body.data).toBeDefined();
    const data = body.data as VehicleMakeResponse;
    expect(data.vehicleMake).toBeNull();
  });
});
