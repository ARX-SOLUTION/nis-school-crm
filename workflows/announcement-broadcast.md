# Announcement broadcast

**Status:** complete — frontier empty, ready to implement
**Owner:** Manager (single, one branch, Tashkent)
**Loop:** on demand, whenever the school has something to say — meeting, closure, deadline
**No new dependency** — `@nestjs/schedule ^4.1.2` is already in `apps/api/package.json:37`.

## Problem

`POST /v1/notifications/broadcast` looks finished and is wrong in four ways.

The publisher sends `event.target` straight from the DTO
(`apps/api/src/modules/notifications/notifications.service.ts:50`), whose values are
`ALL_USERS | ALL_PARENTS | ALL_TEACHERS | CLASS_PARENTS`
(`packages/shared/src/notifications.ts:7`). The consumer branches on
`'PARENTS' | 'TEACHERS' | 'CLASS'`
(`apps/api/src/modules/telegram/telegram-notification.consumer.ts:216`, `:220`,
`:224`). Four of four miss, control reaches the `else` at `:241`, and the blast goes to
**every active user**. An announcement meant for one class's parents reaches every parent
and every teacher in the school. This is the highest-severity defect in the system, and
the one existing test encodes the wrong vocabulary rather than catching it
(`apps/api/src/modules/telegram/telegram-notification.consumer.spec.ts:238`).

Three more failures ride along:

1. **The count is fiction.** `recipientCount` is computed before publishing
   (`notifications.service.ts:33`–`:43`); `CLASS_PARENTS` falls into the same `else` and
   counts *all* active users; the result is floored at `1` (`:63`). Nothing checks who was
   reached, because `handleBroadcastEvent` discards the `boolean` `sendToUser` returns
   (`telegram-notification.consumer.ts:253`).
2. **Opt-out does nothing.** `users.notification_prefs` is jsonb
   (`apps/api/src/modules/users/entities/user.entity.ts:54`), writable through an
   unvalidated body (`apps/api/src/modules/auth/auth.controller.ts:120`), read by nothing.
3. **Rate-limit drops are silent.** Telegram allows 20 messages per chat per hour
   (`apps/api/src/modules/telegram/services/telegram-rate-limit.service.ts:5`, `:6`) and
   over-quota messages are dropped with a `warn` and no record
   (`telegram-notification.consumer.ts:122`). A blast to all parents will hit this.

## Vocabulary

- **target** — the audience selector. Four values, and the **canonical set is
  `NOTIFICATION_TARGETS`**: `ALL_USERS`, `ALL_PARENTS`, `ALL_TEACHERS`,
  `CLASS_PARENTS`. Canonical because it is what the API accepts
  (`send-broadcast.dto.ts:21`), what the web UI offers (`SendBroadcastModal.tsx:15`), and
  what the history table labels (`NotificationLogsTable.tsx:25`).
- **avoid: `PARENTS`, `TEACHERS`, `CLASS`** — the consumer's private vocabulary. It exists
  nowhere else and is the bug.
- **batch** — one announcement composed once, previewed once, confirmed once. The unit of
  record for this loop.
- **candidate** — a user the target selects, before any filtering.
- **deliverable** — a candidate with a `telegram_chat_id`, not opted out, predicted inside
  its rate-limit window. The deliverable count is a promise made before sending; the
  delivered count is the ledger written afterwards. Never conflate them.
- **audience gap** — a candidate in the intended audience who will not hear it: no
  Telegram, opted out, or rate-limited. Gaps are counted, named, and visible.
- **the brief** — one Telegram message to the manager with the rendered text and the
  single yes/no question.

## Run — on demand, from the web modal or the API

1. Compose. `title`, `message`, `target`, and `classId` (required iff
   `target = CLASS_PARENTS`) validate exactly as today (`send-broadcast.dto.ts:11`–`:27`);
   `classId` with any other target is rejected.
2. **Preview.** `POST /v1/notifications/broadcast/preview` resolves the audience and
   writes a `broadcast_batches` row in `AWAITING_CONFIRMATION`, audience **frozen into
   `snapshot`**, exact text into `rendered_text`. Nothing is published. The response
   carries every count in step 4.
3. **Resolve the audience.** Canonical `target`, `users.deleted_at IS NULL`,
   `users.is_active = true`:
   - `ALL_PARENTS` → `role = PARENT`; `ALL_TEACHERS` → `role = TEACHER`.
   - `CLASS_PARENTS` → `parent_students` joined to `students.class_id = classId` where
     the student is `ACTIVE` (`student.entity.ts:50`) and the link is not soft-deleted.
     Siblings collapse to one row per parent (`parent-student.entity.ts:26`);
     `is_primary` (`:56`) is **not** a filter — a second parent is still a recipient.
   - `ALL_USERS` → every non-deleted active user, all roles, staff included.
4. **Count and partition.** One pass, each candidate landing in exactly one bucket, each
   written as a `broadcast_deliveries` row under `UNIQUE (batch_id, user_id)`:
   - `NO_TELEGRAM` — `telegram_chat_id IS NULL`. **Excluded from the send, kept in the
     intended-audience denominator, and named** when the audience is at most 30
     candidates. Above that only the count is named; a 200-line list is unreadable and
     the fix is a parent-link campaign.
   - `OPTED_OUT` — `notification_prefs->>'announcements' = false`. Excluded and counted,
     so the gap is visible at preview rather than a surprise.
   - `PREDICTED_RATE_LIMITED` — `peek(chatId) >= 20`, using a new read-only `peek()` on
     `TelegramRateLimitService`. Excluded and counted; the real outcome is written later
     by the consumer.
   - `PLANNED` → `DELIVERABLE_COUNT`, **the only number written to
     `notification_logs.recipient_count`** (`notifications.service.ts:63` stops flooring
     it) and the batch's `planned_count`.
5. **Deliver the brief.** One Telegram message: title, verbatim body, resolved class
   name, the four counts, one question.
6. **Wait for the answer** (see Checkpoint). On **ha**: batch → `DISPATCHING`, publish
   `broadcast.announcement` with the canonical `target` and the frozen `batchId`, keep
   the `NotificationLog` row.
7. **Deliver.** The consumer resolves recipients from the **same** predicates, now one
   shared `BroadcastAudienceResolver` so the two sides cannot drift again, and writes one
   outcome row per user instead of discarding the `boolean` from `sendToUser`
   (`telegram-notification.consumer.ts:115`).
8. **Reconcile.** Update the batch from the delivery ledger and send the operator a
   verdict, also served by `GET /v1/notifications/broadcast/:batchId`.

## The brief

```
📢 E'lon xabarnoma

Sarlavha: Ota-onalar majlisi
Matn:
Ertaga, 6 oktabr, soat 18:00 da maktabamizda ota-onalar majlisi bo'lib o'tadi.

Nishon (A) zali. Farzandingizni olib keling.

Nishat: 3-B sinf ota-onalari
Yetkaziladigan: 26
Telegram ulanmagan: 1
Rozilik bermagan: 1
Limitdan tashqarida: 1

[ ha ] [ yo'q ]
```

Rules: counts first, text verbatim, question last — the manager decides from this
message alone. `uz` only: the broadcast template discards its `locale` argument
(`apps/api/src/modules/telegram/templates/notification-templates.ts:137`), so family
templates are uz-only regardless of `user.language`, and this loop does not widen that.

## Checkpoint

**Push right.** Every mechanical step runs before the human is touched: validate, resolve
the audience, apply opt-out, predict rate-limit overflow, freeze the snapshot, render the
text, count. The manager is asked **once**, one yes/no question, as inline buttons.

| Button | `callback_data` | Effect |
|---|---|---|
| **ha** | `abc:yes:<batchId>` | publish now; batch → `DISPATCHING` |
| **yo'q** | `abc:no:<batchId>` | nothing published; batch → `CANCELLED` |
| **namoyish** | `abc:dry:<batchId>` | re-send `rendered_text` to the manager's own chat; the batch keeps waiting |

- Buttons live **12 hours**, then the batch auto-closes `EXPIRED` and nothing is
  published. A confirmation next morning is a confirmation about a stale audience.
- **"yo'q" applies to that batch only.** It is never remembered and never becomes a
  default. A standing mute is a lost key, not a decision.
- One publish per batch: the confirm handler issues `UPDATE broadcast_batches SET status =
  'DISPATCHING' WHERE id = $1 AND status = 'AWAITING_CONFIRMATION'` and publishes only
  when one row changed, so a double-tap or two replicas cannot double-blast.

## Failure handling

**Rate limiting.** A `RATE_LIMITED` outcome is never treated as failure. A
`@Cron('*/13 * * * *')` sweeper re-attempts each such row **at most once**, only after 5
minutes, and only if `peek()` says the window has room; otherwise it becomes
`RATE_LIMITED_FINAL` and is named in the verdict. One retry, never a storm — a 200-parent
blast queued behind a saturated hour is worse than a phone call.

**Verdicts**, written on the batch and returned by `GET /v1/notifications/broadcast/:batchId`:

- `COMPLETE` — `DELIVERED == planned_count`, no `BLOCKED_403`, no `FAILED`.
- `PARTIAL` — one delivered and one gap, **or** any `BLOCKED_403`, `FAILED` or
  `RATE_LIMITED_FINAL`. The only verdict that notifies the manager, naming the gaps for
  audiences under 30.
- `NONE` — `planned_count > 0`, `DELIVERED == 0`. Logged at `error`, one alert, no
  whole-blast retry. Re-sending into a Telegram outage is not a recovery.
- `NO_AUDIENCE` — `planned_count == 0`. Nothing is published; the brief already showed
  zero, so the manager was told before confirming.

**Blocked and unlinked are never invisible.** A 403 auto-unbinds `telegram_chat_id`
(`apps/api/src/modules/telegram/telegram-bot.service.ts:40`, `:50`), so the consumer writes
`BLOCKED_403` and the batch reports the affected families — the list of parents to call,
not a log line.

**Infrastructure.** `broadcast.announcement` keeps `maxRetries: 3` with DLQ
(`telegram-notification.consumer.ts:72`, `event-bus.service.ts:135`); a DLQ'd batch stays
`DISPATCHING` until a reconcile sweep (`@Cron('7 * * * *')`) sees no outstanding
deliveries and closes it `FAILED`. The batch row is the durable record in every case.

## Explicitly out of scope

- **Never fully autonomous.** A blast is irreversible; a message to a parent cannot be
  unsent.
- **No `ru` / `en`.** The templates ignore `user.language`
  (`notification-templates.ts:137`); widening languages is a separate loop.
- **Attendance, grade and payment notices are still not logged.** A real gap, a
  different loop; this one only makes broadcast delivery honest.
- **No soft delete on `notification_logs`.** It extends neither `BaseEntity` nor
  `deleted_at`
  (`apps/api/src/modules/notifications/entities/notification-log.entity.ts:5`, `:36`) and
  stays that way — an append-only record of what was sent. The new tables **do** extend
  `BaseEntity`.
- No digest, no batching, no parent-link campaign.

## Required changes

**A. Canonical target vocabulary — breaking.** `BroadcastAnnouncementEvent.target` is
typed `string` (`apps/api/src/common/events/contracts.ts:99`), which is why the mismatch
typechecks. Retype it as `NotificationTarget` from `@nis/shared`, delete the three literal
branches at `telegram-notification.consumer.ts:216`–`:239`, and branch on the canonical
values via the shared resolver. Fix the fixture at
`telegram-notification.consumer.spec.ts:238`. **`PARENTS`, `TEACHERS` and `CLASS` are
removed, not aliased** — an alias would preserve the exact bug.

**B. Shared audience resolver.** One `BroadcastAudienceResolver` used by preview,
publisher and consumer: takes `(target, classId)`, returns candidates, has no
`else`-default. `notifications.service.ts:33`–`:43` and
`telegram-notification.consumer.ts:214`–`:245` collapse into it.

**C. Batch and delivery ledgers.**

```
broadcast_batches ( id uuid PK, title, message, rendered_text text,
                    target, class_id uuid NULL, status, planned_count int,
                    no_telegram_count int, opted_out_count int,
                    predicted_rate_limited_count int, delivered_count int NULL,
                    gap_count int NULL, snapshot jsonb, created_by_user_id uuid,
                    expires_at, confirmed_at, finished_at,
                    created_at, updated_at, deleted_at )
status: AWAITING_CONFIRMATION | DISPATCHING | COMPLETE | PARTIAL | NONE
        | NO_AUDIENCE | CANCELLED | EXPIRED | FAILED
```

```
broadcast_deliveries ( id uuid PK, batch_id uuid FK, user_id uuid,
                        telegram_chat_id text NULL, status, attempts int default 0,
                        last_error text NULL, telegram_message_id text NULL,
                        delivered_at timestamptz NULL,
                        UNIQUE (batch_id, user_id) )
status: PLANNED | DELIVERED | RATE_LIMITED | RATE_LIMITED_FINAL
        | BLOCKED_403 | NO_TELEGRAM | OPTED_OUT | FAILED
```

Two migrations, `1789000000000-CreateBroadcastBatches.ts` and
`1789000001000-CreateBroadcastDeliveries.ts`, plus entities extending `BaseEntity`
(`base.entity.ts:8`).

**D. Opt-out.** Replace the unvalidated `Record<string, boolean>` body
(`auth.controller.ts:120`) with a `SetNotificationPrefsDto` whose only field is the
optional boolean `announcements`, and read it in the resolver. Opting out also suppresses
the attendance, grade and payment notices.

**E. Rate-limit prediction and drop accounting.** Add `peek(chatId): Promise<number>` to
`telegram-rate-limit.service.ts:21`, reading `tg:ratelimit:<chatId>` without
incrementing. Replace the `warn`-and-forget at `telegram-notification.consumer.ts:121`–
`:124` with a `RATE_LIMITED` delivery row, and add the `*/13` sweeper.

**F. Post-send verification.** The consumer writes one delivery row per candidate instead
of discarding the send result at `telegram-notification.consumer.ts:253`. Add
`GET /v1/notifications/broadcast/:batchId` (`@Roles(ADMIN, MANAGER, SUPER_ADMIN)`, as
`notifications.controller.ts:31`–`:34`). `recipient_count` is written once, at send time,
from `planned_count` (`notifications.service.ts:63`).

**G. Manager chat id.** `NIS_MANAGER_CHAT_ID` (bigint, required in production) in
`apps/api/src/config/env.validation.ts:43`. This is the single operator recipient for
every workflow in this repo, declared in `daily-attendance-oversight.md` — all three
specs share one var and one person. No second chat-id variable.

**H. Web surface.** `SendBroadcastModal` posts straight to `/notifications/broadcast`
and its button says "Xabarni yuborish" (`SendBroadcastModal.tsx:194`). Change it to
compose → preview (counts inline) → confirm. Parents have no web surface, so
`notification_prefs` gets no new form.

## Deploy note — in-flight messages at cutover

Slice 1 is a breaking vocabulary correction, so queued messages matter. Any
`broadcast.announcement` in `notifications.telegram` at deploy time carries
`target: 'ALL_PARENTS'`; if the **old** binary consumes it after the new code ships it
takes the `else` branch and blasts everyone — the bug outliving the fix.

1. Let the queue drain to depth 0 with the **old** binary still running. The consumer
   acks in milliseconds (`event-bus.service.ts:130`) and `prefetch(10)` at `:109` means
   depth 0 arrives quickly. If anything remains after 60 seconds, finish the old deploy
   instead — a stuck queue means a consumer that is not acking, its own incident.
2. Ship the new binary. Drain first, deploy second. Never purge: the same queue carries
   attendance, grade and payment notices, which are not recoverable.
3. This recalls nothing. A blast already fanned out stays sent, and the evidence is the
   `notification_logs` row whose `recipient_count` equals the whole active-user count.

## Slices, in dependency order

1. **A** — retype the contract, delete the dead branches, fix the fixture. Ships alone
   and immediately stops the over-blast.
2. **C** — the two migrations and entities. No behaviour change.
3. **B** — the shared resolver, exercised by a unit test, used by nothing else yet.
4. **D** — prefs validation plus the opt-out check in the resolver. Closes "opt-out does
   nothing" on its own.
5. **E** — `peek()`, the `RATE_LIMITED` row, the `*/13` sweeper.
6. **F** — preview endpoint, consumer delivery rows, reconcile cron, the `PARTIAL`
   notification, `GET /v1/notifications/broadcast/:batchId`, corrected `recipient_count`.
7. **H** — web preview-then-confirm modal plus the three-button callback handler, behind
   **G**.
8. **G** — `NIS_MANAGER_CHAT_ID`; one Joi line, no dependency, may land before 7.
9. Tests: each canonical target reaches only its own audience and an unknown target is a
   hard error, never a blast; preview buckets partition the candidates exactly once; a
   `NO_TELEGRAM` and an opted-out parent are each excluded and reported; a chat predicted
   over 20 becomes `RATE_LIMITED_FINAL` after one retry; a 403 writes `BLOCKED_403`;
   `PARTIAL` fires one operator notification; a double `ha` publishes once; a 12-hour-old
   batch `EXPIRED`s.

## Sibling loops worth specifying next

Found while writing this, not in scope here:

- **Empty `studentName` / `subjectName`** on attendance and grade events, so parent alerts
  read "Farzandingiz" and "Fan" (`notification-templates.ts:95`, `:108`).
- **`/grades` is broken SQL**, `/today` mis-maps `getDay()`, `/report` is a stub, and
  **`GRADUATED` students** have no code path.
- **Substitutions are recorded and never communicated.**
- **Monthly tuition collection** — the loop with the real Excel dependency, blocked on
  #38 and #39.
