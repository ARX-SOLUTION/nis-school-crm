# NIS School CRM — Deployment Guide

Target: a single Linux host (Ubuntu 22.04 LTS recommended) with a public DNS name and inbound 80/443 open. All services run as Docker containers behind Caddy.

## Prerequisites

- Docker Engine 24+ and the `compose` plugin.
- A DNS A record pointing `PUBLIC_HOST` at the server.
- Ports 80 and 443 open inbound (Let's Encrypt HTTP-01 + HTTPS traffic).
- ≥ 4 GB RAM, ≥ 2 vCPU, ≥ 20 GB SSD for the MVP scale described in `NIS_CRM_TZ.md` section 15.3.

## First-time deploy

```bash
# 1. Clone onto the server.
git clone https://github.com/ARX-SOLUTION/nis-school-crm.git
cd nis-school-crm

# 2. Fill every required secret.
cp .env.prod.example .env
${EDITOR:-nano} .env

# 3. Build images (api + web + backup image are built locally from this repo;
#    postgres/redis/rabbitmq/caddy are pulled from Docker Hub).
docker compose -f docker-compose.prod.yml build

# 4. Start dependencies first — waits until healthy.
docker compose -f docker-compose.prod.yml up -d postgres redis rabbitmq

# 5. Apply migrations and seed the super admin. These are one-shot runs in
#    the api image; they exit when done.
docker compose -f docker-compose.prod.yml run --rm api npm run migration:run
docker compose -f docker-compose.prod.yml run --rm api npm run db:seed

# 6. Bring up the rest.
docker compose -f docker-compose.prod.yml up -d

# 7. Tail logs during the first few minutes to watch Caddy grab the cert.
docker compose -f docker-compose.prod.yml logs -f caddy
```

Visit `https://<PUBLIC_HOST>/login` and sign in with the seed super-admin credentials; the app will force a password change on first login.

## Update workflow

```bash
git pull
docker compose -f docker-compose.prod.yml build api web
docker compose -f docker-compose.prod.yml run --rm api npm run migration:run
docker compose -f docker-compose.prod.yml up -d api web
```

Rolling restart: the `api` and `web` containers are replaced with zero downtime because their health checks let Caddy hold requests briefly during the cut-over. If migrations are forward-incompatible (rare), plan a short maintenance window.

## Rollback

Images are tagged with `IMAGE_TAG` (defaults to `latest`). For deliberate rollbacks, set `IMAGE_TAG=vX.Y.Z` in `.env` and redeploy. The compose file does not pull a tag during rollback — you rebuild from the commit you want.

```bash
git checkout <commit>
IMAGE_TAG=stable-2026-04-23 docker compose -f docker-compose.prod.yml build api web
IMAGE_TAG=stable-2026-04-23 docker compose -f docker-compose.prod.yml up -d api web
```

If a migration ran that needs reverting:

```bash
docker compose -f docker-compose.prod.yml run --rm api npm run migration:revert
```

## Backups

The `backup` container runs a cron job (default `0 2 * * *`) that:

1. `pg_dump --format=plain --no-owner --no-privileges` the primary database.
2. Gzip the dump to `./backups/<DB_NAME>_<YYYYMMDD_HHMMSS>.sql.gz`.
3. Delete dumps older than `BACKUP_RETENTION_DAYS` (default 30).

The entrypoint also runs one backup immediately after the container starts so operators can verify the pipeline without waiting overnight.

### Off-site retention

Recommended: `rclone sync ./backups remote:nis-crm-backups/` in a systemd timer on the host. The `./backups` directory is mounted on the host, so any off-site copy tool that reads files from the host FS works.

### Restore drill

```bash
# Pick a dump.
ls -lh backups/

# Option A — restore into a fresh DB. Dangerous: wipes existing rows.
docker compose -f docker-compose.prod.yml exec -T postgres \
  sh -c 'dropdb -U "$POSTGRES_USER" "$POSTGRES_DB" && createdb -U "$POSTGRES_USER" "$POSTGRES_DB"'
zcat backups/nis_crm_20260423_020000.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres psql -U nis_admin -d nis_crm

# Option B — restore into a side database for validation.
docker compose -f docker-compose.prod.yml exec postgres createdb -U nis_admin nis_crm_verify
zcat backups/nis_crm_20260423_020000.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres psql -U nis_admin -d nis_crm_verify
```

Schedule a restore drill **at least once a month**. A backup that hasn't been restored is theoretical.

## Secrets management

- `.env` is the source of truth on the host. Permissions: `chmod 600 .env`, owner root.
- Rotate JWT + DB + Redis + RabbitMQ secrets yearly and after any suspected breach.
- Rotating `JWT_ACCESS_SECRET` invalidates every existing access token → every user logs out on next request. Issue the change during a low-traffic window.
- Rotating the refresh-token DB column hash is not supported in MVP; truncate `refresh_tokens` to force re-login instead.

## Healthchecks + monitoring

- `GET https://<PUBLIC_HOST>/api/v1/health` — app + DB + Redis + RabbitMQ terminus probe.
- `GET http://<internal>:80/caddy-health` — Caddy container liveness (consumed by external LB if any).
- All service logs go to stdout; the host's Docker log driver captures them.
  - Ship to Loki/Grafana or the platform's log store — the MVP ships with JSON logs (`nestjs-pino`) that are drop-in compatible.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Caddy stuck on challenge | Port 80 not open | Check firewall / security group |
| `api` container restart loop, logs show `"DB_HOST" is required` | `.env` missing / wrong path | Ensure `.env` sits next to `docker-compose.prod.yml` |
| `api` healthcheck failing | `/api/v1/health` throws 500 | `docker compose logs api` — most commonly DB or Redis unreachable |
| Telegram bot silent | `TELEGRAM_BOT_TOKEN` empty OR webhook misconfigured | Check `.env`; if using webhook, the URL must be publicly reachable via Caddy |
| RabbitMQ DLQ growing | Consumer logic bug | `docker compose exec rabbitmq rabbitmqctl list_queues name messages` — `nis.dlq` should stay at 0 |

## Architecture diagram (prod)

```
             ┌──────────────┐
 internet ──►│   Caddy :443 │──► /api/*       ► nis-api:3000
             │ auto-SSL/ACME│──► /telegram/*  ► nis-api:3000 (webhook)
             │ HSTS + CSP   │──► /*           ► nis-web:8080 (static SPA)
             └──────┬───────┘
                    │
    ┌───────────────┼─────────────────┐
    ▼               ▼                 ▼
 Postgres 15     Redis 7         RabbitMQ 3.13
 (primary DB)   (cache + BF)     (events + DLQ)
                                       │
                                       ▼
                                  nis-backup
                                  (cron: pg_dump → gzip → rotate)
```
