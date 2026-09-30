#!/usr/bin/env bash
# VPS Database Automated Backup and Supabase Cloud Sync Script
# Runs daily via cron: 0 2 * * * /usr/local/bin/sms-backup-and-sync.sh >> /var/log/sms-backup-and-sync.log 2>&1
set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/sms_service"
BACKUP_FILE="${BACKUP_DIR}/sms_service_${TIMESTAMP}.sql.gz"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

echo "${LOG_PREFIX} === Starting SMS Service Database Backup & Supabase Sync ==="

mkdir -p "${BACKUP_DIR}"

# 1. Local Database Backup (Compressed)
echo "${LOG_PREFIX} Creating local compressed backup at ${BACKUP_FILE}..."
export PGPASSWORD="SmsLocalDb2026Secure!"
pg_dump -h 127.0.0.1 -U sms_service -d sms_service | gzip > "${BACKUP_FILE}"
BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "${LOG_PREFIX} Local backup completed successfully. File size: ${BACKUP_SIZE}"

# 2. Cleanup backups older than 14 days
echo "${LOG_PREFIX} Pruning local backups older than 14 days..."
find "${BACKUP_DIR}" -name "sms_service_*.sql.gz" -mtime +14 -exec rm -f {} \;

# 3. Synchronize to Remote Cloud Database (Supabase)
echo "${LOG_PREFIX} Syncing local database state to Supabase..."
SUPABASE_URL="postgresql://postgres.jtpmzxxanixldhqktppc:c3Nknjfx8e8EzUVF@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"

export PGPASSWORD="SmsLocalDb2026Secure!"
pg_dump -h 127.0.0.1 -U sms_service -d sms_service --clean --if-exists -O -x -n public | psql "${SUPABASE_URL}" > /dev/null 2>&1

echo "${LOG_PREFIX} Supabase cloud mirror updated successfully."
echo "${LOG_PREFIX} === Backup & Sync Cycle Completed Successfully ==="
