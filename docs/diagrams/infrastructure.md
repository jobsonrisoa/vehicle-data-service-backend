# Infrastructure Diagrams

## 1. Deployment Architecture

```mermaid
flowchart TB
    subgraph Internet
        Client[Client Applications]
    end

    subgraph Docker["Docker Environment"]
        subgraph Gateway["API Gateway Layer"]
            Kong[Kong Gateway<br/>:8000, :8001]
        end

        subgraph App["Application Layer"]
            App1[Vehicle Service<br/>Instance 1<br/>:3000]
            App2[Vehicle Service<br/>Instance 2<br/>:3000]
            AppN[Vehicle Service<br/>Instance N<br/>:3000]
        end

        subgraph Data["Data Layer"]
            PG[(PostgreSQL<br/>:5432)]
            RMQ[RabbitMQ<br/>:5672, :15672]
            Redis[(Redis<br/>:6379)]
        end
    end

    Client -->|HTTPS| Kong
    Kong -->|HTTP| App1
    Kong -->|HTTP| App2
    Kong -->|HTTP| AppN

    App1 --> PG
    App1 --> RMQ
    App1 --> Redis
    App2 --> PG
    App2 --> RMQ
    App2 --> Redis
    AppN --> PG
    AppN --> RMQ
    AppN --> Redis

    style Kong fill:#4caf50,color:white
    style App1 fill:#2196f3,color:white
    style App2 fill:#2196f3,color:white
    style AppN fill:#2196f3,color:white
    style PG fill:#ff9800,color:white
    style RMQ fill:#ff5722,color:white
    style Redis fill:#f44336,color:white
```

## 2. Docker Compose Stack

```mermaid
flowchart LR
    subgraph compose["docker-compose.yml"]
        subgraph services["Services"]
            app[app<br/>Vehicle Service]
            kong[kong<br/>API Gateway]
            postgres[postgres<br/>Database]
            rabbitmq[rabbitmq<br/>Message Broker]
            redis[redis<br/>Cache]
        end

        subgraph volumes["Volumes"]
            pgdata[(postgres_data)]
            rmqdata[(rabbitmq_data)]
        end

        subgraph networks["Networks"]
            internal[vehicle-network<br/>bridge]
        end
    end

    app --> postgres
    app --> rabbitmq
    app --> redis
    kong --> app

    postgres --> pgdata
    rabbitmq --> rmqdata

    app -.- internal
    kong -.- internal
    postgres -.- internal
    rabbitmq -.- internal
    redis -.- internal
```

## 3. RabbitMQ Topology

```mermaid
flowchart TB
    subgraph Producers
        IS[Ingestion Service]
    end

    subgraph Exchange["Exchanges"]
        VE[vehicle.events<br/>type: topic]
        DLX[vehicle.dlx<br/>type: direct]
    end

    subgraph Queues["Queues"]
        Q1[vehicle.ingestion.process<br/>binding: ingestion.*]
        Q2[vehicle.make.events<br/>binding: make.*]
        Q3[vehicle.audit.log<br/>binding: #]
        DLQ[vehicle.dlq<br/>Dead Letter Queue]
    end

    subgraph Consumers
        IW[Ingestion Worker]
        MW[Make Event Handler]
        AL[Audit Logger]
        Admin[Admin/Manual Review]
    end

    IS -->|publish| VE
    VE -->|route| Q1
    VE -->|route| Q2
    VE -->|route| Q3

    Q1 -->|consume| IW
    Q2 -->|consume| MW
    Q3 -->|consume| AL

    Q1 -.->|on failure| DLX
    Q2 -.->|on failure| DLX
    DLX -->|route| DLQ
    DLQ -->|review| Admin

    style VE fill:#e3f2fd
    style DLX fill:#ffebee
    style DLQ fill:#ffebee
```

## 4. Database Schema ERD

```mermaid
erDiagram
    VEHICLE_MAKES {
        uuid id PK
        int make_id UK
        varchar make_name
        timestamp created_at
        timestamp updated_at
    }

    VEHICLE_TYPES {
        uuid id PK
        int type_id
        varchar type_name
        uuid vehicle_make_id FK
        timestamp created_at
    }

    INGESTION_JOBS {
        uuid id PK
        varchar status
        timestamp started_at
        timestamp completed_at
        int total_makes
        int processed_makes
        int failed_makes
        jsonb errors
        timestamp created_at
    }

    VEHICLE_MAKES ||--o{ VEHICLE_TYPES : "has many"
```

## 5. CI/CD Pipeline

```mermaid
flowchart LR
    subgraph Trigger["Trigger"]
        Push[Push to Branch]
        PR[Pull Request]
    end

    subgraph CI["CI Pipeline"]
        Lint[Lint<br/>ESLint + Prettier]
        UnitTest[Unit Tests<br/>Jest]
        IntTest[Integration Tests<br/>Testcontainers]
        E2ETest[E2E Tests<br/>Supertest]
        BDDTest[BDD Tests<br/>Cucumber]
        Build[Build<br/>TypeScript]
        Docker[Docker Build]
    end

    subgraph CD["CD Pipeline"]
        DevDeploy[Deploy to Dev]
        StageDeploy[Deploy to Stage]
        ProdDeploy[Deploy to Prod]
    end

    Push --> Lint
    PR --> Lint
    Lint --> UnitTest
    UnitTest --> IntTest
    IntTest --> E2ETest
    E2ETest --> BDDTest
    BDDTest --> Build
    Build --> Docker

    Docker -->|develop branch| DevDeploy
    Docker -->|staging branch| StageDeploy
    Docker -->|main branch| ProdDeploy

    style Lint fill:#fff3e0
    style UnitTest fill:#e8f5e9
    style IntTest fill:#e8f5e9
    style E2ETest fill:#e8f5e9
    style BDDTest fill:#e8f5e9
    style Build fill:#e3f2fd
    style Docker fill:#f3e5f5
```

## 6. Environment Configuration Flow

```mermaid
flowchart TB
    subgraph Sources["Configuration Sources"]
        EnvFile[.env file]
        EnvVars[Environment Variables]
        Defaults[Default Values]
    end

    subgraph Validation["Validation Layer"]
        Zod[Zod Schema<br/>Validation]
    end

    subgraph Config["Configuration Service"]
        ConfigModule[NestJS ConfigModule]
        ConfigService[ConfigService]
    end

    subgraph Consumers["Configuration Consumers"]
        DB[Database Config]
        RMQ[RabbitMQ Config]
        API[API Config]
        Log[Logging Config]
    end

    EnvFile --> ConfigModule
    EnvVars --> ConfigModule
    Defaults --> ConfigModule
    ConfigModule --> Zod
    Zod -->|valid| ConfigService
    Zod -->|invalid| Error[Startup Error]

    ConfigService --> DB
    ConfigService --> RMQ
    ConfigService --> API
    ConfigService --> Log

    style Zod fill:#e8f5e9
    style Error fill:#ffebee
```

## 7. Kong Gateway Routes

```mermaid
flowchart LR
    subgraph External["External Traffic"]
        Client[Client]
    end

    subgraph Kong["Kong Gateway :8000"]
        subgraph Routes["Routes"]
            R1[/graphql]
            R2[/api/v1/*]
            R3[/health/*]
        end

        subgraph Plugins["Global Plugins"]
            RL[rate-limiting]
            CORS[cors]
            Log[file-log]
            Prom[prometheus]
        end
    end

    subgraph Upstream["Vehicle Service :3000"]
        GQL[GraphQL Endpoint]
        REST[REST Endpoints]
        Health[Health Endpoints]
    end

    Client --> R1
    Client --> R2
    Client --> R3

    R1 --> RL
    R2 --> RL
    R3 --> RL
    RL --> CORS
    CORS --> Log
    Log --> Prom

    R1 --> GQL
    R2 --> REST
    R3 --> Health

    style Kong fill:#4caf50,color:white
```

## 8. Monitoring Stack (Optional)

```mermaid
flowchart TB
    subgraph Application["Application"]
        App[Vehicle Service]
        Kong[Kong Gateway]
    end

    subgraph Monitoring["Monitoring Stack"]
        Prom[Prometheus<br/>Metrics Collection]
        Graf[Grafana<br/>Visualization]
        Alert[Alertmanager<br/>Alerting]
    end

    subgraph Logging["Logging Stack"]
        Pino[Pino Logger]
        Loki[Loki<br/>Log Aggregation]
    end

    App -->|/metrics| Prom
    Kong -->|/metrics| Prom
    Prom --> Graf
    Prom --> Alert

    App -->|JSON logs| Pino
    Pino --> Loki
    Loki --> Graf

    style Prom fill:#e65100,color:white
    style Graf fill:#f9a825
    style Loki fill:#2196f3,color:white
```
