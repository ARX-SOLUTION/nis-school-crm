#!/usr/bin/env bash
# Entrypoint for the backup container — writes the schedule into
# crontab, streams cron logs to stdout so `docker logs` shows them, and
# runs one backup immediately on start so operators can verify the
# wiring without waiting for 02:00.

set -euo pipefail

SCHEDULE="${CRON_SCHEDULE:-0 2 * * *}"

# Pass DB env into cron's environment (cron strips the parent process
# env by default).
env | grep -E '^(DB_|BACKUP_)' > /etc/environment

echo "${SCHEDULE} root . /etc/environment; /usr/local/bin/backup.sh >> /proc/1/fd/1 2>&1" \
  > /etc/crontabs/root

echo "[entrypoint] first-run backup"
/usr/local/bin/backup.sh || echo "[entrypoint] first-run backup failed — continuing"

echo "[entrypoint] launching crond with schedule: ${SCHEDULE}"
exec crond -f -l 2
