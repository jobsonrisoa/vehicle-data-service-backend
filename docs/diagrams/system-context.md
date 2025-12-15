# System Context Diagram

```mermaid
C4Context
    title System Context Diagram - Vehicle Data Aggregation Service

    Person(user, "API Consumer", "Developer or application consuming vehicle data")

    System_Boundary(system, "Vehicle Data Service") {
        System(vehicleService, "Vehicle Data Service", "Aggregates vehicle make and type data from NHTSA API")
    }

    System_Ext(nhtsa, "NHTSA Vehicle API", "National Highway Traffic Safety Administration public API")
    System_Ext(monitoring, "Monitoring System", "Prometheus/Grafana for metrics and alerts")

    Rel(user, vehicleService, "Queries vehicle data", "GraphQL/HTTPS")
    Rel(vehicleService, nhtsa, "Fetches vehicle data", "HTTP/XML")
    Rel(vehicleService, monitoring, "Exports metrics", "Prometheus")
```

## Description

This diagram shows the system context for the Vehicle Data Aggregation Service:

- **API Consumer**: External clients (web applications, mobile apps, other services) that query vehicle data through the GraphQL API
- **Vehicle Data Service**: The main system that aggregates, transforms, and serves vehicle data
- **NHTSA Vehicle API**: External government API providing vehicle make and type information
- **Monitoring System**: Optional observability stack for metrics and alerting
