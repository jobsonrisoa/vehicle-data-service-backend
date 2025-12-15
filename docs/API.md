# API Documentation

## Vehicle Data Aggregation Service

**Version:** 1.0.0
**Base URL (Gateway):** `http://localhost:8000`
**Direct Service (Local Dev):** `http://localhost:3000`

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [GraphQL API](#3-graphql-api)
4. [REST API](#4-rest-api)
5. [Error Handling](#5-error-handling)
6. [Rate Limiting](#6-rate-limiting)
7. [Data Models](#7-data-models)
8. [Example Queries](#8-example-queries)

---

## 1. Overview

This service provides vehicle make and type data aggregated from the NHTSA (National Highway Traffic Safety Administration) public API. The data is transformed, stored, and exposed through a GraphQL API.

### API Endpoints

| Endpoint            | Protocol | Description                         |
| ------------------- | -------- | ----------------------------------- |
| `/graphql`          | GraphQL  | Data queries and ingestion mutation |
| `/api/v1/ingestion` | REST     | Data ingestion management           |
| `/health`           | REST     | Health check endpoints              |

### Content Types

- **GraphQL:** `application/json`
- **REST:** `application/json`

---

## 2. Authentication

Authentication is optional by default and can be enforced at the gateway.

### JWT (when enabled)

```http
Authorization: Bearer <token>
```

### API Key (when enabled)

```http
X-API-Key: <api-key>
```

---

## 3. GraphQL API

### Endpoint

```
POST /graphql
```

### Headers

```http
Content-Type: application/json
```

### Schema

```graphql
type Query {
  """
  Retrieve all vehicle makes with their associated vehicle types.
  Supports cursor-based pagination.
  """
  vehicleMakes(
    """
    Number of items to return (max: 100)
    """
    first: Int
    """
    Cursor for pagination
    """
    after: String
    """
    Filter criteria
    """
    filter: VehicleMakeFilter
  ): VehicleMakeConnection!

  """
  Retrieve a specific vehicle make by its NHTSA Make ID
  """
  vehicleMake(makeId: Int!): VehicleMake

  """
  Get the status of the current or last ingestion job
  """
  ingestionStatus: IngestionJob

  """
  Get ingestion job by ID
  """
  ingestionJob(id: ID!): IngestionJob
}

type Mutation {
  """
  Trigger a new data ingestion from NHTSA API.
  Returns the created ingestion job.
  """
  triggerIngestion: IngestionJob!
}

type Subscription {
  """
  Subscribe to ingestion job status updates
  """
  ingestionProgress(jobId: ID!): IngestionJob!
}
```

### Types

```graphql
"""
Represents a vehicle manufacturer/make
"""
type VehicleMake {
  """
  Internal unique identifier (UUID)
  """
  id: ID!
  """
  NHTSA Make ID
  """
  makeId: Int!
  """
  Name of the vehicle make
  """
  makeName: String!
  """
  List of vehicle types produced by this make
  """
  vehicleTypes: [VehicleType!]!
  """
  Timestamp when record was created
  """
  createdAt: DateTime!
  """
  Timestamp when record was last updated
  """
  updatedAt: DateTime!
}

"""
Represents a type/category of vehicle
"""
type VehicleType {
  """
  Internal unique identifier (UUID)
  """
  id: ID!
  """
  NHTSA Type ID
  """
  typeId: Int!
  """
  Name of the vehicle type
  """
  typeName: String!
}

"""
Represents a data ingestion job
"""
type IngestionJob {
  """
  Unique job identifier
  """
  id: ID!
  """
  Current status of the job
  """
  status: IngestionStatus!
  """
  When the job started
  """
  startedAt: DateTime!
  """
  When the job completed (null if still running)
  """
  completedAt: DateTime
  """
  Total number of makes to process
  """
  totalMakes: Int!
  """
  Number of makes successfully processed
  """
  processedMakes: Int!
  """
  Number of makes that failed processing
  """
  failedMakes: Int!
  """
  List of errors encountered
  """
  errors: [IngestionError!]!
}

"""
Error encountered during ingestion
"""
type IngestionError {
  """
  Make ID that failed
  """
  makeId: Int!
  """
  Error message
  """
  message: String!
  """
  When the error occurred
  """
  timestamp: DateTime!
  """
  Number of retry attempts made
  """
  retryCount: Int!
}

"""
Connection type for paginated vehicle makes
"""
type VehicleMakeConnection {
  """
  List of edges containing nodes
  """
  edges: [VehicleMakeEdge!]!
  """
  Pagination information
  """
  pageInfo: PageInfo!
  """
  Total count of items
  """
  totalCount: Int!
}

"""
Edge type for vehicle make pagination
"""
type VehicleMakeEdge {
  """
  Pagination cursor
  """
  cursor: String!
  """
  The vehicle make node
  """
  node: VehicleMake!
}

"""
Pagination information
"""
type PageInfo {
  """
  Whether there are more items after
  """
  hasNextPage: Boolean!
  """
  Whether there are items before
  """
  hasPreviousPage: Boolean!
  """
  Cursor of first item
  """
  startCursor: String
  """
  Cursor of last item
  """
  endCursor: String
}

"""
Filter input for vehicle makes
"""
input VehicleMakeFilter {
  """
  Filter by make name (partial match, case-insensitive)
  """
  makeName: String
  """
  Filter makes that have vehicle types
  """
  hasVehicleTypes: Boolean
  """
  Filter by specific vehicle type ID
  """
  vehicleTypeId: Int
}

"""
Status of an ingestion job
"""
enum IngestionStatus {
  """
  Job is queued but not started
  """
  PENDING
  """
  Job is currently running
  """
  IN_PROGRESS
  """
  Job completed successfully
  """
  COMPLETED
  """
  Job failed completely
  """
  FAILED
  """
  Job completed with some failures
  """
  PARTIALLY_COMPLETED
}

"""
ISO 8601 DateTime scalar
"""
scalar DateTime
```

---

## 4. REST API

### Summary

| Method | Path                         | Purpose                       |
| ------ | ---------------------------- | ----------------------------- |
| GET    | `/health`                    | Overall health                |
| GET    | `/health/live`               | Liveness probe                |
| GET    | `/health/ready`              | Readiness probe               |
| POST   | `/api/v1/ingestion/trigger`  | Trigger ingestion             |
| GET    | `/api/v1/ingestion/status`   | Current/last ingestion status |
| GET    | `/api/v1/ingestion/jobs/:id` | Ingestion job details         |

### Health Endpoints

#### GET /health

Returns overall service health status.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-12-11T10:30:00.000Z",
  "version": "1.0.0",
  "checks": {
    "database": "healthy",
    "rabbitmq": "healthy",
    "redis": "healthy"
  }
}
```

#### GET /health/live

Kubernetes liveness probe endpoint.

**Response:**

```json
{
  "status": "ok"
}
```

**Status Codes:**

- `200` - Service is alive
- `503` - Service is not responding

#### GET /health/ready

Kubernetes readiness probe endpoint.

**Response:**

```json
{
  "status": "ready",
  "checks": {
    "database": true,
    "rabbitmq": true
  }
}
```

**Status Codes:**

- `200` - Service is ready to accept traffic
- `503` - Service is not ready

---

### Ingestion Endpoints

#### POST /api/v1/ingestion/trigger

Triggers a new data ingestion job.

**Request:**

```http
POST /api/v1/ingestion/trigger
Content-Type: application/json
```

**Response:**

```json
{
  "success": true,
  "data": {
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "PENDING",
    "startedAt": "2025-12-11T10:30:00.000Z",
    "message": "Ingestion job has been queued"
  }
}
```

**Status Codes:**

- `202` - Job accepted and queued
- `409` - Another ingestion job is already running
- `500` - Internal server error

**Error (409 Conflict):**

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Ingestion already in progress",
    "requestId": "req-abc",
    "timestamp": "2025-12-11T10:32:00.000Z"
  }
}
```

---

#### GET /api/v1/ingestion/status

Get the status of the current or most recent ingestion job.

**Response:**

```json
{
  "success": true,
  "data": {
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "IN_PROGRESS",
    "startedAt": "2025-12-11T10:30:00.000Z",
    "completedAt": null,
    "progress": {
      "totalMakes": 10000,
      "processedMakes": 5432,
      "failedMakes": 12,
      "percentComplete": 54.32
    }
  }
}
```

---

#### GET /api/v1/ingestion/jobs/:jobId

Get details of a specific ingestion job.

**Parameters:**

- `jobId` (path) - UUID of the ingestion job

**Response:**

```json
{
  "success": true,
  "data": {
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "COMPLETED",
    "startedAt": "2025-12-11T10:30:00.000Z",
    "completedAt": "2025-12-11T11:45:00.000Z",
    "totalMakes": 10000,
    "processedMakes": 9988,
    "failedMakes": 12,
    "errors": [
      {
        "makeId": 500,
        "message": "Request timeout after 30000ms",
        "timestamp": "2025-12-11T10:45:00.000Z",
        "retryCount": 3
      }
    ]
  }
}
```

**Status Codes:**

- `200` - Job found
- `404` - Job not found

**Error (404 Not Found):**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Ingestion job not found",
    "requestId": "req-def",
    "timestamp": "2025-12-11T10:35:00.000Z"
  }
}
```

---

## 5. Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {},
    "timestamp": "2025-12-11T10:30:00.000Z",
    "requestId": "req-123-456-789"
  }
}
```

### GraphQL Errors

```json
{
  "data": null,
  "errors": [
    {
      "message": "Vehicle make not found",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["vehicleMake"],
      "extensions": {
        "code": "NOT_FOUND",
        "makeId": 99999
      }
    }
  ]
}
```

### Error Codes

| Code                   | HTTP Status | Description                                   |
| ---------------------- | ----------- | --------------------------------------------- |
| `VALIDATION_ERROR`     | 400         | Invalid input parameters                      |
| `NOT_FOUND`            | 404         | Resource not found                            |
| `CONFLICT`             | 409         | Resource conflict (e.g., job already running) |
| `RATE_LIMITED`         | 429         | Too many requests                             |
| `INTERNAL_ERROR`       | 500         | Internal server error                         |
| `SERVICE_UNAVAILABLE`  | 503         | Dependent service unavailable                 |
| `EXTERNAL_API_ERROR`   | 502         | Error from NHTSA API                          |
| `TRANSFORMATION_ERROR` | 500         | Data transformation failed                    |
| `DATABASE_ERROR`       | 500         | Database operation failed                     |

### Error Handling Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING FLOW                           │
└─────────────────────────────────────────────────────────────────┘

  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │  External   │     │   Domain    │     │   Infra     │
  │   Request   │     │   Error     │     │   Error     │
  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
         │                   │                   │
         ▼                   ▼                   ▼
  ┌─────────────────────────────────────────────────────┐
  │              Global Exception Filter                 │
  │  ┌─────────────────────────────────────────────┐    │
  │  │  • Catches all exceptions                   │    │
  │  │  • Maps to appropriate HTTP status          │    │
  │  │  • Formats error response                   │    │
  │  │  • Logs error with context                  │    │
  │  │  • Adds request ID for tracing              │    │
  │  └─────────────────────────────────────────────┘    │
  └───────────────────────┬─────────────────────────────┘
                          │
                          ▼
  ┌─────────────────────────────────────────────────────┐
  │                 Error Response                       │
  │  {                                                   │
  │    "success": false,                                │
  │    "error": {                                       │
  │      "code": "...",                                 │
  │      "message": "...",                              │
  │      "requestId": "..."                             │
  │    }                                                │
  │  }                                                  │
  └─────────────────────────────────────────────────────┘
```

---

## 6. Rate Limiting

Rate limiting is enforced by Kong Gateway.

### Default Limits

| Endpoint    | Limit        | Window     |
| ----------- | ------------ | ---------- |
| `/graphql`  | 100 requests | per minute |
| `/api/v1/*` | 60 requests  | per minute |
| `/health/*` | 300 requests | per minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1702296600
```

### Rate Limited Response

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30

{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Please retry after 30 seconds.",
    "retryAfter": 30
  }
}
```

---

## 7. Data Models

### Vehicle Make

```typescript
interface VehicleMake {
  id: string; // UUID
  makeId: number; // NHTSA Make ID (e.g., 440)
  makeName: string; // Make name (e.g., "ASTON MARTIN")
  vehicleTypes: VehicleType[];
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}
```

### Vehicle Type

```typescript
interface VehicleType {
  id: string; // UUID
  typeId: number; // NHTSA Type ID (e.g., 2)
  typeName: string; // Type name (e.g., "Passenger Car")
}
```

### Ingestion Job

```typescript
interface IngestionJob {
  id: string; // UUID
  status: IngestionStatus;
  startedAt: string; // ISO 8601 timestamp
  completedAt: string | null; // ISO 8601 timestamp
  totalMakes: number;
  processedMakes: number;
  failedMakes: number;
  errors: IngestionError[];
}

type IngestionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'PARTIALLY_COMPLETED';

interface IngestionError {
  makeId: number;
  message: string;
  timestamp: string;
  retryCount: number;
}
```

### Expected Output Format

The transformed data matches this structure:

```json
[
  {
    "makeId": 440,
    "makeName": "ASTON MARTIN",
    "vehicleTypes": [
      {
        "typeId": 2,
        "typeName": "Passenger Car"
      },
      {
        "typeId": 7,
        "typeName": "Multipurpose Passenger Vehicle (MPV)"
      }
    ]
  }
]
```

---

## 8. Example Queries

### GraphQL Examples

#### Get All Vehicle Makes (Paginated)

```graphql
query GetAllMakes {
  vehicleMakes(first: 10) {
    edges {
      cursor
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
      endCursor
    }
    totalCount
  }
}
```

**cURL:**

```bash
curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { vehicleMakes(first: 10) { edges { node { makeId makeName vehicleTypes { typeId typeName } } } pageInfo { hasNextPage endCursor } totalCount } }"
  }'
```

---

#### Get Next Page

```graphql
query GetNextPage {
  vehicleMakes(first: 10, after: "Y3Vyc29yOjEw") {
    edges {
      cursor
      node {
        makeId
        makeName
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

---

#### Get Single Vehicle Make

```graphql
query GetMake {
  vehicleMake(makeId: 440) {
    id
    makeId
    makeName
    vehicleTypes {
      typeId
      typeName
    }
    createdAt
    updatedAt
  }
}
```

**cURL:**

```bash
curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { vehicleMake(makeId: 440) { makeId makeName vehicleTypes { typeId typeName } } }"
  }'
```

---

#### Filter Vehicle Makes

```graphql
query FilterMakes {
  vehicleMakes(first: 20, filter: { makeName: "ford", hasVehicleTypes: true }) {
    edges {
      node {
        makeId
        makeName
        vehicleTypes {
          typeName
        }
      }
    }
    totalCount
  }
}
```

---

#### Trigger Ingestion

```graphql
mutation TriggerIngestion {
  triggerIngestion {
    id
    status
    startedAt
    totalMakes
  }
}
```

**cURL:**

```bash
curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { triggerIngestion { id status startedAt } }"
  }'
```

---

#### Get Ingestion Status

```graphql
query IngestionStatus {
  ingestionStatus {
    id
    status
    startedAt
    completedAt
    totalMakes
    processedMakes
    failedMakes
    errors {
      makeId
      message
      timestamp
    }
  }
}
```

#### Get Ingestion Job by ID

```graphql
query IngestionJobById {
  ingestionJob(id: "550e8400-e29b-41d4-a716-446655440000") {
    id
    status
    startedAt
    completedAt
    totalMakes
    processedMakes
    failedMakes
    errors {
      makeId
      message
      retryCount
    }
  }
}
```

---

### REST Examples

#### Health Check

```bash
curl http://localhost:8000/health
```

#### Trigger Ingestion (REST)

```bash
curl -X POST http://localhost:8000/api/v1/ingestion/trigger \
  -H "Content-Type: application/json"
```

#### Get Ingestion Status (REST)

```bash
curl http://localhost:8000/api/v1/ingestion/status
```

#### Get Ingestion Job (REST)

```bash
curl http://localhost:8000/api/v1/ingestion/jobs/550e8400-e29b-41d4-a716-446655440000
```

---

## Appendix: Swagger/OpenAPI

The REST API documentation is also available via Swagger UI:

```
http://localhost:3000/api/docs
```

OpenAPI JSON specification:

```
http://localhost:3000/api/docs-json
```

Validate the OpenAPI document:

```bash
curl -s http://localhost:3000/api/docs-json | npx swagger-cli validate -
```

---

## Appendix: GraphQL Playground

Interactive GraphQL playground is available at:

```
http://localhost:3000/graphql
```

Features:

- Schema documentation
- Query autocompletion
- Query history
- Variable support
