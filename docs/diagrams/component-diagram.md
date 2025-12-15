# Component Diagram

```mermaid
C4Component
    title Component Diagram - Vehicle Data Service (Hexagonal Architecture)

    Container_Boundary(primary, "Primary Adapters (Driving)") {
        Component(graphqlResolver, "GraphQL Resolvers", "Apollo Resolver", "Handles GraphQL queries")
        Component(restController, "REST Controllers", "NestJS Controller", "Health & ingestion endpoints")
        Component(eventConsumer, "Event Consumers", "RabbitMQ Consumer", "Processes domain events")
    }

    Container_Boundary(core, "Application Core") {
        Component(inputPorts, "Input Ports", "TypeScript Interface", "IQueryVehicles, IIngestData")
        Component(useCases, "Use Cases", "Application Service", "Business logic orchestration")
        Component(domain, "Domain", "Entities & VO", "VehicleMake, IngestionJob")
        Component(outputPorts, "Output Ports", "TypeScript Interface", "IRepository, IEventPublisher")
    }

    Container_Boundary(secondary, "Secondary Adapters (Driven)") {
        Component(pgRepo, "PostgreSQL Repository", "TypeORM", "Data persistence")
        Component(nhtsaClient, "NHTSA Client", "Axios", "External API calls")
        Component(rmqPublisher, "RabbitMQ Publisher", "amqplib", "Event publishing")
    }

    ContainerDb(postgres, "PostgreSQL", "Database")
    ContainerQueue(rabbitmq, "RabbitMQ", "Message Broker")
    System_Ext(nhtsa, "NHTSA API", "External")

    Rel(graphqlResolver, inputPorts, "Implements")
    Rel(restController, inputPorts, "Implements")
    Rel(eventConsumer, inputPorts, "Implements")

    Rel(inputPorts, useCases, "Calls")
    Rel(useCases, domain, "Uses")
    Rel(useCases, outputPorts, "Calls")

    Rel(pgRepo, outputPorts, "Implements")
    Rel(nhtsaClient, outputPorts, "Implements")
    Rel(rmqPublisher, outputPorts, "Implements")

    Rel(pgRepo, postgres, "SQL")
    Rel(nhtsaClient, nhtsa, "HTTP/XML")
    Rel(rmqPublisher, rabbitmq, "AMQP")
    Rel(eventConsumer, rabbitmq, "AMQP")
```

## Hexagonal Architecture Layers

### Primary Adapters (Driving)

Components that drive the application:

- **GraphQL Resolvers**: Handle incoming GraphQL queries/mutations
- **REST Controllers**: Handle HTTP requests for health and admin
- **Event Consumers**: Process events from message queue

### Application Core

The heart of the application:

- **Input Ports**: Interfaces defining how to drive the application
- **Use Cases**: Application services orchestrating business logic
- **Domain**: Entities, value objects, and domain events
- **Output Ports**: Interfaces for external dependencies

### Secondary Adapters (Driven)

Components driven by the application:

- **PostgreSQL Repository**: Persists domain entities
- **NHTSA Client**: Fetches external vehicle data
- **RabbitMQ Publisher**: Publishes domain events
