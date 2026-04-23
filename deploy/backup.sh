#!/usr/bin/env bash
# Nightly database backup — pg_dump → gzip → /backups → rotate.
# Env:
#   DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
#   BACKUP_RETENTION_DAYS (default 30)

set -euo pipefail

: "${DB_HOST:?DB_HOST is required}"
: "${DB_USER:?DB_USER is required}"
: "${DB_PASSWORD:?DB_PASSWORD is required}"
: "${DB_NAME:?DB_NAME is required}"
RETENTION="${BACKUP_RETENTION_DAYS:-30}"

STAMP="$(date -u +%Y%m%d_%H%M%S)"
OUT="/backups/${DB_NAME}_${STAMP}.sql.gz"

echo "[$(date -u -Iseconds)] backup start → ${OUT}"

# -w avoids prompting for a password; PGPASSWORD is picked up from env.
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  --host="${DB_HOST}" \
  --username="${DB_USER}" \
  --dbname="${DB_NAME}" \
  --format=plain \
  --no-owner \
  --no-privileges \
  --encoding=UTF-8 \
  -w \
  | gzip --best > "${OUT}"

SIZE="$(stat -c '%s' "${OUT}")"
echo "[$(date -u -Iseconds)] backup done ${OUT} (${SIZE} bytes)"

# Retention. -mtime is day-granular; one day of slack is fine for the MVP
# retention window.
find /backups -maxdepth 1 -name "${DB_NAME}_*.sql.gz" -type f -mtime "+${RETENTION}" -print -delete \
  || true
