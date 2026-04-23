# NIS School CRM

CRM system for Nordic International School (Tashkent). This file is the orchestration
guide for Claude Code and its specialist subagents. Keep it short, keep it current.

## Repository layout (npm workspaces)

```
nis-school-crm/
├── apps/
│   ├── api/         # NestJS backend (@nis/api)
│   └── web/         # Vite + React frontend (@nis/web)
├── packages/
│   └── shared/      # @nis/shared — TS types/DTOs used by both apps
├── docker-compose.dev.yml   # postgres + redis + rabbitmq for dev
├── eslint.config.mjs        # workspace-wide
├── .husky/                  # pre-commit lint-staged
├── .claude/agents/          # backend (10) + frontend (4) subagents
├── CLAUDE.md
├── NIS_CRM_TZ.md
└── NIS_CRM_BUILD_PROMPT.md
```

Useful root scripts: `npm run dev:api`, `npm run dev:web`, `npm run build`, `npm test`,
`npm run lint`, `npm run migration:run`, `npm run db:seed`.

## Stack

### Backend (`apps/api/`)
- **Runtime**: Node.js 20 (LTS)
- **Framework**: NestJS (TypeScript, `strict: true`)
- **Database**: PostgreSQL 15 + TypeORM (migrations only, `synchronize: false`)
- **Cache / Session**: Redis (ioredis)
- **Message Queue**: RabbitMQ (amqplib, `@nestjs/microservices`)
- **Telegram Bot**: Telegraf via `nestjs-telegraf`
- **Auth**: JWT (access + rotating refresh) + RBAC

### Frontend (`apps/web/`)
- **Build**: Vite 6
- **UI**: React 19 + TypeScript strict
- **Routing**: TanStack Router
- **Server state**: TanStack Query
- **Forms**: react-hook-form + zod
- **Styling**: Tailwind 3 + shadcn/ui (added on demand)
- **HTTP**: axios with bearer + refresh interceptor

### Shared (`packages/shared/`)
- TS package compiled to `dist/` with role enum, DTOs, pagination + error envelope
  types. Both apps may import from `@nis/shared`; the backend should keep its own
  TypeORM entities and `class-validator` DTOs as the canonical source, then mirror
  the wire-shape here. Run `npm run build:shared` (or `npm run build:api` /
  `build:web` which include it) before any consumer build.

### Infrastructure
- **Container**: Docker + docker-compose
- **Reverse Proxy**: Caddy (auto HTTPS via Let's Encrypt) — Stage 9
- **Testing**: Jest + Supertest (backend), Vitest + React Testing Library (frontend)

## Product scope (MVP)

- **Auth** — login, refresh, logout, forgot-password
- **Users** — Admin, Manager, Teacher roles
- **Students** — CRUD + class assignment
- **Classes** — CRUD + teacher assignment
- **Teachers** — profile, own-class visibility
- **Telegram bot** — account linking, notifications, first-login password delivery
- **Audit log** — security-relevant events
- **Dashboard** — per-role metrics
- **Web UI** — login, dashboard, users management, students/classes/teachers

## Role hierarchy

```
SUPER_ADMIN  >  ADMIN  >  MANAGER  >  TEACHER
```

Higher roles inherit the permissions of all roles below them unless explicitly denied.

## Coding standards

- TypeScript `strict: true` everywhere. No `any`. Prefer `unknown` + narrowing.
- Naming:
  - Variables, functions: `camelCase`
  - Classes, types, interfaces, enums, React components: `PascalCase`
  - Constants: `SCREAMING_SNAKE_CASE`
  - DB columns / tables: `snake_case` (via TypeORM `name:` option)
- Backend DTOs live in `dto/` and are suffixed (`CreateStudentDto`, `StudentResponseDto`).
- Frontend types come from `@nis/shared` — never duplicate a DTO interface in the web app.
- Every backend endpoint uses DTOs for both input and output — never leak entities.
- No business logic in controllers (backend) or in components (frontend).
- No `process.env` / `import.meta.env` outside the config layer of each app.
- No `synchronize: true` outside local dev.
- English for all code, identifiers, and engineering docs. User-facing copy (bot
  messages, web UI labels) may be Uzbek, Russian, or English depending on the user's
  locale.

## Git & commit convention

- Branches: `feat/<short>`, `fix/<short>`, `chore/<short>`.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat(api/students): add soft-delete`
  - `feat(web/users): wire create-user form`
  - `fix(api/auth): rotate refresh token on reuse`
  - `chore(deps): bump typeorm to 0.3.20`
  - `docs(readme): update deployment steps`
- One logical change per commit; one stage per PR.

## Subagent roster (`.claude/agents/`)

### Backend (10)

| Agent | When to use |
|---|---|
| `@nestjs-architect` | New NestJS module, module refactor, DI/decorator design |
| `@database-engineer` | Entity, migration, index, query, schema decision |
| `@auth-security-expert` | Anything touching auth, RBAC, JWT, passwords, security headers |
| `@api-developer` | New endpoint, DTO design, pagination, Swagger |
| `@telegram-bot-specialist` | Bot commands, scenes, notifications, user binding |
| `@queue-event-engineer` | RabbitMQ, async jobs, event contracts, cron |
| `@devops-specialist` | Docker, Caddy, CI/CD, deploy, healthchecks, secrets |
| `@test-engineer` | Backend Jest unit + Supertest e2e, fixtures |
| `@code-reviewer` | Auto after every code change — review only, no edits |
| `@docs-writer` | README, Swagger summaries, ADRs, CHANGELOG |

### Frontend (4)

| Agent | When to use |
|---|---|
| `@frontend-architect` | New `apps/web/` feature folder, routing/layout, TanStack Router/Query wiring |
| `@ui-designer` | Components, Tailwind/shadcn, forms/dialogs/tables, accessibility, responsiveness |
| `@state-data-engineer` | TanStack Query hooks, axios + auth interceptor, cache invalidation, Zustand stores |
| `@frontend-tester` | Vitest + React Testing Library + MSW; Playwright later |

## Default workflows

### New backend feature
`@nestjs-architect` scaffolds the module → `@database-engineer` writes entity + migration →
`@api-developer` designs DTOs and controller → `@auth-security-expert` verifies guards →
`@test-engineer` writes tests → `@code-reviewer` reviews → `@docs-writer` updates docs.

### New frontend feature
`@frontend-architect` scaffolds the feature folder + routes → `@state-data-engineer`
wires the API hooks → `@ui-designer` builds the components → `@frontend-tester` covers
the user-visible behaviour → `@code-reviewer` reviews.

### End-to-end feature (typical for a stage)
Backend chain lands the endpoint and its DTO. `@api-developer` mirrors the
request/response shape into `@nis/shared` (TS-only `interface`s, no runtime code
that would duplicate validation). Frontend chain imports from `@nis/shared` so
the wire contract stays in lockstep. The backend's NestJS DTOs remain the
source of truth and the only place where `class-validator` rules live.

### Bug fix
Reproduce with a failing test (`@test-engineer` or `@frontend-tester`) → fix → `@code-reviewer`.

### Deploy
`@devops-specialist` + `@code-reviewer` pass before cutting a release.

### Any code change
`@code-reviewer` is called automatically.

## Cross-agent communication rules

- **Contract-first.** When a frontend feature needs new data, the backend chain runs
  first, lands the DTO in `@nis/shared`, then the frontend chain consumes it. The
  frontend never invents a contract.
- **Ask, don't assume.** If `@frontend-architect` finds a missing endpoint, it asks
  `@api-developer` to add it rather than mocking it locally.
- **Security has veto.** `@auth-security-expert` can block any change that touches
  auth, tokens, or RBAC, on either side of the stack.
- **Reviewer never edits.** `@code-reviewer` produces Blockers/Should-fix/Nits and
  hands fixes back to the relevant specialist.

## Non-negotiable rules

- Never commit `.env*` (only `.env.example`).
- Never use `synchronize: true` outside local dev.
- Always use migrations for schema change.
- Always wrap multi-table writes in a transaction.
- Always validate input with `class-validator` (backend) / `zod` (frontend) — never
  trust raw input.
- Always write a test for any new business rule or user-visible behaviour.
- Never log secrets, JWTs, passwords, or full request/response bodies.
- Never store JWT access tokens in `localStorage`.
- Never skip pre-commit hooks (`--no-verify`) without explicit user approval.
