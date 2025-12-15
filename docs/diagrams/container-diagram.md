# Container Diagram

```mermaid
C4Container
    title Container Diagram - Vehicle Data Aggregation Service

    Person(user, "API Consumer", "Developer or application")

    System_Boundary(gateway, "API Gateway") {
        Container(kong, "Kong Gateway", "Kong 3.x", "API Gateway for routing, rate limiting, and security")
    }

    System_Boundary(application, "Application") {
        Container(graphql, "GraphQL API", "NestJS + Apollo", "Handles GraphQL queries and mutations")
        Container(rest, "REST API", "NestJS", "Health checks and ingestion triggers")
        Container(worker, "Event Worker", "NestJS", "Processes RabbitMQ events")
    }

    System_Boundary(data, "Data Layer") {
        ContainerDb(postgres, "PostgreSQL", "PostgreSQL 15", "Stores vehicle makes, types, and ingestion jobs")
        ContainerQueue(rabbitmq, "RabbitMQ", "RabbitMQ 3.12", "Message broker for event-driven processing")
        ContainerDb(redis, "Redis", "Redis 7", "Optional caching layer")
    }

    System_Ext(nhtsa, "NHTSA API", "External vehicle data API")

    Rel(user, kong, "HTTPS", "GraphQL/REST")
    Rel(kong, graphql, "HTTP", "Route /graphql")
    Rel(kong, rest, "HTTP", "Route /api/v1, /health")

    Rel(graphql, postgres, "TCP/5432", "TypeORM")
    Rel(rest, rabbitmq, "AMQP", "Publish events")
    Rel(worker, rabbitmq, "AMQP", "Consume events")
    Rel(worker, postgres, "TCP/5432", "Persist data")
    Rel(worker, nhtsa, "HTTPS", "Fetch XML data")
    Rel(graphql, redis, "TCP/6379", "Cache queries")
```

## Container Descriptions

| Container    | Technology      | Purpose                                           |
| ------------ | --------------- | ------------------------------------------------- |
| Kong Gateway | Kong 3.x        | API gateway handling routing, rate limiting, CORS |
| GraphQL API  | NestJS + Apollo | Serves vehicle data through GraphQL queries       |
| REST API     | NestJS          | Health endpoints and ingestion management         |
| Event Worker | NestJS          | Processes ingestion events asynchronously         |
| PostgreSQL   | PostgreSQL 15   | Primary data store                                |
| RabbitMQ     | RabbitMQ 3.12   | Event bus for async processing                    |
| Redis        | Redis 7         | Optional query caching                            |
