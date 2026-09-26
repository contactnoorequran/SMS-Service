# Production Readiness Audit — High Availability & Disaster Recovery Runbook

**High Availability Objective:** 99.95% Operational Uptime  
**Target RPO (Recovery Point Objective):** < 1 minute (Synchronous WAL replication)  
**Target RTO (Recovery Time Objective):** < 5 minutes (Automated pod rescheduling)  

---

## 1. Resilience & Fault Tolerance Mechanisms

1. **Self-Healing Circuit Breaker:**
   - In case of PostgreSQL latency spikes (>10s) or network partitions, the database circuit breaker trips to prevent cascading thread pool exhaustion.
   - Incoming read requests are served from in-memory identity and provider caches.
   - Cooldown timer automatically attempts reconnection after **5 seconds** (`5,000ms`).
2. **Crash-Only Design & Stateless Web Tier:**
   - The Node.js application process is completely stateless.
   - Any unhandled process exit allows Kubernetes or PM2 to restart a healthy container within 2 seconds.
3. **Database Check Constraints:**
   - Database-level hardware constraints (e.g. `Wallet_exactly_one_owner_check`) prevent corrupt state from ever being committed to disk, even if an application bug attempts it.

---

## 2. Disaster Recovery & Backup Runbook

### Daily Automated Snapshot & Continuous WAL Archiving
1. **Automated Backups:**
   - Full daily `pg_dump` snapshot executed at 02:00 UTC and archived to redundant cloud storage (GCS/S3) with 30-day retention and object versioning.
   - Write-Ahead Logging (WAL) streaming enabled for Point-In-Time Recovery (PITR) up to the exact minute of failure.
2. **Restoration Command Procedure:**
   ```bash
   # 1. Stop active application containers
   kubectl scale deployment sms-service --replicas=0

   # 2. Restore database from snapshot
   pg_restore -h <DB_HOST> -U postgres -d sms_platform_prod -v latest_backup.dump

   # 3. Validate financial reconciliation before traffic cutover
   node scripts/deep-db-audit.cjs

   # 4. Resume application traffic
   kubectl scale deployment sms-service --replicas=3
   ```

---

## 3. Incident Management & Operator Procedures

| Incident Scenario | Telemetry Signal | Immediate Operator Action |
| :--- | :--- | :--- |
| **Database Pool Exhaustion** | Log: `Database unreachable. Tripping circuit breaker.` | Scale up PgBouncer pool connections or increase Supabase compute tier. |
| **Carrier Ingestion Latency** | Log: Latency > 500ms on `/api/messages/inbound` | Check carrier webhook ingress queue; verify provider connection status. |
| **Financial Ledger Discrepancy** | Alert: Discrepancy > 0 in reconciliation job | Freeze automated billing queue; inspect last CDR and adjust via `/api/billing/wallets/adjust`. |
| **Upstream SMPP Bind Drop** | Alert: 3 missed `enquire_link` responses | Check carrier IPsec VPN tunnel; restart SMPP connection daemon. |
