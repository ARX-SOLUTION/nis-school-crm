# Contributing to NIS School CRM

## Prerequisites

- Node.js >= 20.0.0
- Docker Engine 24+ with the `compose` plugin
- Read `README.md` and get the dev environment running before sending a PR.

## Branch naming

```
feat/<short-description>
fix/<short-description>
chore/<short-description>
docs/<short-description>
```

Examples: `feat/student-export`, `fix/refresh-token-expiry`, `chore/bump-typeorm`.

## Commit convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>(<scope>): <imperative summary>
```

**Types:** `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `ci`

**Scopes** (use the closest one):

| Scope | Covers |
|---|---|
| `api/auth` | Auth module |
| `api/users` | Users module |
| `api/students` | Students module |
| `api/classes` | Classes module |
| `api/teachers` | Teachers module |
| `api/telegram` | Telegram bot module |
| `api/audit` | Audit module |
| `api/dashboard` | Dashboard module |
| `web/login` | Login page |
| `web/users` | Users management |
| `web/students` | Students pages |
| `web/classes` | Classes pages |
| `web/teachers` | Teachers pages |
| `shared` | `@nis/shared` package |
| `infra` | Docker, Caddy, CI |
| `deps` | Dependency bumps |

Examples:

```
feat(api/students): add soft-delete endpoint
fix(api/auth): rotate refresh token on reuse
chore(deps): bump typeorm to 0.3.20
docs(readme): update quick start commands
test(api/classes): add capacity enforcement spec
```

One logical change per commit. Squash fixup commits before requesting review.

## Development workflow

```bash
# 1. Fork and clone
git clone https://github.com/<you>/nis-school-crm.git
cd nis-school-crm

# 2. Create a feature branch
git checkout -b feat/my-feature

# 3. Set up dev environment (see README.md Quick Start)
npm ci
cp apps/api/.env.example apps/api/.env
# edit apps/api/.env with your local values
docker compose -f docker-compose.dev.yml up -d
npm run build:shared
npm run migration:run
npm run db:seed

# 4. Start the servers
npm run dev:api   # terminal 1
npm run dev:web   # terminal 2

# 5. Make changes, write tests, commit
npm run test:api
npm run test:web
git add .
git commit -m "feat(api/students): add bulk import endpoint"
```

## Pre-commit hooks

Husky runs lint-staged on every `git commit`:

- `.ts` / `.tsx` files: `eslint --fix` then `prettier --write`
- `.json`, `.md`, `.yml`, `.yaml` files: `prettier --write`

Do not bypass hooks with `--no-verify` without explicit approval from the project
maintainer.

## Pull request checklist

Before opening a PR, verify:

- [ ] All new business logic has a unit test.
- [ ] New endpoints have a Supertest e2e spec.
- [ ] `npm run lint` passes with zero warnings.
- [ ] `npm run build` succeeds.
- [ ] `npm run test:api` and `npm run test:web` pass.
- [ ] No `.env` files committed (only `.env.example` variants).
- [ ] No `synchronize: true` in TypeORM config.
- [ ] New DB columns have a migration (generated via `npm run migration:generate`).
- [ ] Multi-table writes are wrapped in a transaction.
- [ ] New endpoints are guarded with `@UseGuards(JwtAuthGuard)` and `@Roles(...)`.
- [ ] Swagger `@ApiOperation({ summary: '...' })` is present on every endpoint.
- [ ] `@nis/shared` is updated if the API contract changes.
- [ ] `CHANGELOG.md` has an entry under `## [Unreleased]` if this is a user-visible change.

## Architecture constraints (non-negotiable)

- No `any` in TypeScript. Use `unknown` + narrowing.
- No business logic in controllers or React components.
- No `process.env` / `import.meta.env` outside the config layer.
- Never log JWTs, passwords, or raw request/response bodies.
- Never store JWT access tokens in `localStorage`.

See `CLAUDE.md` for the full coding standards and non-negotiable rules.

## Subagent workflow (Claude Code)

If you are using Claude Code with the subagent roster defined in `.claude/agents/`,
follow the default workflows in `CLAUDE.md`:

- Backend feature: `@nestjs-architect` → `@database-engineer` → `@api-developer` →
  `@auth-security-expert` → `@test-engineer` → `@code-reviewer` → `@docs-writer`
- Frontend feature: `@frontend-architect` → `@state-data-engineer` → `@ui-designer`
  → `@frontend-tester` → `@code-reviewer`
- Any code change: `@code-reviewer` is called automatically.

## Getting help

Open an issue on GitHub or contact the maintainer:
ARX Solution — [github.com/ARX-SOLUTION](https://github.com/ARX-SOLUTION)
