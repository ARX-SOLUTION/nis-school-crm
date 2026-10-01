# Daily attendance oversight

**Status:** complete — frontier empty, ready to implement
**Owner:** Manager (single, one branch, Tashkent)
**Loop:** every working day at 18:00 `Asia/Tashkent`
**No new dependency** — `@nestjs/schedule ^4.1.2` is already in `apps/api/package.json`.

## Problem

The system has no timer. Nothing decides *when* anything should happen. Every loop
today is a person opening a page and clicking.

Attendance has the sharpest version of this. The pipeline already exists:

```
teacher marks bulk → attendance.recorded (ABSENT/LATE only) → Telegram alert to linked parents
```

What is missing is closing the loop. If a teacher never opens the form, **nothing
happens** — not one event fires, and the manager learns about it on Monday, from a
parent. Three cases go unnoticed today:

1. **Unmarked** — a class has zero attendance rows for today. Nobody was marked.
2. **Incomplete** — a class has rows, but fewer than its enrolled count. The teacher
   stopped halfway, or only marked the children standing in front of them.
3. **Absent / LATE** — already handled by the existing pipeline, per family. This
   workflow must not duplicate it.

## Vocabulary

- **working day** — a date in `school_calendar_days` with `kind = WORKING`.
- **enrolled count** — ACTIVE students assigned to a class (`students.class_id`,
  `students.status = ACTIVE`, `deleted_at IS NULL`).
- **unmarked class** — an active class with zero `AttendanceRecord` rows for today.
- **incomplete class** — an active class with `1 .. enrolled-1` rows for today.
- **responsible teacher** — always the class's homeroom teacher
  (`classes.class_teacher_id`), regardless of substitution.
- **the brief** — one Telegram message to the manager: what was found, and one question.
- **reminder** — a nudge to the responsible teacher. Delivered at most once.
- **run** — one execution of the loop, uniquely identified by `(ATTENDANCE_OVERSIGHT, run_date)`.

## Run — 18:00 `Asia/Tashkent`

`@Cron('0 18 * * *', { timeZone: 'Asia/Tashkent' })`

1. `today` = current date in `Asia/Tashkent`. Never derive it from UTC.
2. Read `school_calendar_days` for `today`.
   - `HOLIDAY` → exit, status `SKIPPED_HOLIDAY`.
   - no row → treat as working only if Mon–Fri; log one warning per day. The table
     is meant to be populated; an empty one is a misconfiguration, not a state to
     handle on every run.
   - `WORKING` → continue.
3. **Idempotency gate.** `INSERT INTO workflow_runs (kind, run_date, …) ON CONFLICT
   (kind, run_date) DO NOTHING`. Zero rows inserted → exit immediately. A restart
   mid-run, or a second API replica, must never produce two briefs.
4. Load every class where `is_active = true`, `deleted_at IS NULL`, and enrolled
   count ≥ 1.
5. For each, count `AttendanceRecord` rows for `classId` and `date = today`.
6. Classify: `0` → **unmarked**; `< enrolled` → **incomplete**; `= enrolled` → fine.
7. If **no findings** → status `NO_FINDINGS`, send nothing, exit.
8. Otherwise write one `workflow_reminders` row per class in status `PENDING`
   (`BLOCKED_NO_TELEGRAM` when the responsible teacher has no `telegram_chat_id`),
   persist the findings, set run status `AWAITING_DECISION`, and send the brief.

## The brief

One Telegram message. Decision-ready, not a dump. Language `uz` only.

```
🔔 Attendance — Mon 6 Oct

Unmarked: 2
  5-B — N. Karimov
  4-A — homeroom teacher not assigned
Incomplete: 1
  3-A — 18/24 marked
  ⚠ 3-A — N. Karimov covered by A. Raximov today

Send reminders?
```

Rules:
- Counts first, detail second, question last. The manager decides from this message
  alone, without opening anything.
- **No student names.** Absence is already communicated to families. This is about
  marking compliance, not about children.
- When there are no findings, **nothing is sent**. A daily "all good" is noise and it
  trains the manager to ignore the channel.
- A class with no homeroom teacher appears in the brief as a configuration gap and
  gets **no reminder row at all** — there is nobody to remind, and the fix is data,
  not a process.
- A substitution is **shown but does not move responsibility**. If the class's first
  lesson for today (`MIN(lesson_number)` among active `schedule_entries` matching
  the class and `day_of_week`) has a `CONFIRMED` `schedule_substitutions` row, the
  line names the substitute. `CANCELLED` substitutions are ignored.
- Empty result and failure are different messages. A failed run says it failed.

## Checkpoint

**Push right.** The run does every mechanical step before asking: identifies unmarked
and incomplete classes, resolves each responsible teacher, resolves same-day
substitutions, and renders both the brief and the reminder texts.

The manager is asked **once**, at the end, one question — *send reminders?*
Delivered as inline Telegram callback buttons.

| Button | `callback_data` | Effect |
|---|---|---|
| **ha** | `aov:yes:<runId>` | all `PENDING` reminders deliver now; run → `DISPATCHED` |
| **yo'q** | `aov:no:<runId>` | nothing delivers; run → `SKIPPED` |
| **kechqurun** | `aov:later:<runId>` | reminders deliver at 20:00 the same day; run → `DEFERRED` |

- Buttons are live for **12 hours**, then the run auto-closes as `EXPIRED` and
  nothing is sent. A decision made next morning is a decision about yesterday.
- **"yo'q" applies to that run only.** It is not remembered. The next day asks
  again. This is deliberate: a standing mute is a lost key, not a decision.
- **"kechqurun"** is a second `@Cron('0 20 * * *')` that picks up `DEFERRED` runs
  with `run_date = today`. Fires once, then the run is `DISPATCHED` or `EXPIRED`.
- Reminders deliver **at most once per `(teacher_id, run_date)`**, enforced by a
  unique index, not by application logic. There is no retry and no second chase.
- The manager is never asked to open the attendance page, to mark anything, or to
  identify a student.

## Failure handling

1. Reminder delivery and brief send each retry **3 times** with backoff.
2. On exhaustion the run is marked `FAILED` and **one** alert is sent to the manager
   chat. If Telegram is the thing that is broken, that alert fails too and is
   retried once — it is a different failure, not the same one.
3. `workflow_runs.status` is the durable record either way. `FAILED` and
   `NO_RECIPIENT` rows survive in the table; `GET /v1/health` already probes DB,
   Redis and RabbitMQ, so this adds no new health surface — it only makes the
   failure visible.
4. A run that cannot resolve a recipient writes `NO_RECIPIENT` and logs at `error`.
   It must never be silently skipped.

## Explicitly out of scope

- **The system never writes attendance.** It does not infer `ABSENT` for unmarked
  students and does not "help" by filling rows. A wrong `ABSENT` becomes a Telegram
  message to a parent and a permanent record in the student's history — not
  recoverable by a later correction.
- It does not use an attendance-rate formula. `attendance.service.getStats` counts
  `(PRESENT+LATE)` while `reports.getAttendanceReport` counts
  `(PRESENT+LATE+EXCUSED)` — this workflow only counts rows and is immune to the
  disagreement.
- It does not fix the substitution-notification gap (nobody tells the substitute
  teacher). That is a different loop.
- Class-having-no-teacher is reported, not repaired.

## Required changes

**A. Timezone.** No `TZ` anywhere in the stack. `AttendanceRecord.date` is
client-supplied (`apps/api/src/modules/attendance/entities/attendance.entity.ts:26`),
and the web app defaults it from `new Date().toISOString()` — UTC
(`apps/web/src/pages/AttendancePage.tsx:15`). In Tashkent, marking done after 19:00
lands on **tomorrow's** date, so the workflow would report a class as unmarked on a
day it was in fact marked. Fix: derive `date` server-side, or normalise on write.
Also set `TZ=Asia/Tashkent` on the api service in `docker-compose.prod.yml`.

**B. School calendar.** Nothing in `apps/api` knows about weekends or holidays.
New table:

```
school_calendar_days ( date PK, kind: WORKING|HOLIDAY, note )
```

**C. Run ledger.**

```
workflow_runs ( id uuid PK, kind, run_date date, status, findings jsonb,
                started_at, finished_at, decided_at,
                UNIQUE (kind, run_date) )
```

`status`: `RUNNING | AWAITING_DECISION | DEFERRED | DISPATCHED | SKIPPED |
EXPIRED | NO_FINDINGS | SKIPPED_HOLIDAY | NO_RECIPIENT | FAILED`

**D. Reminder ledger.**

```
workflow_reminders ( id uuid PK, run_id uuid FK, teacher_id uuid,
                     class_id uuid, run_date date,
                     reason: UNMARKED|INCOMPLETE,
                     status: PENDING|SENT|BLOCKED_NO_TELEGRAM|SKIPPED,
                     sent_at, telegram_message_id,
                     UNIQUE (teacher_id, run_date) )
```

**E. Configuration.** One env var, added to `apps/api/src/config/env.validation.ts`
via Joi: `NIS_MANAGER_CHAT_ID` (bigint, required in production).

This is the single operator recipient for **every** workflow in this repo — shared
with `announcement-broadcast.md` and `lead-followup.md`. One var, one person. Do not
add a per-loop variant; a var named after one loop invites a second recipient for a
second loop, and the operator then gets two briefs from two channels.

A single named recipient — not "everyone with ADMIN or MANAGER", and not "the
highest role present". A broadcast brief gets five identical messages and five
identical answers, or none. A role-derived recipient silently picks the technical
super-admin instead of the operational manager.

## Slices, in dependency order

1. **TZ fix** — server-side date derivation. Independent of everything below and
   fixable first; it is the one change that corrects existing wrong data.
2. `school_calendar_days` — migration, entity, `GET /v1/school-calendar`
   (`@Roles(ADMIN, MANAGER)`), `POST` to add a holiday.
3. `workflow_runs` + `workflow_reminders` — migrations, entities.
4. `AttendanceOversightService` — cron, classification, idempotency gate, failure handling.
5. Brief renderer + Telegram delivery.
6. `POST /v1/workflows/attendance-oversight/:runId/decide` +
   Telegram callback handler with the three buttons.
7. Reminder delivery worker, including the 20:00 deferred pass.
8. Tests: classification (0 / n-1 / n), idempotency across two runs on the same date,
   holiday skip, unlinked teacher → `BLOCKED_NO_TELEGRAM`, no-teacher class → no reminder row,
   the four-minute deferred pass.

## Sibling loops worth specifying next

Found while writing this, not in scope here:

- **Broadcast target is broken.** `notifications.service` publishes
  `ALL_PARENTS|ALL_TEACHERS|CLASS_PARENTS|ALL_USERS`; the Telegram consumer branches on
  `PARENTS|TEACHERS|CLASS` and falls through to `else` — so **every announcement reaches
  every active user**. This is the highest-severity defect found.
- **Notification opt-out does nothing.** `users.notification_prefs` is writable and read
  by nobody; the consumer sends unconditionally.
- **`GRADUATED` students exist in the enum with no code path.** They are counted in
  `students.total` but in neither `active` nor `archived`, so headcount is wrong.
- **Substitutions are recorded and never communicated.**
- **Monthly tuition collection** — the loop with real Excel dependency, blocked on
  wayfinder issues #38 and #39.
