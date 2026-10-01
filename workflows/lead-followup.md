# Lead follow-up

**Status:** complete — frontier empty, ready to implement
**Owner:** Manager (single branch, Tashkent)
**Loop:** every working day, 09:00 `Asia/Tashkent`
**No new dependency** — `@nestjs/schedule ^4.1.2` is already in `apps/api/package.json:37`.
**Prerequisite:** `workflow_runs` and `school_calendar_days` come from
`workflows/daily-attendance-oversight.md` slices 2–3. Reuse, do not recreate.

## Problem

The lead pipeline is a Kanban board that means whatever one person's discipline makes it
mean.

1. **Nothing notices a lead going quiet.** No timer exists (`NOTES.md:38-43`), and the event
   bus cannot supply one: `nis.events` has no `lead.*` event
   (`apps/api/src/common/events/contracts.ts:3-9`). Staleness is a function of *time*, not
   change, so nothing event-driven emits it.
2. **The stage is free text.** `UpdateLeadStageDto.stage` is only `@IsIn(LEAD_STAGES)`
   (`apps/api/src/modules/leads/dto/update-lead-stage.dto.ts:7`) and `LeadsService.updateStage`
   assigns it unconditionally (`apps/api/src/modules/leads/leads.service.ts:89`). `ENROLLED → NEW` is a 200.
3. **Nothing measures time-in-stage.** `BaseEntity.updatedAt` is a `@UpdateDateColumn`
   (`apps/api/src/database/entities/base.entity.ts:15`), refreshed on every save —
   including the note append inside `updateStage`
   (`apps/api/src/modules/leads/leads.service.ts:91-94`). An observation typed onto a stale
   lead restarts its clock.
4. **`LOST` is not terminal, so the funnel can lie.** `convertToStudent` guards only on
   `lead.convertedStudentId` (`apps/api/src/modules/leads/leads.service.ts:108-110`), so a
   lead marked `LOST` weeks ago converts today
   (`apps/api/src/modules/leads/leads.service.ts:144-146`). `getStats` reports
   `conversionRate = round(ENROLLED / total * 100)`
   (`apps/api/src/modules/leads/leads.service.ts:182`) over a denominator containing every
   `LOST` row, and a numerator a dead lead can still join.

There is no outbound channel to a lead and this spec does not pretend otherwise: `Lead`
carries a phone (`apps/api/src/modules/leads/entities/lead.entity.ts:12-13`), no chat id,
no e-mail, and `source = 'TELEGRAM'`
(`apps/api/src/modules/leads/entities/lead.entity.ts:21-22`) labels how the enquiry arrived
rather than linking an identity. The action this loop produces is a **phone call by the
manager, recorded afterwards**.

## Vocabulary

- **working day** — a date in `school_calendar_days` with `kind = WORKING`.
- **stage age** — whole days between `leads.stage_entered_at` and now, floored, in
  `Asia/Tashkent`.
- **threshold** — the per-stage day count at or above which a lead is stale.
- **stale** — stage age ≥ threshold, a pure time fact from `stage_entered_at` alone.
- **stalled** — stale **and** no `last_contacted_at` at or after the current
  `stage_entered_at`. A strict subset of stale, and the distinction is causal: *stale* means a
  decision is overdue, *stalled* means nobody picked up the phone.
- **overdue** — stale at 2× or more the threshold.
- **flag** — one `(lead, stage)` pair recorded as having appeared in a brief.
- **brief** — one Telegram message: which leads need a decision, with phone numbers.
- **run** — one execution, keyed `(LEAD_FOLLOWUP, run_date)`.
- **reopen** — the one deliberate, audited path out of `LOST`.

**Terms to avoid.** *Nurture, warming, outreach sequence, funnel health score, pipeline
velocity* — three imply a channel this system lacks. Say **stage age**, **stalled**.

## Transition table

Six stages (`packages/shared/src/leads.ts:1-8`). Forward moves skip freely — a walk-in
books a trial without a prior call. Backward moves never.

| From | Allowed to |
|---|---|
| `NEW` | `CONTACTED`, `TRIAL_SCHEDULED`, `CONTRACT_SENT`, `LOST` |
| `CONTACTED` | `TRIAL_SCHEDULED`, `CONTRACT_SENT`, `LOST` |
| `TRIAL_SCHEDULED` | `CONTRACT_SENT`, `LOST` |
| `CONTRACT_SENT` | `LOST` |
| `ENROLLED` | nothing — terminal |
| `LOST` | nothing — terminal; exits only via **reopen** |
| any | `ENROLLED` — never via `PATCH /:id/stage`, only via `POST /:id/convert` |
| any | itself — idempotent no-op; does not reset `stage_entered_at` |

**An illegal transition is rejected with `409 Conflict`**, body
`{ code: 'ILLEGAL_LEAD_TRANSITION', from, to, allowedNextStages[] }`. Accept-and-flag would
preserve the lying funnel this loop exists to remove; a 409 naming the legal set is
self-correcting on a drag surface
(`apps/web/src/features/leads/components/LeadKanbanBoard.tsx:91-98`).

`PATCH /:id/stage` targeting `ENROLLED` is rejected the same way even when otherwise
forward-legal: enrolment with no `Student` row behind it is the lie from point 4. `ENROLLED`
is set only by `convertToStudent` (`apps/api/src/modules/leads/leads.service.ts:144`).

**Reopen** is the deliberate, audited exit from `LOST`. `POST /v1/leads/:id/reopen`,
`@Roles(ADMIN, MANAGER)`, body `{ toStage: LeadStage, reason: string (min 10 chars) }`,
`toStage` default `CONTACTED`. One transaction also writes an `AuditLog` row — `action =
'lead.reopened'`, `old_data = { stage, converted_student_id }`, `new_data = { stage,
reason }` — via `AuditService.record`
(`apps/api/src/modules/audit/audit.service.ts:15`), not via `AuditInterceptor`, which
hard-codes `oldData: null` (`apps/api/src/modules/audit/audit.interceptor.ts:54`). It clears
every `lead_followup_flags` row for the lead, and if the audit write fails so does the reopen.

## Run — 09:00 `Asia/Tashkent`

`@Cron('0 9 * * *', { timeZone: 'Asia/Tashkent' })`

1. `today` = current date in `Asia/Tashkent`, never derived from UTC.
2. Read `school_calendar_days` for `today`. `HOLIDAY` → exit `SKIPPED_HOLIDAY`. No row →
   proceed on Mon–Fri only, logging one warning per day.
3. **Idempotency gate.** `INSERT INTO workflow_runs (kind, run_date, …) ON CONFLICT (kind,
   run_date) DO NOTHING`; zero rows → exit.
4. Load every lead with `deleted_at IS NULL` and `stage NOT IN ('ENROLLED','LOST')`.
5. `ageDays = floor((now() - stage_entered_at) / 1 day)` against
   `LEAD_STAGE_THRESHOLD_DAYS` (F below).
6. Classify: `ageDays >= 2 × threshold` → **overdue**; `>= threshold` → **stale**; then
   `last_contacted_at IS NULL OR < stage_entered_at` → **stalled**.
7. Suppress: drop any pair whose flag row exists, whose `flag_stage_entered_at` equals the
   lead's **current** `stage_entered_at`, and whose `last_flagged_at` is newer than 14 days.
8. No findings → `NO_FINDINGS`; send nothing.
9. Otherwise upsert one `lead_followup_flags` row per surviving pair, persist `findings` on
   the run, set `AWAITING_DECISION`, and send the brief.

### Thresholds

| Stage | Days |
|---|---|
| `NEW` | 2 — costliest leak |
| `CONTACTED` | 5 — days before a family answers |
| `TRIAL_SCHEDULED` | 3 — the trial happened |
| `CONTRACT_SENT` | 7 — runs on the family's schedule |
| `ENROLLED`, `LOST` | terminal, never stale |

### Why `updated_at` cannot serve, and what replaces it

Two columns replace it, maintained in the service layer: a trigger cannot tell a stage
change from a coincidental write.

- `stage_entered_at timestamptz NOT NULL DEFAULT now()` — set in `create`
  (`apps/api/src/modules/leads/leads.service.ts:39-52`) and `updateStage`
  (`apps/api/src/modules/leads/leads.service.ts:83-98`) **only when `dto.stage !==
  lead.stage`**. Index `idx_leads_stage_entered_at (stage, stage_entered_at)`.
- `last_contacted_at timestamptz NULL` — written only by `POST /v1/leads/:id/contact`.

Backfill both from `created_at`. Every pre-existing lead then reads as stale on the first
run — the intent, not a bug: the backlog is real and today invisible.
## The brief

One Telegram message, `uz` only, decision-ready. Phone numbers are included: a brief that
forces a page open is a task, not a brief.

```
🔔 Lidlar — 6 oktyabr

Ustuvor qaror: 2 ta

⏰ 14 kun — Sinov darsi
  A. Raximov · +998 91 555 12 34 · gapirilmagan

⏰ 9 kun — Yangi
  N. Karimova · +998 90 123 45 67 · 3 kun oldin gapirilgan

Jami 2 ta. Ketma-ket bog'lang va natijani CRM'ga yozing.
```

- Sorted by stage age descending; the oldest is closest to being lost.
- Contact line is `gapirilmagan` when stalled, `N kun oldin gapirilgan` otherwise, which
  separates "call them" from "decide on them".
- At most **20 leads**; beyond that, the 20 oldest and a count of the rest.
- No findings → **nothing is sent**. A daily "all clear" trains the manager to ignore the
  channel.
- No funnel percentages: `getStats` counts `LOST` in the denominator
  (`apps/api/src/modules/leads/leads.service.ts:171-182`), so a rate beside a call list is
  not meaningful.

## Checkpoint

**Push right.** The run does every mechanical step before asking: classifies every open
lead, separates stalled from merely stale, suppresses flagged pairs, resolves phone
numbers, orders by age and renders the brief. The manager performs zero lookups. Asked
**once**, at the end: *acknowledged*.

| Button | `callback_data` | Effect |
|---|---|---|
| **ko'rib chiqdim** | `lfu:ack:<runId>` | run → `ACKNOWLEDGED`; flag timestamps refreshed |
| **yana yubor** | `lfu:again:<runId>` | brief re-sent once, immediately; run → `ACKNOWLEDGED` |
| **kechqurun** | `lfu:evening:<runId>` | brief re-sent at 18:00 same day; run → `DEFERRED` |
**No button dispatches anything to a lead.** There is no channel, and a button labelled
"send" would lie about what the system can do. The buttons record the manager's disposition
of the list; the work is a phone call, a stage change, and `POST /:id/contact`.

- Live **12 hours**, then the run auto-closes `EXPIRED`. An acknowledgement tomorrow is an
  acknowledgement of yesterday.
- **"ko'rib chiqdim" applies to that run only.** Not remembered.
- `kechqurun` is a second `@Cron('0 18 * * *')` picking up `DEFERRED` runs with
  `run_date = today`. Fires once, then `ACKNOWLEDGED` or `EXPIRED`.
- Callback handling is net-new: `TelegramUpdate` registers only `@Start` and three
  `@Command`s (`apps/api/src/modules/telegram/telegram.update.ts:29-104`); no `Action`
  handler or `callback_query` exists in `apps/api/src/modules/telegram/`.

**Repeat suppression — per lead per stage, not per run.** In `lead_followup_flags`, keyed
`UNIQUE (lead_id, stage)`, holding `flag_stage_entered_at` (snapshot of `stage_entered_at`
when flagged), `last_flagged_at`, `flag_count`. A pair is suppressed when its snapshot
equals the lead's **current** `stage_entered_at` and `last_flagged_at` is newer than 14
days. A lead that moves out and comes back has a newer `stage_entered_at`, so the snapshot
no longer matches and it is listed again at once; one that sits still is re-listed at most
every 14 days. Enforced by the unique index, not application logic.

## Failure handling

1. Brief send retries **3 times** with backoff. On exhaustion the run is `FAILED` and
   **one** alert goes to the manager chat; if Telegram is what broke, that alert fails too
   and is retried once — a different failure.
2. `TelegramBotService.isEnabled()` false
   (`apps/api/src/modules/telegram/telegram-bot.service.ts:28-30`) → `NO_RECIPIENT`, logged
   at `error`.
3. `sendMarkdown` clears the chat binding on a 403 or block
   (`apps/api/src/modules/telegram/telegram-bot.service.ts:40-43`), so a run landing after
   is `NO_RECIPIENT`, not `FAILED`.
4. `workflow_runs` is the durable record in every case. `GET /v1/health`
   (`apps/api/src/modules/health/health.controller.ts:14-24`) already probes DB, Redis and
   RabbitMQ, so no new health surface.
5. Classification, suppression and the flag upsert share one transaction, so a crash cannot
   flag a lead that was never briefed.

## Explicitly out of scope

- **The system never contacts a lead.** No SMS, no Telegram, no e-mail. `Lead` has no chat
  id and no e-mail (`apps/api/src/modules/leads/entities/lead.entity.ts:8-32`); an outbound
  channel is its own loop.
- **It never moves a lead on its own.** No inferred stage, no scoring: a stage is a human
  statement about a conversation.
- **It does not fix the conversion formula.** Terminal `LOST` and convert-only `ENROLLED`
  make the *inputs* honest; whether `LOST` belongs in the denominator is a reporting
  decision, left where it is.
- **It does not chase `LOST` leads**, and touches no parent, student or family template.
## Required changes

**A. Time-in-stage columns.** `stage_entered_at`, `last_contacted_at` on `leads`, indexed
`(stage, stage_entered_at)`. Entity
`apps/api/src/modules/leads/entities/lead.entity.ts:8-32`, created by
`apps/api/src/database/migrations/1745366470000-CreateSchoolifyModules.ts:99-116`. Write
points and backfill per *Why `updated_at` cannot serve*.

**B. Transition guard.** Replace the bare assignment at
`apps/api/src/modules/leads/leads.service.ts:89` with a table lookup; reject with
`ConflictException` and `allowedNextStages`. `LeadsModule` must inject
`DataSource` as `apps/api/src/modules/students/students.service.ts:29` does and wrap the
read-modify-write in a transaction (`:172-211`, `:306-312`).

**C. Convert guard.** `convertToStudent` rejects when `lead.stage === 'LOST'`
(`apps/api/src/modules/leads/leads.service.ts:108-110`) and sets `ENROLLED` only at `:144`.

**D. Reopen endpoint.** `POST /v1/leads/:id/reopen` on
`apps/api/src/modules/leads/leads.controller.ts:26`, `@Roles(ADMIN, MANAGER)` as `:57-62`.
DTO in `dto/`, mirroring
`apps/api/src/modules/leads/dto/update-lead-stage.dto.ts:5-13`.

**E. Contact endpoint.** `POST /v1/leads/:id/contact` sets `last_contacted_at` and appends to
`notes` in the existing `[uz-UZ date]: note` format
(`apps/api/src/modules/leads/leads.service.ts:92`). It does **not** move the stage.

**F. Flags table and thresholds.**

```
lead_followup_flags ( id uuid PK, lead_id uuid FK → leads ON DELETE CASCADE,
                      stage varchar(30), flag_stage_entered_at timestamptz,
                      last_flagged_at timestamptz NOT NULL,
                      flag_count int NOT NULL DEFAULT 1,
                      UNIQUE (lead_id, stage) )
```

Plus `LEAD_STAGE_THRESHOLD_DAYS: Record<LeadStage, number | null>` and
`LEAD_STAGE_TRANSITIONS` in `packages/shared/src/leads.ts` beside `LEAD_STAGES` (`:1-8`),
so web and API cannot disagree. `null` means terminal.

**G. Scheduler and configuration.** Register `ScheduleModule.forRoot()` from
`@nestjs/schedule` in `apps/api/src/app.module.ts:38-71`. **Alias the import** —
`ScheduleModule` is already taken at `apps/api/src/app.module.ts:23` and `:58` by the
school timetable module. Add `NIS_MANAGER_CHAT_ID` (bigint, required in production) to
`apps/api/src/config/env.validation.ts` beside the block at `:60-66`. This is the single
operator recipient for **every** workflow in this repo — declared in
`daily-attendance-oversight.md`, shared with `announcement-broadcast.md`. One var, one
person; no per-loop variant. A role-derived recipient silently picks the technical
super-admin, not the operational manager.

**H. Shared contract and board legality.** `stageEnteredAt` on `LeadDto`
(`packages/shared/src/leads.ts:22-34`), plus `ReopenLeadRequestDto` and
`ContactLeadRequestDto`. `LeadKanbanBoard.handleDrop`
(`apps/web/src/features/leads/components/LeadKanbanBoard.tsx:91-98`) consults
`LEAD_STAGE_TRANSITIONS` and refuses an illegal target without firing the mutation;
`LeadsPage.handleStageChange` (`apps/web/src/pages/LeadsPage.tsx:57-63`) catches the 409
and shows `allowedNextStages` as an error banner, not the success banner on `:61`.

## Slices, in dependency order

1. **Time-in-stage columns** — migration, entity, backfill, index,
   `LEAD_STAGE_THRESHOLD_DAYS`. Independently shippable: the board can show age.
2. **Transition + convert guards** — `409`, tests for all 36 pairs.
3. **`POST /:id/contact`** — endpoint, DTO, note append.
4. **`POST /:id/reopen`** — endpoint, in-transaction audit row, flag-row delete.
5. **`lead_followup_flags`** — migration, entity, unique index.
6. **`LeadFollowupService`** — cron, classification, suppression, idempotency gate,
   failure handling. **Depends on `workflow_runs` and `school_calendar_days` from
   `workflows/daily-attendance-oversight.md` slices 3 and 2** — if this loop ships first it
   creates both and the attendance loop reuses them.
7. **Brief renderer + Telegram delivery**, with the 20-lead cap.
8. **Callback handler** — three buttons, 12-hour expiry, 18:00 deferred pass.
9. **`@nis/shared` contract + board legality** — `LEAD_STAGE_TRANSITIONS`, illegal-drop
   refusal, 409 banner.
10. **Tests** — all 36 ordered transition pairs; `stage_entered_at` unchanged on a
    same-stage PATCH and a note-only PATCH; suppression on re-entry vs. at 14 days;
    terminal stages never loaded; holiday skip; two runs on one date produce one brief; a
    `LOST` lead cannot convert; reopen writes one audit row and clears flags.

## Sibling loops worth specifying next

- **New-student onboarding chain.** This loop ends at `ENROLLED`; class assignment, parent
  invite, parent Telegram link and first payment are multi-day, multi-actor and unowned.
- **Outbound contact channel.** SMS is declared in `NOTIFICATION_CHANNELS` and never
  written to, and there is no e-mail surface, so every admissions loop is capped at "a human
  picks up a phone".