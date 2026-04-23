# Tiny image bundling the Postgres 15 client + a cron scheduler. The
# backup script is COPY'd from the deploy directory at build time.
FROM postgres:15-alpine

RUN apk add --no-cache dcron tini bash

COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

# Run pg_dump every night at 02:00 container local time. CRON_SCHEDULE can
# be overridden via env for staging experiments.
ENV CRON_SCHEDULE="0 2 * * *"

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

VOLUME ["/backups"]

ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/entrypoint.sh"]
