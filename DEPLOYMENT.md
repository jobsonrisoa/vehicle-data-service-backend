# Deployment Guide

Comprehensive instructions for deploying the Vehicle Data Aggregation Service across environments with predictable, repeatable steps.

## Table of Contents

- Infrastructure Requirements
- Pre-Deployment Checklist
- Environment Setup
- Docker Deployment
- Kubernetes Deployment
- Database Migrations
- Health Checks
- Monitoring and Observability
- Rollback Procedures
- Security Hardening
- Troubleshooting
- Verification

---

## Infrastructure Requirements

| Component             | Development | Staging  | Production              |
| --------------------- | ----------- | -------- | ----------------------- |
| Application instances | 1           | 2        | 3+ (horizontal)         |
| CPU                   | 2 cores     | 4 cores  | 4 cores per instance    |
| Memory                | 2 GB        | 4 GB     | 8 GB per instance       |
| PostgreSQL            | 15+         | 15+      | 15+ (managed preferred) |
| RabbitMQ              | 3.12+       | 3.12+    | 3.12+ (cluster)         |
| Kong Gateway          | 3.4+        | 3.4+     | 3.4+ (HA)               |
| Disk space            | 20 GB       | 50 GB    | 100 GB+                 |
| Network               | Standard    | Standard | LB + TLS termination    |

Supported platforms: Docker 24+, Docker Compose 2+, Kubernetes 1.25+, Linux (Ubuntu 22.04, RHEL 8+, Amazon Linux 2), cloud providers (AWS/GCP/Azure).

---

## Pre-Deployment Checklist

- [ ] All required environment variables set and validated
- [ ] Secrets managed outside version control
- [ ] Database connectivity tested
- [ ] RabbitMQ connectivity tested
- [ ] External NHTSA API reachable from target network
- [ ] TLS certificates available for exposed endpoints
- [ ] Backups enabled for database and broker
- [ ] Monitoring and alerting destinations configured
- [ ] Security scan shows no critical issues
- [ ] CI pipeline green for target commit/tag

---

## Environment Setup

1. Clone and select revision

```bash
git clone https://github.com/your-org/vehicle-data-service.git
cd vehicle-data-service
git checkout <tag-or-branch>
```

2. Configure environment files (examples)

```bash
# Development
cat > .env.development <<'EOF'
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vehicle_dev
RABBITMQ_URL=amqp://guest:guest@localhost:5672
LOG_LEVEL=debug
EOF

# Staging
cat > .env.staging <<'EOF'
NODE_ENV=staging
PORT=3000
DATABASE_URL=postgresql://user:pass@staging-db:5432/vehicle_staging
RABBITMQ_URL=amqp://user:pass@staging-rabbitmq:5672
LOG_LEVEL=info
EOF

# Production
cat > .env.production <<'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@prod-db-primary:5432/vehicle_prod
RABBITMQ_URL=amqp://user:pass@prod-rabbitmq:5672
LOG_LEVEL=warn
NHTSA_API_TIMEOUT=30000
NHTSA_API_RETRY_ATTEMPTS=3
INGESTION_BATCH_SIZE=100
INGESTION_CONCURRENCY=5
EOF
```

3. Install dependencies locally if needed

```bash
npm install
```

---

## Docker Deployment

### Development (Compose)

```bash
docker-compose -f docker/docker-compose.yml up -d
docker-compose -f docker/docker-compose.yml logs -f app
```

### Staging (Compose with overrides)

```bash
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.staging.yml up -d
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.staging.yml up -d --scale app=2
```

### Production (Compose or Swarm small footprint)

```bash
# Compose prod
docker-compose -f docker/docker-compose.prod.yml up -d
docker-compose -f docker/docker-compose.prod.yml up -d --scale app=3

# Swarm example
docker swarm init
docker stack deploy -c docker-compose.prod.yml vehicle-stack
docker service scale vehicle-stack_app=5
```

### Build and publish image

```bash
docker build -f docker/Dockerfile -t vehicle-service:v1.0.0 --target production .
docker tag vehicle-service:v1.0.0 registry.example.com/vehicle-service:v1.0.0
docker push registry.example.com/vehicle-service:v1.0.0
```

---

## Kubernetes Deployment

Prerequisites: kubectl configured, optional Helm 3, registry access.

1. Namespace

```bash
kubectl create namespace vehicle-service
kubectl config set-context --current --namespace=vehicle-service
```

2. Secrets (example)

```bash
kubectl create secret generic postgres-credentials \
  --from-literal=DATABASE_URL=postgresql://user:pass@prod-db:5432/vehicle_prod

kubectl create secret generic rabbitmq-credentials \
  --from-literal=RABBITMQ_URL=amqp://user:pass@prod-rabbitmq:5672

kubectl create secret tls vehicle-service-tls \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key
```

3. Deploy core services (example manifests under k8s/)

```bash
kubectl apply -f k8s/postgres/
kubectl apply -f k8s/rabbitmq/
kubectl apply -f k8s/kong/
```

4. Deploy application

```bash
kubectl apply -f k8s/app/configmap.yaml
kubectl apply -f k8s/app/deployment.yaml
kubectl apply -f k8s/app/service.yaml
kubectl apply -f k8s/app/ingress.yaml
kubectl rollout status deployment/vehicle-service
```

5. Autoscaling (example)

```bash
kubectl apply -f k8s/app/hpa.yaml
kubectl get hpa vehicle-service -w
```

6. Zero-downtime rolling update

```bash
kubectl set image deployment/vehicle-service \
  vehicle-service=registry.example.com/vehicle-service:v1.1.0
kubectl rollout status deployment/vehicle-service
```

---

## Database Migrations

- Run before exposing new application version.
- Always take a backup prior to applying.

Local:

```bash
npm run migration:run
```

Docker:

```bash
docker-compose exec app npm run migration:run
```

Kubernetes (job pattern):

```bash
kubectl apply -f k8s/jobs/migration-job.yaml
kubectl logs job/migration-job -f
```

Rollback migration:

```bash
npm run migration:revert
```

Best practices: reversible migrations, stage-first validation, monitor duration, coordinate with zero-downtime rollouts.

---

## Health Checks

Endpoints:

- Liveness: `GET /health/live`
- Readiness: `GET /health/ready`
- Overall: `GET /health`

Kubernetes probes example:

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 20
  periodSeconds: 5
```

---

## Monitoring and Observability

- Metrics endpoint: `/metrics` (Prometheus scrape)
- Key metrics: HTTP durations, DB pool usage, RabbitMQ publish/consume counts, NHTSA client request totals and latency, circuit breaker state.
- Logging: structured JSON; ship to centralized store (Fluentd/ELK/Cloud provider).
- Tracing (optional): configure Jaeger/DataDog endpoints via environment variables.

Sample Prometheus scrape config:

```yaml
scrape_configs:
  - job_name: vehicle-service
    static_configs:
      - targets: ['vehicle-service:3000']
    metrics_path: /metrics
```

---

## Rollback Procedures

Docker Compose:

```bash
docker-compose -f docker/docker-compose.prod.yml down
git checkout <previous-tag>
docker-compose -f docker/docker-compose.prod.yml up -d
```

Kubernetes:

```bash
kubectl rollout history deployment/vehicle-service
kubectl rollout undo deployment/vehicle-service --to-revision=<n>
kubectl rollout status deployment/vehicle-service
```

Database:

```bash
npm run migration:revert
```

Always restore from backup if schema or data integrity is compromised.

---

## Security Hardening

- Run containers as non-root; prefer read-only root filesystem.
- Use minimal base images and keep dependencies patched.
- Enforce TLS for external traffic; terminate at gateway or ingress.
- Apply rate limiting at gateway; enable CORS rules as needed.
- Store secrets in dedicated secret stores; avoid embedding in images.
- Database: TLS connections, least-privilege accounts, encryption at rest.
- Network: restrict ingress/egress, apply Kubernetes NetworkPolicies, limit exposed ports.
- Supply chain: image signing/scanning (Trivy, Snyk), lockfile integrity in CI.

---

## Troubleshooting

- Database connection errors: verify `DATABASE_URL`, ensure service reachable, test `psql $DATABASE_URL -c "SELECT 1"`.
- RabbitMQ not receiving: check management UI, validate `RABBITMQ_URL`, inspect queue bindings.
- NHTSA timeouts: increase `NHTSA_API_TIMEOUT`, check upstream availability, tune retries.
- High memory usage: reduce `DATABASE_POOL_SIZE`, lower `INGESTION_BATCH_SIZE`, review ingestion concurrency.
- Deployment stuck: inspect `kubectl describe pod`, check readiness probes, ensure migrations completed.

---

## Verification

- Deploy to staging following this guide end-to-end.
- Execute health checks and smoke tests (GraphQL, REST ingestion trigger).
- Confirm metrics scrape and logs delivery in observability stack.
- Perform rollback drill to prior version and verify recovery.
- Validate zero-downtime by updating image with live traffic and confirming uninterrupted health/readiness.
