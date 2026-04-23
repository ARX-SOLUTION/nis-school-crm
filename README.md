# NIS School CRM

CRM system for Nordic International School (NIS), Tashkent. Manages students, classes, and
teachers through a role-based web interface backed by a NestJS REST API. Features include JWT
authentication with rotating refresh tokens, RabbitMQ-driven audit logging, a Telegram bot for
account linking and notifications, and a per-role dashboard.

![Node 20](https://img.shields.io/badge/Node-20_LTS-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![NestJS](https://img.shields.io/badge/NestJS-10-red)
![React](https://img.shields.io/badge/React-19-61dafb)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)
![Status](https://img.shields.io/badge/status-MVP-yellow)

## Stack

**Backend (`apps/api/`)**
- Node.js 20, NestJS 10, TypeScript strict
- PostgreSQL 15 + TypeORM (migrations only, `synchronize: false`)
- Redis 7 (ioredis) — cache, brute-force counters, Telegram link codes
- RabbitMQ 3.13 — topic exchange `nis.events` (audit + notification queues)
- Telegraf via `nestjs-telegraf` — account linking and notifications
- JWT access tokens + opaque rotating refresh tokens, RBAC

**Frontend (`apps/web/`)**
- Vite 6, React 19, TypeScript strict
- TanStack Router, TanStack Query, react-hook-form + zod
- Tailwind 3 + shadcn/ui, axios with bearer + refresh interceptor

**Shared (`packages/shared/`)**
- `@nis/shared` — TypeScript interfaces and enums consumed by both apps. The backend's
  NestJS DTOs are the source of truth; this package mirrors wire shapes.

**Infrastructure**
- Docker + docker-compose (dev and prod profiles)
- Caddy 2 — reverse proxy, automatic HTTPS via Let's Encrypt, security headers

## Prerequisites

- Node.js >= 20.0.0
- Docker Engine 24+ with the `compose` plugin
- `npm` (workspace support required — npm 7+)

## Quick start

```bash
# 1. Clone and install
git clone https://github.com/ARX-SOLUTION/nis-school-crm.git
cd nis-school-crm
npm ci

# 2. Copy the example env file and fill in the required values
cp apps/api/.env.example apps/api/.env
# Minimum required: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME,
# REDIS_HOST, RABBITMQ_URL, JWT_ACCESS_SECRET (>=32 chars),
# SEED_SUPER_ADMIN_EMAIL, SEED_SUPER_ADMIN_PASSWORD

# 3. Start dev services (Postgres, Redis, RabbitMQ)
docker compose -f docker-compose.dev.yml up -d

# 4. Build the shared package, then run migrations and seed
npm run build:shared
npm run migration:run
npm run db:seed

# 5. Start the API and the web dev server in two terminals
npm run dev:api   # http://localhost:3000
npm run dev:web   # http://localhost:5173
```

Swagger UI (dev only): http://localhost:3000/api/docs

The seed creates a `SUPER_ADMIN` at the address and password set in
`SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD`. On first login the UI
forces a password change.

## Architecture

```mermaid
graph TD
    Browser["Browser\n:5173 (dev) / HTTPS (prod)"]
    Caddy["Caddy\n:443 – reverse proxy\nAuto SSL, HSTS, CSP"]
    API["NestJS API\n:3000\n/api/v1/*"]
    PG[(PostgreSQL 15)]
    Redis[(Redis 7)]
    MQ[(RabbitMQ 3.13\nnis.events topic)]
    AuditQ["audit.log queue"]
    TGQ["notifications.telegram queue"]
    TG["Telegram Bot\n(nestjs-telegraf)"]

    Browser -->|HTTPS| Caddy
    Caddy -->|/api/*| API
    Caddy -->|"/* (SPA)"| Browser
    API --> PG
    API --> Redis
    API -->|publish| MQ
    MQ --> AuditQ
    MQ --> TGQ
    AuditQ -->|consume| API
    TGQ -->|consume| TG
    TG <-->|"webhook / polling"| API
```

## Repository layout

```
nis-school-crm/
├── apps/
│   ├── api/                  # NestJS backend (@nis/api)
│   │   ├── src/
│   │   │   ├── common/       # guards, interceptors, filters, decorators, utils
│   │   │   ├── config/       # env validation (Joi)
│   │   │   ├── database/     # TypeORM data source, migrations, seeds, base entity
│   │   │   └── modules/      # auth, users, students, classes, teachers,
│   │   │                     # telegram, audit, dashboard, health
│   │   └── test/             # e2e specs + jest-e2e.json
│   └── web/                  # Vite + React frontend (@nis/web)
│       └── src/
│           ├── api/          # axios client, TanStack Query hooks
│           ├── components/   # shared UI components
│           └── routes/       # TanStack Router feature pages
├── packages/
│   └── shared/               # @nis/shared — TS types/DTOs
├── deploy/                   # Caddyfile, backup Dockerfile, backup script
├── docker-compose.dev.yml    # dev services: postgres + redis + rabbitmq
├── docker-compose.prod.yml   # full production stack
├── eslint.config.mjs         # workspace-wide ESLint
├── .husky/                   # pre-commit hooks (lint-staged)
├── DEPLOYMENT.md             # production deploy runbook
├── CHANGELOG.md
└── CLAUDE.md                 # orchestration guide for Claude Code subagents
```

## npm scripts

All scripts run from the repo root via npm workspaces.

| Script | Purpose |
|---|---|
| `npm run build` | Build shared → api → web (full monorepo build) |
| `npm run build:shared` | Build `@nis/shared` only |
| `npm run build:api` | Build shared + api |
| `npm run build:web` | Build shared + web |
| `npm run dev:api` | Start NestJS in watch mode (`nest start --watch`) |
| `npm run dev:web` | Start Vite dev server |
| `npm test` | Run all workspace tests (jest + vitest) |
| `npm run test:api` | Jest unit tests for the API |
| `npm run test:web` | Vitest unit tests for the web app |
| `npm run test:e2e` | Supertest e2e suite (requires live Postgres + Redis + RabbitMQ) |
| `npm run test:cov:api` | API unit tests with coverage report |
| `npm run test:cov:web` | Web unit tests with coverage report |
| `npm run migration:run` | Apply all pending TypeORM migrations |
| `npm run migration:generate` | Generate a new migration from entity diff |
| `npm run db:seed` | Seed the super-admin account |
| `npm run lint` | ESLint across all workspaces |
| `npm run format` | Prettier write across all workspaces |

## Environment variables

The API validates every variable at startup using Joi. An invalid or missing required
variable kills the process with a descriptive error before any port is opened.

Copy `apps/api/.env.example` to `apps/api/.env` (or project root `.env`) and fill in
the required values.

### App

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | no | `development` | `development`, `production`, `staging`, or `test` |
| `PORT` | no | `3000` | HTTP port the NestJS process listens on |
| `APP_URL` | no | `http://localhost:3000` | Public base URL of the API (used in generated links) |
| `FRONTEND_URL` | no | _(empty)_ | Frontend origin, used in email/bot links |
| `LOG_LEVEL` | no | `info` | Pino log level: `fatal`, `error`, `warn`, `info`, `debug`, `trace` |
| `CORS_ORIGINS` | no | _(empty)_ | Comma-separated allowed origins. Empty = allow all in dev, deny all in prod |

### Database

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_HOST` | **yes** | — | PostgreSQL hostname |
| `DB_PORT` | no | `5432` | PostgreSQL port |
| `DB_USER` | **yes** | — | PostgreSQL username |
| `DB_PASSWORD` | **yes** | — | PostgreSQL password |
| `DB_NAME` | **yes** | — | Database name |
| `DB_SSL` | no | `false` | Enable TLS for the DB connection |
| `DB_SSL_REJECT_UNAUTHORIZED` | no | `true` | Reject self-signed certs when `DB_SSL=true` |

### Redis

| Variable | Required | Default | Description |
|---|---|---|---|
| `REDIS_HOST` | **yes** | — | Redis hostname |
| `REDIS_PORT` | no | `6379` | Redis port |
| `REDIS_PASSWORD` | no | _(empty)_ | Redis `requirepass` value |
| `REDIS_DB` | no | `0` | Redis logical database index |

### RabbitMQ

| Variable | Required | Default | Description |
|---|---|---|---|
| `RABBITMQ_URL` | **yes** | — | AMQP connection URL, e.g. `amqp://user:pass@host:5672` |

### Auth

| Variable | Required | Default | Description |
|---|---|---|---|
| `JWT_ACCESS_SECRET` | **yes** | — | HS256 signing secret, minimum 32 characters |
| `JWT_ACCESS_EXPIRES` | no | `15m` | Access token lifetime (e.g. `15m`, `1h`) |
| `JWT_REFRESH_EXPIRES` | no | `7d` | Refresh token DB row TTL (e.g. `7d`, `30d`) |
| `BCRYPT_COST` | no | `12` | bcrypt work factor, 10–15 |
| `THROTTLE_TTL` | no | `60` | Global rate-limit window in seconds |
| `THROTTLE_LIMIT` | no | `100` | Max requests per window (global) |
| `AUTH_THROTTLE_TTL` | no | `900` | Login rate-limit window in seconds (15 min) |
| `AUTH_THROTTLE_LIMIT` | no | `5` | Max login attempts per window |

### Telegram

| Variable | Required | Default | Description |
|---|---|---|---|
| `TELEGRAM_BOT_TOKEN` | no | _(empty)_ | Bot token from @BotFather. Bot is disabled when empty |
| `TELEGRAM_WEBHOOK_URL` | no | _(empty)_ | HTTPS URL for Telegram webhooks. Empty = polling mode |
| `TELEGRAM_WEBHOOK_SECRET` | conditional | _(empty)_ | Required (min 16 chars) when `TELEGRAM_WEBHOOK_URL` is set |

### Seed

| Variable | Required | Default | Description |
|---|---|---|---|
| `SEED_SUPER_ADMIN_EMAIL` | **yes** | — | Email for the seeded `SUPER_ADMIN` account |
| `SEED_SUPER_ADMIN_PASSWORD` | **yes** | — | Password for the seeded `SUPER_ADMIN` (min 8 chars) |
| `SEED_SUPER_ADMIN_NAME` | no | `Super Admin` | Display name for the seeded account |

## Testing

```bash
# Unit tests (Jest for api, Vitest for web)
npm run test:api
npm run test:web

# Unit tests with coverage
npm run test:cov:api    # threshold: 70% lines/statements, 65% functions
npm run test:cov:web

# E2E tests — requires Postgres, Redis, and RabbitMQ running locally
docker compose -f docker-compose.dev.yml up -d
npm run test:e2e
```

CI runs three parallel jobs on every push to `main` and every PR:
1. **lint-build** — `npm run build && npm run lint`
2. **unit-tests** — `npm run test:cov:api` + `npm run test:cov:web`
3. **e2e-tests** — live service containers (postgres:15, redis:7, rabbitmq:3.13) + `npm run test:e2e`

## Linting and formatting

```bash
npm run lint      # ESLint (TypeScript strict, prettier plugin)
npm run format    # Prettier write
```

Pre-commit hooks are wired via Husky + lint-staged. On every `git commit`, staged
`.ts`/`.tsx` files are linted and formatted; `.json`, `.md`, `.yml` files are formatted.
Bypass only with explicit approval: `git commit --no-verify`.

## Deployment

Production runs on a single Linux host behind Caddy with automatic HTTPS.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full runbook: first-time deploy, update
workflow, rollback, backup/restore, secrets management, and troubleshooting.

## Contact / ownership

Project: Nordic International School CRM, Tashkent
Maintainer: ARX Solution ([github.com/ARX-SOLUTION](https://github.com/ARX-SOLUTION))

## License

UNLICENSED — proprietary software. All rights reserved.
