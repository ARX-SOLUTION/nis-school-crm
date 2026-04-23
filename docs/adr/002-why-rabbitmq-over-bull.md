# ADR 002 — Use RabbitMQ instead of BullMQ for domain events

**Status:** Accepted
**Date:** 2026-04-23

## Context

The system needs to propagate domain events (mutations, auth events, student
enrollment, etc.) to two independent consumers:

1. **Audit logger** — writes an `AuditLog` row for every security-relevant event.
2. **Telegram notifier** — sends messages to users who have linked their accounts.

A third consumer (reporting / analytics) is a likely addition in later stages.

Two Redis-backed job-queue libraries are commonly used with NestJS:
**BullMQ** and **@nestjs/bull**. The team also evaluated **RabbitMQ** directly via
`amqp-connection-manager` (AMQP 0-9-1).

### Key characteristics compared

| Concern | BullMQ | RabbitMQ |
|---|---|---|
| Transport | Redis sorted sets | AMQP broker |
| Multi-consumer routing | One queue, one consumer type | Topic exchange → N queues → N independent consumers |
| Dead-letter handling | `failed` state in Redis; manual replay | DLX/DLQ per queue; nack requeues or routes to DLQ automatically |
| Message model | Compute jobs with input/output lifecycle | Immutable events (facts); publishers don't know about consumers |
| Persistence | Redis AOF/RDB | Durable queues + persistent messages survive broker restart |
| Operational tooling | Bull Board (UI add-on) | Built-in management UI (`:15672`) |
| Infrastructure | Redis (already required for auth) | Separate RabbitMQ container |

## Decision

Use **RabbitMQ 3.13** with a **topic exchange** (`nis.events`).

The exchange fans events to independent, durable queues:
- `audit.log` bound to `#` (all events)
- `notifications.telegram` bound to user-facing routing keys

A dead-letter exchange (`nis.dlx`) and dead-letter queue (`nis.dlq`) receive
messages that exhaust retries.

The in-process retry strategy (`DELAYS = [1s, 5s, 25s]`, up to 3 attempts) is
implemented in `EventBusService.consume`. Exhausted messages are nacked to the DLX.

### Why not BullMQ

BullMQ models **jobs**: units of retryable compute with a well-defined result
lifecycle (waiting → active → completed / failed). It excels when the job graph
**is** the domain model — e.g., video transcoding pipelines or email batches.

In this system the domain model is CRUD. Events are **side-effects**: "a student was
created" is an immutable fact, not a task to be retried. The consumers are
independent and loosely coupled — the audit logger must not block the Telegram
notifier, and neither should block the HTTP response.

RabbitMQ's topic exchange natively supports this pattern:
- Publishers emit events without knowing who consumes them.
- Adding a third consumer (e.g., analytics) requires declaring one new queue and
  binding it to the exchange — no publisher change.
- Per-queue DLQ semantics mean audit failures don't affect Telegram delivery.

BullMQ would require one queue per consumer type (to get independent retry counts),
and the "job" metaphor would mislead future engineers about the intent.

### Why not direct Redis pub/sub

Redis pub/sub is fire-and-forget: if a subscriber is offline when a message is
published, the message is lost. Audit records must be durable. RabbitMQ durable
queues persist messages through broker restarts.

## Consequences

**Positive**
- Fan-out to N consumers is a first-class AMQP feature; no code change to add a
  third consumer.
- DLQ provides a safe net: failed events are inspectable and replayable by an
  operator via the management UI.
- Publisher/consumer coupling is zero: neither side references the other.
- Durable queues + persistent messages survive a RabbitMQ restart without message
  loss.

**Negative**
- One extra infrastructure component (RabbitMQ container). Redis was already
  required; this adds ~200 MB RAM to the minimum spec.
- AMQP concepts (exchanges, bindings, routing keys, acks) have a steeper learning
  curve than BullMQ's simpler job API.
- The in-process retry approach (setTimeout + republish) loses in-flight retries if
  the process crashes between the `setTimeout` firing and the `publish` call. A
  proper delay queue (via RabbitMQ's per-message TTL + DLX) would be more robust but
  adds configuration complexity. Acceptable for MVP; documented as a known
  limitation.

**Neutral**
- The management UI on `:15672` is exposed in `docker-compose.dev.yml` for
  development. It is not exposed in `docker-compose.prod.yml`.
- Redis is still required for brute-force counters, Telegram link codes, and session
  metadata. RabbitMQ does not replace it.
