# ADR 005 — Soft delete as the default delete strategy

**Status:** Accepted
**Date:** 2026-04-23

## Context

The CRM stores entities (users, students, classes, teachers) that have regulatory
and audit significance. A deleted student record may be referenced by historical
audit logs, enrollment records, or class rosters. Permanently deleting rows makes
those references dangle and makes it impossible to answer "who was in this class in
the 2025–2026 year?"

At the same time, some entities have no historical value and should be hard-deleted
to keep the DB tidy:
- **Refresh tokens** — once revoked or expired they are housekeeping data, not
  domain records. `RefreshTokenService.purgeExpired` hard-deletes them.
- **Telegram link codes** — one-time-use codes stored in Redis with a TTL; they
  expire automatically.

The team needed a consistent, low-ceremony approach to soft delete that works
across all domain entities without per-entity logic.

## Decision

All domain entities extend **`BaseEntity`** (defined in
`apps/api/src/database/entities/base.entity.ts`):

```typescript
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
```

TypeORM's `@DeleteDateColumn` activates the built-in soft-delete behaviour:

- `repository.softDelete(id)` sets `deleted_at = NOW()`.
- All `find*` and `QueryBuilder` calls automatically append `WHERE deleted_at IS
  NULL` unless `withDeleted: true` is passed explicitly.
- `repository.restore(id)` sets `deleted_at = NULL`.

Hard delete is reserved for non-domain data only (refresh tokens, expired codes).

### Indexes

Partial indexes are used where `deleted_at IS NULL` rows are the hot path and the
deleted set grows over time. Example from the `students` entity:

```
@Index('idx_students_class', ['classId'], { where: '"deleted_at" IS NULL' })
```

This keeps the index small for the common case without excluding the full table
scan used in historical queries.

## Consequences

**Positive**
- Audit trail is preserved: deleted records remain queryable by admins (`withDeleted: true`).
- Foreign key references from audit logs to deleted entities remain valid; no
  dangling UUIDs.
- Recovery from accidental deletion is a single `restore` call; no point-in-time
  restore required.
- TypeORM handles the `WHERE deleted_at IS NULL` filter globally; no per-query
  boilerplate.
- The `deletedAt` timestamp itself is an audit field: when was this entity removed,
  and (combined with audit logs) by whom.

**Negative**
- Tables grow over time as deleted rows accumulate. For the MVP scale (< 10,000
  students over the school's lifetime) this is not a concern. A periodic archival
  job would be needed at much larger scale.
- Queries that must include deleted records must explicitly opt in with
  `withDeleted: true`. Engineers unfamiliar with TypeORM's soft-delete behaviour
  may be surprised when a freshly deleted record "disappears."
- Unique constraints (e.g., `student_code`) apply to both active and deleted rows in
  the default TypeORM implementation. Where a deleted code should be reusable, a
  partial unique index (`WHERE deleted_at IS NULL`) is required. This is handled
  per-entity as needed.

**Neutral**
- `BaseEntity` does not include a `version` column for optimistic locking. If
  concurrent edit conflicts become a concern in future stages, a `@VersionColumn`
  can be added to `BaseEntity` without a migration on entities that don't need it.
- Refresh tokens extend `BaseEntity` (for `id`, `createdAt`, `updatedAt`) but their
  `deletedAt` is never used — they are hard-deleted by the purge job. The column
  exists but is always `null`. This is a minor inconsistency; separating a
  `TimestampedEntity` base (without `deletedAt`) was considered but rejected as
  over-engineering for MVP.
