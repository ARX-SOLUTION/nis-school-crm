# NIS School CRM

CRM system for Nordic International School (Tashkent). This file is the orchestration
guide for Claude Code and its specialist subagents. Keep it short, keep it current.

## Stack

- **Runtime**: Node.js 20 (LTS)
- **Framework**: NestJS (TypeScript, `strict: true`)
- **Database**: PostgreSQL 15 + TypeORM (migrations only, `synchronize: false`)
- **Cache / Session**: Redis (ioredis)
- **Message Queue**: RabbitMQ (amqplib, `@nestjs/microservices`)
- **Telegram Bot**: Telegraf via `nestjs-telegraf`
- **Container**: Docker + docker-compose
- **Reverse Proxy**: Caddy (auto HTTPS via Let's Encrypt)
- **Auth**: JWT (access + rotating refresh) + RBAC
- **Testing**: Jest + Supertest

## Product scope (MVP)

- **Auth** — login, refresh, logout, forgot-password
- **Users** — Admin, Manager, Teacher roles
- **Students** — CRUD + class assignment
- **Classes** — CRUD + teacher assignment
- **Teachers** — profile, own-class visibility
- **Telegram bot** — account linking, notifications, first-login password delivery
- **Audit log** — security-relevant events
- **Dashboard** — per-role metrics

## Role hierarchy

```
SUPER_ADMIN  >  ADMIN  >  MANAGER  >  TEACHER
```

Higher roles inherit the permissions of all roles below them unless explicitly denied.

## Coding standards

- TypeScript `strict: true`. No `any`. Prefer `unknown` + narrowing.
- Naming:
  - Variables, functions: `camelCase`
  - Classes, types, interfaces, enums: `PascalCase`
  - Constants: `SCREAMING_SNAKE_CASE`
  - DB columns / tables: `snake_case` (via TypeORM `name:` option)
- DTOs live in `dto/` and are suffixed (`CreateStudentDto`, `StudentResponseDto`).
- Every endpoint uses DTOs for both input and output — never leak entities.
- No business logic in controllers.
- No `process.env` outside `ConfigService`.
- No `synchronize: true` outside local dev.
- English for all code, identifiers, and engineering docs. User-facing copy (bot messages,
  admin UI) may be Uzbek, Russian, or English depending on the user's locale.

## Git & commit convention

- Branches: `feat/<short>`, `fix/<short>`, `chore/<short>`.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat(students): add soft-delete`
  - `fix(auth): rotate refresh token on reuse`
  - `chore(deps): bump typeorm to 0.3.20`
  - `docs(readme): update deployment steps`
- One logical change per commit.

## Subagent roster (`.claude/agents/`)

| Agent | When to use |
|---|---|
| `@nestjs-architect` | New module, module refactor, DI/decorator design |
| `@database-engineer` | Entity, migration, index, query, schema decision |
| `@auth-security-expert` | Anything touching auth, RBAC, JWT, passwords, security headers |
| `@api-developer` | New endpoint, DTO design, pagination, Swagger |
| `@telegram-bot-specialist` | Bot commands, scenes, notifications, user binding |
| `@queue-event-engineer` | RabbitMQ, async jobs, event contracts, cron |
| `@devops-specialist` | Docker, Caddy, CI/CD, deploy, healthchecks, secrets |
| `@test-engineer` | Unit/e2e tests, coverage, fixtures |
| `@code-reviewer` | Auto after every code change — review only, no edits |
| `@docs-writer` | README, Swagger summaries, ADRs, CHANGELOG |

## Default workflow

1. **New feature** → `@nestjs-architect` scaffolds the module → `@database-engineer` writes
   entity + migration → `@api-developer` designs DTOs and controller → `@auth-security-expert`
   verifies guards and roles → `@test-engineer` writes tests → `@code-reviewer` reviews →
   `@docs-writer` updates docs.
2. **Bug fix** → reproduce with a failing test (`@test-engineer`) → fix → `@code-reviewer`.
3. **Deploy** → `@devops-specialist` + `@code-reviewer` pass before cutting a release.
4. **Any code change** → `@code-reviewer` is called automatically.

## Non-negotiable rules

- Never commit `.env*` (only `.env.example`).
- Never use `synchronize: true` outside local dev.
- Always use migrations for schema change, never schema sync.
- Always wrap multi-table writes in a transaction.
- Always validate input with `class-validator` DTOs — never trust `req.body` directly.
- Always write a test for any new business rule.
- Never log secrets, JWTs, passwords, or full request bodies.
- Never skip pre-commit hooks (`--no-verify`) without explicit user approval.
