# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-04-23 — MVP Initial Release

### Added

**Auth**
- JWT authentication: HS256 access tokens (15 min default TTL) + opaque rotating refresh tokens (SHA-256 hashed at rest, 7 day default TTL).
- Refresh-token reuse detection with family-based revocation: presenting a burned token immediately revokes all tokens in that family.
- Brute-force protection on `POST /auth/login`: Redis-backed per-email + per-IP counter with configurable window and limit (`AUTH_THROTTLE_TTL`, `AUTH_THROTTLE_LIMIT`).
- Forced password change on first login (`mustChangePassword` flag on `User`).
- `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/change-password` endpoints.

**Users**
- `User` entity with roles: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `TEACHER`.
- RBAC via `@Roles` decorator + `RolesGuard`; role hierarchy enforced globally.
- Full users CRUD (`GET /users`, `POST /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id`) with role-scoped access.
- Seeder creates a `SUPER_ADMIN` from `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` on first `db:seed` run.

**Students**
- `Student` entity with auto-generated student code `NIS-YYYY-NNNNN` (year + zero-padded sequence).
- Soft delete via `BaseEntity.deletedAt`; hard delete not exposed.
- Class assignment with capacity enforcement and grade-level validation.
- `GET /students`, `POST /students`, `GET /students/:id`, `PATCH /students/:id`, `DELETE /students/:id`.
- Pagination, sorting, and filtering by status / grade / class.

**Classes**
- `ClassEntity` with capacity limit, grade level, and optional homeroom teacher.
- Teacher assignment with de-duplication guard.
- `GET /classes`, `POST /classes`, `GET /classes/:id`, `PATCH /classes/:id`, `DELETE /classes/:id`.

**Teachers**
- `Teacher` profile linked 1-to-1 to `User`.
- Own-class visibility: teachers may only view classes where they are assigned.
- `GET /teachers`, `POST /teachers`, `GET /teachers/:id`, `PATCH /teachers/:id`, `DELETE /teachers/:id`.

**Telegram bot**
- `nestjs-telegraf` integration; bot is disabled gracefully when `TELEGRAM_BOT_TOKEN` is empty.
- `/start` command: account-linking flow via a time-limited Redis-backed link code.
- `POST /telegram/link-code` generates a code; user sends it to the bot to bind their Telegram `chat_id`.
- Outbound notifications via `notifications.telegram` queue on the `nis.events` topic exchange.
- Webhook mode when `TELEGRAM_WEBHOOK_URL` is set; polling mode otherwise.

**Audit logging**
- `AuditLog` entity records: actor ID/role, action, resource type/ID, IP address, user agent, HTTP status.
- `AuditInterceptor` automatically captures every mutating HTTP request (POST/PATCH/PUT/DELETE).
- `AuditConsumer` subscribes to `audit.log` queue on the `nis.events` RabbitMQ topic exchange.
- `GET /audit` endpoint (paginated, admin+ access).

**Dashboard**
- Role-scoped metrics endpoint `GET /dashboard/metrics`.
- Returns total counts (users, students, classes) and breakdowns appropriate to the caller's role.

**Health**
- `GET /api/v1/health` via `@nestjs/terminus`: checks PostgreSQL, Redis, and RabbitMQ connectivity.

**Shared package**
- `@nis/shared` TypeScript package with role enum, auth/users/students/classes/teachers/audit/dashboard/telegram DTO interfaces, pagination types, and error envelope.
- Consumed by both `@nis/api` and `@nis/web`; no runtime validation code — that lives in the NestJS DTOs.

**Frontend**
- Vite 6 + React 19 + TypeScript strict SPA (`@nis/web`).
- TanStack Router with file-based routes; TanStack Query for server state.
- Axios client with Bearer token injection and 401→refresh interceptor.
- Login page, dashboard page, users management, students list/detail, classes list/detail, teachers list.
- react-hook-form + zod for all forms; Tailwind 3 + shadcn/ui components.

**Infrastructure**
- `docker-compose.dev.yml`: Postgres 15, Redis 7, RabbitMQ 3.13 (with management UI on :15672).
- `docker-compose.prod.yml`: full stack — api, web (nginx-unprivileged), caddy, postgres, redis, rabbitmq, backup.
- `deploy/Caddyfile`: automatic HTTPS via ACME/Let's Encrypt, HSTS, CSP, and X-Frame-Options headers.
- `deploy/backup.Dockerfile` + cron script: nightly `pg_dump` → gzip → 30-day rotation; immediate run on container start.
- Dockerfile for api (`apps/api/Dockerfile`) and web (`apps/web/Dockerfile`).
- `apps/api/.env.example` and `.env.prod.example` checked in; populated `.env` files are gitignored.

**CI**
- GitHub Actions workflow (`.github/workflows/ci.yml`) with three parallel jobs: lint-build, unit-tests (coverage upload), e2e-tests (live service containers).

**Documentation**
- `README.md`: project summary, quick start, architecture diagram, npm scripts table, full environment variables reference, testing guide, deployment pointer.
- `DEPLOYMENT.md`: first-time deploy, update workflow, rollback, backup/restore, secrets management, healthchecks, troubleshooting table.
- `docs/adr/`: five Architecture Decision Records (NestJS, RabbitMQ, Caddy, refresh-token rotation, soft-delete strategy).
- `CHANGELOG.md` (this file).
- `CONTRIBUTING.md`: branch naming, commit convention, PR checklist.

### Security

- Passwords hashed with bcrypt (cost 12 default; configurable 10–15).
- Refresh tokens stored as SHA-256 hex digests; raw token never persisted.
- Helmet middleware sets `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, and other security headers on every response.
- CORS locked to `CORS_ORIGINS` in production (empty list rejects all cross-origin requests with a startup warning).
- Express `trust proxy 1` set to derive correct `req.ip` behind Caddy without accepting spoofed `X-Forwarded-For` from direct callers.
- JWT access tokens are short-lived (15 min); refresh tokens rotate on every use.
- Rate limiting on all endpoints (global throttler) plus tighter limits on `/auth/login`.
- Audit log captures every mutating HTTP request with actor, IP, and user agent.

### Infrastructure

- Single-VPS Docker deployment behind Caddy with automatic Let's Encrypt certificate renewal.
- Nightly PostgreSQL backups with configurable retention; off-site rclone integration documented.
- Node.js 20 LTS runtime; PostgreSQL 15; Redis 7; RabbitMQ 3.13.

[0.1.0]: https://github.com/ARX-SOLUTION/nis-school-crm/releases/tag/v0.1.0
