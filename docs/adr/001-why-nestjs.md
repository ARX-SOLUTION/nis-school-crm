# ADR 001 — Use NestJS as the backend framework

**Status:** Accepted
**Date:** 2026-04-23

## Context

The project needed a Node.js server framework for a greenfield CRM with these
characteristics:

- TypeScript strict mode throughout.
- Multiple cross-cutting concerns: authentication guards, role-based access,
  request validation, logging, rate-limiting, Swagger documentation, message-queue
  consumers, a Telegram bot, and health checks.
- A "module-per-feature" code structure so each domain (users, students, classes,
  teachers, audit, …) is self-contained and can be developed in parallel.
- Long maintenance horizon: the codebase should be legible to engineers who join
  after the initial build without requiring tribal knowledge.

Candidates considered:

| Option | Notes |
|---|---|
| Plain Express + manual wiring | Maximum flexibility, but requires every cross-cutting concern to be assembled by hand. DI, validation, Swagger, and lifecycle hooks are all solved problems — rolling them again adds risk. |
| Fastify (raw) | Good performance, but same wiring burden as Express. |
| Fastify with custom scaffolding | Closer to NestJS, but produces bespoke patterns future engineers won't recognise. |
| **NestJS** | Batteries-included, opinionated, first-class TypeScript. |

## Decision

Use **NestJS 10** with `@nestjs/platform-express` as the HTTP adapter.

Reasons:

1. **Dependency injection container.** NestJS's DI eliminates manual service wiring
   and makes every service trivially testable by swapping providers in
   `Test.createTestingModule`. This pays off immediately in a multi-service domain.

2. **Module boundaries enforce separation of concerns.** Each feature lives in a
   NestJS module (`AuthModule`, `StudentsModule`, etc.). Circular imports are caught at
   compile time. Sharing services requires an explicit `exports` declaration.

3. **First-class TypeScript.** Decorators, metadata reflection, and the full strict
   type system work without configuration gymnastics. The API reads like typed
   contracts, not stringly-typed middleware chains.

4. **Official integrations for every dependency in this stack:**
   - `@nestjs/typeorm` — database
   - `@nestjs/jwt` + `@nestjs/passport` — auth
   - `@nestjs/swagger` — Swagger/OpenAPI, generated from decorators with zero
     duplication
   - `@nestjs/config` with Joi validation — environment validation
   - `@nestjs/throttler` — rate limiting
   - `@nestjs/terminus` — health checks
   - `@nestjs/schedule` — cron jobs
   - `nestjs-telegraf` — Telegram bot
   - `nestjs-pino` — structured JSON logging
   All of these integrate via the module system; no glue code.

5. **`@UseGuards`, `@UseInterceptors`, `@UsePipes` as global, controller, or
   per-route decorators.** JWT auth, RBAC, logging, and audit capture are wired
   globally in `AppModule.providers` — no per-controller boilerplate.

6. **Ecosystem size and documentation.** NestJS is the most adopted structured
   Node.js framework. Onboarding engineers find answers quickly. The official docs
   cover every pattern this project uses.

## Consequences

**Positive**
- Cross-cutting concerns (auth, validation, logging, audit) are configured once and
  apply everywhere.
- New features follow a predictable pattern: module → entity → service → controller
  → DTO → guard. No architecture decisions needed per feature.
- Swagger UI (`/api/docs`) is generated from decorators; it stays in sync with the
  code by construction.
- Testing is structured: unit tests mock DI providers; e2e tests use
  `Test.createTestingModule` with real adapters.

**Negative**
- NestJS's abstraction layer adds startup overhead (~50–100 ms) compared to raw
  Fastify. Acceptable for a CRM with < 1000 concurrent users.
- Decorator-heavy code requires engineers to understand the reflect-metadata
  contract. New TypeScript developers sometimes find it surprising.
- The framework is opinionated: deviating from its patterns (e.g., unconventional DI
  scopes) requires understanding internals.

**Neutral**
- NestJS wraps Express by default. Swapping to the Fastify adapter is possible but
  not needed for this workload.
- `@nestjs/platform-express` means Express middleware (helmet, etc.) works without
  adapter changes.
