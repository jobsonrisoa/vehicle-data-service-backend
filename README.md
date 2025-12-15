# Vehicle Data Aggregation Service

Production-ready NestJS service that ingests vehicle data from the NHTSA API, transforms XML to a normalized JSON model, persists it to PostgreSQL, and exposes both GraphQL and REST APIs. The service follows hexagonal architecture with strong boundaries between domain, application, and infrastructure layers.

## Table of Contents

- Features
- Architecture
- Prerequisites
- Quick Start
- Environment Variables
- API Examples
- Development
- Testing
- Deployment
- Troubleshooting
- Additional Documentation
- License

## Features

- Hexagonal architecture and domain-driven design with clear ports and adapters.
- Dual interfaces: GraphQL (cursor pagination, DataLoader) and REST (OpenAPI/Swagger).
- Event-driven ingestion pipeline backed by RabbitMQ.
- Resilient NHTSA client with retries, backoff, and circuit breaker.
- Observability: structured logging, health/readiness probes, optional Prometheus metrics.
- Container-first setup with Docker Compose and Kong Gateway integration.

## Architecture

```
┌───────────────────────────────────────────────┐
│                   Kong Gateway                │
└───────────────┬─────────────────────┬─────────┘
                │                     │
        ┌───────▼───────┐     ┌───────▼───────┐
        │   GraphQL     │     │     REST      │
        │   Adapter     │     │   Adapter     │
        └───────┬───────┘     └───────┬───────┘
                │                     │
        ┌───────▼─────────────────────▼───────┐
        │         Application Core            │
        │   Use cases, ports, domain rules    │
        └───────┬─────────────────────┬───────┘
                │                     │
        ┌───────▼───────┐     ┌───────▼───────┐
        │  PostgreSQL   │     │    RabbitMQ   │
        │ (Persistence) │     │ (Events)      │
        └───────┬───────┘     └───────┬───────┘
                │                     │
        ┌───────▼─────────────────────▼───────┐
        │        NHTSA API Client             │
        │  XML parsing, retries, backoff      │
        └─────────────────────────────────────┘
```

## Prerequisites

- Node.js 20.x
- npm 10.x
- Docker 24.x and Docker Compose 2.x (recommended)
- PostgreSQL 15+
- RabbitMQ 3.12+

## Quick Start

```bash
git clone https://github.com/jobsonrisoa/vehicle-data-service-backend.git
cd vehicle-data-service-backend

npm install
cp .env.example .env   # fill in required values

# Start dependencies (local)
docker-compose -f docker/docker-compose.yml up -d postgres rabbitmq

# Run migrations
npm run migration:run

# Start the service
npm run start:dev
```

Verify:

- GraphQL Playground: http://localhost:3000/graphql
- REST Docs (Swagger): http://localhost:3000/api/docs
- Health: http://localhost:3000/health

## Environment Variables

Populate `.env` (see `.env.example` for the full list).

| Variable                   | Description                                               | Required |
| -------------------------- | --------------------------------------------------------- | -------- |
| `NODE_ENV`                 | Environment (`development`/`test`/`staging`/`production`) | Yes      |
| `PORT`                     | HTTP port (default 3000)                                  | No       |
| `DATABASE_URL`             | PostgreSQL connection string                              | Yes      |
| `DATABASE_POOL_SIZE`       | DB pool size (default 10)                                 | No       |
| `RABBITMQ_URL`             | RabbitMQ connection string                                | Yes      |
| `RABBITMQ_QUEUE_PREFIX`    | Queue prefix (default `vehicle`)                          | No       |
| `NHTSA_API_BASE_URL`       | NHTSA API base URL                                        | No       |
| `NHTSA_API_TIMEOUT`        | HTTP timeout in ms (default 30000)                        | No       |
| `NHTSA_API_RETRY_ATTEMPTS` | Retry attempts (default 3)                                | No       |
| `INGESTION_BATCH_SIZE`     | Batch size for ingestion (default 100)                    | No       |
| `INGESTION_CONCURRENCY`    | Concurrent NHTSA calls (default 5)                        | No       |

## API Examples

### GraphQL (POST /graphql)

```graphql
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
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}
```

```graphql
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
```

```graphql
mutation {
  triggerIngestion {
    jobId
    status
    startedAt
  }
}
```

### REST (default base: http://localhost:3000/api/v1)

Trigger ingestion:

```bash
curl -X POST http://localhost:3000/api/v1/ingestion/trigger \
  -H "Content-Type: application/json"
```

Check ingestion status:

```bash
curl http://localhost:3000/api/v1/ingestion/status
```

Health:

```bash
curl http://localhost:3000/health/ready
curl http://localhost:3000/health/live
```

## Development

```bash
npm run start:dev       # watch mode
npm run lint            # ESLint
npm run format          # Prettier
npm run migration:run   # apply migrations
npm run migration:revert
```

## Testing

```bash
npm run test            # unit
npm run test:integration
npm run test:e2e
npm run test:bdd
npm run test:cov        # coverage
```

## Deployment

- Production build: `npm run build` then `npm run start:prod`
- Docker: `docker build -f docker/Dockerfile -t vehicle-data-service .`
- Compose (local/stage): `docker-compose -f docker/docker-compose.yml up -d`
- Kubernetes: apply manifests under `k8s/` when available.

## Troubleshooting

- Database connection errors: confirm `DATABASE_URL`, ensure PostgreSQL is running (`docker-compose ps postgres`), run `psql $DATABASE_URL -c "SELECT 1"`.
- RabbitMQ issues: check management UI at http://localhost:15672 (guest/guest), list queues `docker-compose exec rabbitmq rabbitmqctl list_queues`.
- NHTSA timeouts: increase `NHTSA_API_TIMEOUT`, verify external API availability, adjust retry settings.
- High memory usage: lower `DATABASE_POOL_SIZE`, reduce `INGESTION_BATCH_SIZE`, review ingestion concurrency.
- Tests failing in CI: increase timeouts, ensure Docker resources for Testcontainers, align `.env` with CI settings.

## License

MIT
