# Operational Runbook

Operational guidance for the Vehicle Data Aggregation Service: monitoring, troubleshooting, incident handling, and recovery.

## Table of Contents

- System Overview
- Monitoring & Alerting
- Common Issues
- Incident Response
- Performance Tuning
- Recovery Procedures
- Escalation
- Post-Incident Review
- Verification

---

## System Overview

- Application: NestJS service (3+ instances in production)
- Database: PostgreSQL 15+ (primary, optional replicas)
- Messaging: RabbitMQ 3.12+ (clustered for HA)
- Gateway: Kong 3.4+
- External dependency: NHTSA vehicle data API

### Key Metrics

| Metric                | Normal     | Warning   | Critical |
| --------------------- | ---------- | --------- | -------- |
| API p95 latency       | < 200ms    | 200–500ms | > 500ms  |
| CPU usage             | < 60%      | 60–80%    | > 80%    |
| Memory usage          | < 70%      | 70–85%    | > 85%    |
| DB connections (pool) | < 50% pool | 50–75%    | > 75%    |
| RabbitMQ queue length | < 100      | 100–1000  | > 1000   |
| Error rate            | < 1%       | 1–5%      | > 5%     |

---

## Monitoring & Alerting

### Health Checks

```bash
# Overall
curl http://localhost:3000/health
# Liveness
curl http://localhost:3000/health/live
# Readiness
curl http://localhost:3000/health/ready
```

### Prometheus Metrics

- Endpoint: `http://localhost:3000/metrics`
- Watch: `http_request_duration_seconds`, `database_connection_pool_active`, `rabbitmq_messages_published_total`, `nhtsa_api_requests_total`, `circuit_breaker_state`

### Logs

```bash
# Kubernetes
kubectl logs -f deployment/vehicle-service --tail=200
# Docker Compose
docker-compose logs -f vehicle-service --tail=200
# Filter errors
kubectl logs deployment/vehicle-service | grep ERROR
```

Alerting should cover: readiness failures, elevated p95 latency, DB pool saturation, RabbitMQ queue backlog, ingestion failures, circuit breaker open state.

---

## Common Issues

### 1) High API Latency

Symptoms: p95 > 500ms, client timeouts.
Diagnose:

```bash
curl -s http://localhost:3000/metrics | grep http_request_duration_seconds
kubectl logs deployment/vehicle-service | grep DataLoader
```

Resolve:

1. Verify indexes and query plans.
2. Confirm DataLoader batching is active.
3. Scale app replicas; increase DB pool cautiously.
4. Enable response caching if available.

### 2) DB Connection Pool Exhausted

Symptoms: pool errors, readiness fails.
Diagnose:

```bash
kubectl exec -it postgres-0 -- psql -c "select state, count(*) from pg_stat_activity group by state;"
curl -s http://localhost:3000/metrics | grep database_connection_pool
```

Resolve:

1. Raise `DATABASE_POOL_SIZE` moderately (e.g., 20) and restart pods.
2. Check for long-running queries; add indexes.
3. Reduce ingestion concurrency temporarily.

### 3) RabbitMQ Connection Lost

Symptoms: no events published/consumed; connection closed logs.
Diagnose:

```bash
kubectl exec -it rabbitmq-0 -- rabbitmqctl status
kubectl exec -it rabbitmq-0 -- rabbitmqctl list_queues name messages consumers
kubectl exec -it rabbitmq-0 -- rabbitmqctl list_connections
```

Resolve:

1. Ensure RabbitMQ pods healthy; restart app deployment to reconnect.
2. Inspect broker logs; restart broker node if required.
3. If cluster impaired, failover or restore from backup.

### 4) Ingestion Job Stuck (IN_PROGRESS > 30m)

Diagnose:

```bash
curl http://localhost:3000/api/v1/ingestion/status
kubectl logs deployment/vehicle-service | grep -A5 Ingestion
curl -s http://localhost:3000/metrics | grep circuit_breaker_state
```

Resolve:

1. Check NHTSA API availability.
2. If circuit breaker OPEN, allow reset window.
3. If stuck, mark job FAILED in DB, then re-trigger ingestion.
4. Review retries and backoff settings.

### 5) High Memory Usage / OOM

Diagnose:

```bash
kubectl top pods -l app=vehicle-service
```

Resolve:

1. Lower `INGESTION_BATCH_SIZE` and concurrency.
2. Increase memory limits/requests.
3. Restart pods; if persistent, profile heap for leaks.

### 6) Circuit Breaker Open

Diagnose:

```bash
curl -s http://localhost:3000/metrics | grep circuit_breaker_state
curl https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=XML
```

Resolve:

1. Verify upstream health; wait for half-open.
2. Tune thresholds only if consistently too sensitive.

---

## Incident Response

### Severity

- SEV-1: Outage, data loss, security incident.
- SEV-2: Major degradation, repeated ingestion failures.
- SEV-3: Partial impact, single job failure.
- SEV-4: Minor/cosmetic.

### Workflow

1. Detect/alert.
2. Acknowledge within SLA (SEV-1: 15m, SEV-2: 30m).
3. Assess impact and severity.
4. Investigate using logs/metrics/health.
5. Mitigate or rollback.
6. Communicate status to stakeholders.
7. Resolve and document.

### Rapid Actions (SEV-1)

```bash
kubectl get pods -l app=vehicle-service
kubectl logs deployment/vehicle-service --tail=200
kubectl rollout history deployment/vehicle-service
kubectl rollout undo deployment/vehicle-service   # if last deploy suspected
```

---

## Performance Tuning

### Database

```sql
EXPLAIN ANALYZE SELECT * FROM vehicle_makes WHERE make_name ILIKE '%FORD%';
CREATE INDEX idx_vehicle_makes_name_gin ON vehicle_makes USING gin(make_name gin_trgm_ops);
ANALYZE vehicle_makes;
```

### Application

```bash
DATABASE_POOL_SIZE=20
NHTSA_API_TIMEOUT=15000
CIRCUIT_BREAKER_THRESHOLD=0.6
CIRCUIT_BREAKER_TIMEOUT=60000
INGESTION_BATCH_SIZE=50
INGESTION_CONCURRENCY=3
```

### Horizontal Scaling

```bash
kubectl scale deployment/vehicle-service --replicas=5
```

---

## Recovery Procedures

### Database

```bash
pg_restore -d vehicle_prod backup-latest.dump
psql vehicle_prod -c "SELECT COUNT(*) FROM vehicle_makes;"
```

### Application

```bash
kubectl rollout restart deployment/vehicle-service
# If pod wedged
kubectl delete pod <pod> --force --grace-period=0
```

### Messaging

```bash
kubectl rollout restart statefulset/rabbitmq
```

---

## Escalation

### Path

1. L1: On-call engineer
2. L2: Senior engineer
3. L3: Engineering manager
4. L4: CTO for critical incidents

### Contacts

| Role                | Contact             | Availability              |
| ------------------- | ------------------- | ------------------------- |
| On-Call Engineer    | PagerDuty           | 24/7                      |
| Senior Engineer     | Slack @senior-team  | Business hours            |
| Engineering Manager | manager@example.com | Business hours + critical |
| CTO                 | cto@example.com     | Critical incidents only   |

Escalate when SLA breach is near, data loss is suspected, multiple systems affected, or security concerns arise.

---

## Post-Incident Review

For SEV-1 and SEV-2:

1. Schedule review within 48 hours.
2. Capture timeline, impact, root cause.
3. List corrective and preventive actions with owners and due dates.
4. Update this runbook with new learnings.

---

## Verification

- Dry-run key troubleshooting steps in staging.
- Confirm alerts fire and clear for health, latency, queue backlog, and error rate.
- Execute rollback drill of latest deployment.
- Validate backups restore successfully to staging.
