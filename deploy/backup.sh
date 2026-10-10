#!/usr/bin/env bash
# Nightly database backup — pg_dump → gzip → AES encryption (optional) → /backups → S3/MinIO sync (optional) → rotate.
# Env:
#   DB_HOST, DB_USER, DB_PASSWORD, DB_NAME (required)
#   BACKUP_RETENTION_DAYS (default 30)
#   BACKUP_ENCRYPTION_KEY (optional: passkey for AES-256-CBC encryption)
#   S3_BACKUP_BUCKET (optional: s3://bucket-name for offsite sync)
#   S3_ENDPOINT_URL (optional: custom endpoint e.g. MinIO)
#   BACKUP_ALERT_WEBHOOK_URL (optional: webhook to alert on failure)

set -euo pipefail

: "${DB_HOST:?DB_HOST is required}"
: "${DB_USER:?DB_USER is required}"
: "${DB_PASSWORD:?DB_PASSWORD is required}"
: "${DB_NAME:?DB_NAME is required}"
RETENTION="${BACKUP_RETENTION_DAYS:-30}"
ALERT_URL="${BACKUP_ALERT_WEBHOOK_URL:-}"
ENC_KEY="${BACKUP_ENCRYPTION_KEY:-}"
S3_BUCKET="${S3_BACKUP_BUCKET:-}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"

# Trap errors and send alert webhook if configured
on_error() {
  local exit_code="${1:-1}"
  local line_no="${2:-unknown}"
  echo "[$(date -u -Iseconds)] [ERROR] Backup failed at line ${line_no} with exit code ${exit_code}" >&2
  if [[ -n "${ALERT_URL}" ]]; then
    curl -s -X POST -H "Content-Type: application/json" \
      -d "{\"status\":\"FAILED\",\"database\":\"${DB_NAME}\",\"line\":${line_no},\"code\":${exit_code},\"timestamp\":\"$(date -u -Iseconds)\"}" \
      "${ALERT_URL}" || true
  fi
  exit "${exit_code}"
}
trap 'on_error $? $LINENO' ERR

STAMP="$(date -u +%Y%m%d_%H%M%S)"
mkdir -p "${BACKUP_DIR}"
OUT="${BACKUP_DIR}/${DB_NAME}_${STAMP}.sql.gz"

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

SIZE="$(stat -c '%s' "${OUT}" 2>/dev/null || stat -f '%z' "${OUT}")"
echo "[$(date -u -Iseconds)] backup done ${OUT} (${SIZE} bytes)"

FINAL_FILE="${OUT}"

# Optional client-side AES-256 encryption
if [[ -n "${ENC_KEY}" ]]; then
  echo "[$(date -u -Iseconds)] encrypting backup archive..."
  openssl enc -aes-256-cbc -salt -pbkdf2 -pass "pass:${ENC_KEY}" -in "${OUT}" -out "${OUT}.enc"
  FINAL_FILE="${OUT}.enc"
  rm -f "${OUT}"
  echo "[$(date -u -Iseconds)] encryption complete → ${FINAL_FILE}"
fi

# Optional offsite upload to S3 / MinIO
if [[ -n "${S3_BUCKET}" ]]; then
  echo "[$(date -u -Iseconds)] syncing to offsite S3 storage: ${S3_BUCKET}..."
  S3_ARGS=()
  if [[ -n "${S3_ENDPOINT_URL:-}" ]]; then
    S3_ARGS+=(--endpoint-url "${S3_ENDPOINT_URL}")
  fi
  aws s3 cp "${FINAL_FILE}" "${S3_BUCKET}/" ${S3_ARGS[@]+"${S3_ARGS[@]}"}
  echo "[$(date -u -Iseconds)] offsite sync complete"
fi

# Local retention rotation. -mtime is day-granular
find "${BACKUP_DIR}" -maxdepth 1 \( -name "${DB_NAME}_*.sql.gz" -o -name "${DB_NAME}_*.sql.gz.enc" \) -type f -mtime "+${RETENTION}" -print -delete \
  || true

echo "[$(date -u -Iseconds)] backup successfully finished: ${FINAL_FILE}"
