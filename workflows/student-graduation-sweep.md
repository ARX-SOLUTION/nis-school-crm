# Student graduation sweep

**Status:** complete — frontier empty, ready to implement
**Owner:** Manager (one branch, Tashkent)
**Loop:** daily at 11:00 `Asia/Tashkent`, working only while an unswept academic year has ended
**No new dependency** — `@nestjs/schedule ^4.1.2` is already in `apps/api/package.json:37`.
**Prerequisites:** `workflow_runs` and `school_calendar_days` come from
`workflows/daily-attendance-oversight.md` slices 2–3 — reuse, do not recreate; if this loop ships
first it creates both for the others.

## Problem

`StudentStatus.GRADUATED` exists and **no code path can produce it.** The five write sites for
`students.status` are the column default
(`apps/api/src/modules/students/entities/student.entity.ts:51`), `create()`
(`apps/api/src/modules/students/students.service.ts:64`), `archive()`
(`students.service.ts:232`), lead conversion
(`apps/api/src/modules/leads/leads.service.ts:136`) and the enum creation in the migration
(`apps/api/src/database/migrations/1745366420000-CreateClassesAndStudents.ts:8`). The only
`INACTIVE` writer is `archive()`, so `?status=GRADUATED` is a valid filter that always returns
empty and staff conclude the student does not exist.

Every consumer of headcount and money filters on `ACTIVE` — debtors
(`apps/api/src/modules/billing/billing.service.ts:174-178`), expected revenue
(`billing.service.ts:152-154`), the finance report
(`apps/api/src/modules/reports/reports.service.ts:225-228`), class capacity
(`students.service.ts:333`). So graduating is **financially neutral**, exactly like archiving: the
child stays chargeable and keeps a seat until somebody archives them, which records a lie —
`left_reason` then says they withdrew. The write paths that *should* refuse a graduated student
check existence only; *out of scope* lists the five sites.

Two things hide the absence. `students.total` is **arithmetic, not `COUNT(*)`** — `active +
archived` at `apps/api/src/modules/dashboard/dashboard.service.ts:65`, fed by two filtered counts at
`:47-48` — so a `GRADUATED` row falls out of all four numbers while `active + archived === total`
still holds, and `newStudentsLast7Days` filters on `enrolled_at` alone (`:128-135`). And nothing
detects that a year ended: `classes.academic_year` is a `varchar(10)` uniqueness key and label
(`apps/api/src/modules/classes/entities/class.entity.ts:16-17`).

## Vocabulary

- **academic year** — one row in `academic_years` (`academic_year` PK `YYYY-YYYY`, `starts_on`,
  `ends_on`): the single source of truth for when a year finished.
- **terminal grade level** — `grade_level = 11`, the maximum the create DTO accepts
  (`apps/api/src/modules/students/dto/create-student.dto.ts:50`).
- **ended year** — an `academic_years` row where `ends_on < today` (Asia/Tashkent).
- **unswept year** — an ended year with `swept_at IS NULL`.
- **candidate** — `status = ACTIVE`, `deleted_at IS NULL`, `class_id IS NOT NULL`, joined to a class
  whose `academic_year` is an ended year and whose `grade_level = 11`. The whole predicate; nothing
  is inferred from attendance.
- **orphan** — `ACTIVE`, `deleted_at IS NULL`, `grade_level = 11`, `class_id IS NULL`. **Never a
  candidate**: with no class there is no `academic_year` to read, so the sweep cannot tell a
  year-11 finisher from a year-4 one.
- **the brief** — one Telegram message: candidates grouped by class, then one question.
- **run** — one execution, keyed `(GRADUATION_SWEEP, run_date)`.
- **graduation** — the terminal transition `ACTIVE → GRADUATED`.

**Terms to avoid.** *Promotion, rollover, advancement, ceremony, alumni* — each implies a term model
or an alumni surface this repo has none of. Say **graduation**, **ended year**, **candidate**.

## Run — 11:00 `Asia/Tashkent`

`@Cron('0 11 * * *', { timeZone: 'Asia/Tashkent' })`

11:00 sits in the gap between the two existing briefs: leads at 09:00 (`workflows/lead-followup.md:96`)
and attendance at 18:00 (`workflows/daily-attendance-oversight.md:42`), which also carries the
deferred pass. One manager, one phone — a third loop must land on neither hour.

1. `today` = current date in `Asia/Tashkent`, never derived from UTC.
2. Read `school_calendar_days` for `today`: `HOLIDAY` → exit `SKIPPED_HOLIDAY`, no row → Mon–Fri
   only, one warning logged per day.
3. **Idempotency gate.** `INSERT INTO workflow_runs (kind, run_date, …) ON CONFLICT (kind,
   run_date) DO NOTHING`; zero rows → exit. One brief per day at any replica count.
4. Load every **ended, unswept** year. None → `NO_ENDED_YEAR`, send nothing, exit: a sweep with
   nothing to sweep must not say so every morning. **The boundary comes from `ends_on`, never from
   `school_calendar_days`**, a day kind and not a term.
5. Load candidates by the *Vocabulary* predicate, projected as `{ studentId, studentCode,
   firstName, lastName, className, gradeLevel, academicYear }`.
6. **Freeze the list into `workflow_runs.findings`** as jsonb with the rendered brief alongside: the
   list the manager sees and the list the button graduates are the same frozen array.
7. Split out **orphans** — counted, never in the list. Zero candidates *and* zero orphans →
   `academic_years.swept_at = now()`, `NO_CANDIDATES`, send nothing, exit.
8. Otherwise `AWAITING_DECISION` and send the brief — grouped by class, orphan count and review
   link last.

## The brief

`uz` only. Names are included, the opposite of the attendance brief: deciding that a child has left
the school is not an adult matter.

```
🎓 Bitiruvchilar — 2026-2027

O'quvchi yili tugadi. Hali faol qolgan o'quvchilar: 14

11-"A" sinf — 6
  N. Karimov · NIS-2026-00042
  A. Raximova · NIS-2026-00051
  +4

11-"B" sinf — 8
  +8

Sinfi yo'q, 11-sinfda, lekin o'quvchi sinfi berilmagan: 2
  Ro'yxatni ko'rish va biriktirish: /students/graduation?year=2026-2027

[ ha ] [ yo'q ] [ ro'yxat ]
```

- Grouped by class, `+n` past ten names per class: a forty-student graduating year is four classes,
  not forty lines. The orphan line names a **data** problem — nothing records their year.
- `ha` graduates **exactly the frozen list**; to deselect somebody, open the review page, whose link
  the brief carries. Zero candidates → nothing is sent, since a morning "all clear" trains the
  manager to ignore the channel. A failed run says so.

## Checkpoint

**Push right.** The run gates on idempotency, resolves ended years, loads and freezes the candidate
list, separates orphans, groups by class, counts and renders the brief before anyone is asked. The
manager does zero lookups.

Asked **once**, at the end — *ha — bitiruvchi deb?* — as inline buttons.

| Button | `callback_data` | Effect |
|---|---|---|
| **ha** | `grd:yes:<runId>` | `POST /v1/students/graduate` with the frozen ids; run → `DISPATCHED` |
| **yo'q** | `grd:no:<runId>` | nothing graduates; run → `SKIPPED`; the year stays unswept |
| **ro'yxat** | `grd:list:<runId>` | full list re-sent once to the manager's chat; run keeps waiting |

- **The system never sets `GRADUATED` on its own.** No cron, no inference, no "the year ended
  therefore they graduated" — assembling the list and asking once is the whole job.
- Buttons live **12 hours**, then the run auto-closes `EXPIRED` and nothing graduates; the next day's
  cron re-asks. **"yo'q" applies to that run only** and never sets `swept_at`: only a completed
  graduation closes the year.

### Endpoint — `POST /v1/students/graduate`

`@Roles(ADMIN, MANAGER)`. Body `GraduateStudentsDto`: `{ academicYear (YYYY-YYYY), studentIds
(uuid[], 1..200), reason (@MaxLength(255)), graduatedAt? (ISO date, default today Asia/Tashkent) }`.

**It takes a body, and that is deliberate.** `sanitizePayload(undefined)` returns `null`
(`apps/api/src/common/utils/sanitize-payload.ts:19-30`), so a bodyless `PATCH /students/:id/graduate`
persists `new_data = NULL` — the log records that something happened without recording what was
decided. The body carries the reason and the ids, which is what the audit row must preserve.

**`reason` is capped at 255, not 500.** `ArchiveStudentDto` validates `@MaxLength(500)`
(`apps/api/src/modules/students/dto/archive-student.dto.ts:7`) and writes one string into
`students.left_reason` (500) *and* `student_class_history.reason` (255)
(`apps/api/src/modules/students/entities/student-class-history.entity.ts:38-39`) — a latent
truncation bug `GraduateStudentsDto` must not inherit.

**The transaction.** One `this.dataSource.transaction(...)`, as `archive()` does
(`students.service.ts:215`). Per student, three guards collect into `skipped` rather than throw:
absent → `NOT_FOUND`; `status !== ACTIVE` → `ALREADY_GRADUATED`; `grade_level !== 11` →
`NOT_TERMINAL_GRADE`. Then three writes:

| Target | Writes |
|---|---|
| `students` | `status = 'GRADUATED'`, `graduated_at`, `graduated_academic_year`, `class_id = NULL`, `left_at = graduated_at`, `left_reason = :reason` |
| `student_class_history` | closes open rows for the current class: `removed_at`, `reason`, mirroring `students.service.ts:226-229` |
| `club_enrollments` | `status = 'DROPPED'`, `dropped_at`, `drop_reason` where `status IN ('ACTIVE','PAUSED')`; `PAUSED` is declared (`packages/shared/src/clubs.ts:23`) and never set, and `DROPPED` rows are untouched |

No event is published and nothing is soft-deleted, same as `archive()`; the parents are not told.
Response: `{ academicYear, graduated: StudentResponseDto[], skipped: [{ studentId, code }] }` — a
re-post returns the already-graduated ids in `skipped` rather than erroring.

**Idempotency, three layers, none of it application logic.** `workflow_runs UNIQUE (kind,
run_date)` gives one sweep per day; the `status !== ACTIVE` guard makes a re-post a no-op; and
`swept_at`, set in the same transaction as the graduate call, stops the year being re-swept.

### Repeat suppression — per student per academic year

Key: `(student_id, graduated_academic_year)`, stored as two columns on `students` and nothing else.
A graduated student is excluded from every later sweep by `status = ACTIVE` in the candidate
predicate, and `graduated_academic_year` records *which* year closed it, so the record answers "did
they finish 11th?" without a second table. Run-level suppression is `academic_years.swept_at`.

`graduated_at` exists only because `left_at` cannot distinguish graduating from archiving, and
`students` has no `last_login_at`-style field to clear. A `student_graduations` table would
duplicate `status`, `left_at` and `left_reason` and add a second, deletable lifecycle that this
single terminal transition does not have.

## Failure handling

1. The brief send retries **3 times** with backoff. On exhaustion the run is `FAILED` and **one**
   alert goes to the manager chat; if Telegram is what broke, that alert fails too and is retried
   once — a different failure.
2. `TelegramBotService.isEnabled()` false
   (`apps/api/src/modules/telegram/telegram-bot.service.ts:28-30`) → `NO_RECIPIENT`, logged at
   `error`. A 403 clears the binding (`:40-43`), so a later run is `NO_RECIPIENT`.
3. `workflow_runs` is the durable record in every case and holds the frozen candidate list, so a
   run that briefed and then failed stays inspectable. The graduation transaction is all-or-nothing:
   a failure on student 14 rolls back 1–13, because a half-graduated year is a state nobody can
   reason about. A missing `academic_years` row is a configuration gap, logged at `warn` once per
   distinct year string and never guessed.

## Explicitly out of scope

- **The system never sets `GRADUATED` automatically.** Not on year end, not on zero attendance, not
  on age, not ever. The operator confirms.
- **This adds no status check to the write paths.** Club enrollment
  (`clubs.service.ts:183-198`), `recordPayment` (`billing.service.ts:29-37`), Payme
  (`payme.service.ts:126`, `:230`, `:348`), Click (`click.service.ts:108`, `:230`) and the payment
  link (`payment-gateways.controller.ts:83`) all still accept a graduated student; each is a
  sibling.
- **No reconciliation of historical data.** `rg -i graduat` over `apps/api/src` and
  `packages/shared/src` returns one hit — the error string at `students.service.ts:222`. No
  `graduated_at` exists to backfill; students who finished before this ships stay `ACTIVE` or
  `INACTIVE` until a human acts.
- **No promotion or rollover.** No `academic_year` on `students`, no term entity, no carry-forward of
  grade level or class.
- **No parent or student notification**, no alumni surface, no certificate, no exit interview, and
  **no un-graduating** — `GRADUATED` is terminal, as in `archive()`'s guard.

## Required changes

**A. `academic_years`, plus two columns on `students`.** New table `academic_years (academic_year
varchar(10) PK, starts_on date NOT NULL, ends_on date NOT NULL, swept_at timestamptz NULL)`, one
entity, `GET`/`POST /v1/academic-years` at `@Roles(ADMIN, MANAGER)` — this answers "how does the run
know the year ended", and class setup needs it too. Alongside it, `graduated_at timestamptz NULL`
and `graduated_academic_year varchar(10) NULL` on `student.entity.ts` beside `left_at`/`left_reason`
(`:74-78`). One migration, backfilling `academic_years` from the distinct `classes.academic_year`
values (`class.entity.ts:16-17`); the implementer **picks a non-colliding timestamp** above
`1745366500000`, the repo's last migration.

**B. `StudentsService.graduateBatch`**, modelled on `archive()` (`students.service.ts:214-238`) in
the same `transaction(...)` (`:215`): the guards and three writes above, one loop, `skipped`
accumulation, `swept_at` inside it.

**C. Controller + DTO.** `POST /v1/students/graduate` on `students.controller.ts:37`,
`@Roles(ADMIN, MANAGER)` as the archive handler uses (`:114-123`). `GraduateStudentsDto` in `dto/`,
mirroring `archive-student.dto.ts:5-8` but `@MaxLength(255)`, `studentIds` capped at 200.

**D. Audit.** Two rows per student, both required. Extend `describeAction` in
`apps/api/src/modules/audit/audit.interceptor.ts:62-76` with a `GRADUATE` branch **above** the
generic `POST → CREATE` fallback; it derives `entityType = 'STUDENT'` from the path (`:77-84`) but
`entityId` from the response body, which a batch body will not satisfy — hence the second row. One
explicit `AuditLog` row per student, via `AuditService.record`
(`apps/api/src/modules/audit/audit.service.ts:15`), **inside** the transaction, with `old_data =
{ status, classId, leftAt }` and `new_data = { status: 'GRADUATED', graduatedAt,
graduatedAcademicYear, reason, closedEnrollments }`. The interceptor hard-codes `oldData: null`
(`audit.interceptor.ts:54`) and never reads prior state, so only a service-level write records what
the row was; if the audit write fails, the graduation fails.

**E. Candidates endpoint + web review page.** `GET
/v1/students/graduation-candidates?academicYear=`, `@Roles(ADMIN, MANAGER)`, returning
`{ candidates[], orphans[], academicYear }` from the predicate in *Vocabulary*; the page posts a
chosen subset to `POST /v1/students/graduate`. No new front-end status code:
`StudentsTable.tsx:120-133` and `StudentProfileModal.tsx:126-133` already render `GRADUATED`.

**F. Dashboard arithmetic.** `active + archived` at `dashboard.service.ts:65` is arithmetic over two
filtered counts (`:47-48`), so the first `GRADUATED` row makes `students.total` wrong while every
invariant still looks fine. Replace it with a real `COUNT(*)` over `deleted_at IS NULL` and add a
`graduated` field beside `archived`; also add a status filter to `newStudentsLast7Days`, which
filters on `enrolled_at` alone (`:128-135`). Mirror both in `packages/shared/src/students.ts` and
the DTO. `DashboardPage.tsx:191-192` renders only `active` and `unassigned`; no change.

**G. Scheduler.** `ScheduleModule.forRoot()` from `@nestjs/schedule` in
`apps/api/src/app.module.ts:38-71`, **aliased** — `ScheduleModule` is already taken at `:23` and
`:58` by the school timetable module. `NIS_MANAGER_CHAT_ID` (bigint, required in production) goes
into `apps/api/src/config/env.validation.ts:60-67` — the single operator recipient for **every**
workflow here, already declared in `daily-attendance-oversight.md`.

## Slices, in dependency order

1. **`academic_years` + the two `students` columns** — migration, entities, backfill, CRUD endpoints.
   Ships alone, changes no behaviour, and it is what makes the year boundary knowable.
2. **`POST /v1/students/graduate` + `StudentsService.graduateBatch`** — write path, guards,
   transaction, 255 cap. Independently shippable: a manual graduate path for one student first.
3. **Audit** — the `GRADUATE` interceptor branch and the in-transaction `AuditLog` rows.
4. **Candidates endpoint + review page.**
5. **`GraduationSweepService`** — cron, ended/unswept year resolution, candidate load, freeze,
   orphan split, idempotency gate, failure handling. **Depends on `workflow_runs` and
   `school_calendar_days` from `daily-attendance-oversight.md` slices 2–3**; if this loop ships
   first it creates both.
6. **Brief renderer + Telegram delivery**, then the three-button callback handler with 12-hour
   expiry; then **Dashboard** — real `COUNT(*)` for `total`, the `graduated` field, the
   `newStudentsLast7Days` status filter, `@nis/shared` mirror.
7. **Tests** — predicate exactness; `classId IS NULL` is an orphan, never a candidate; two runs on
   one date produce one brief; a re-post graduates nothing; a failure at student 14 rolls back
   1–13; open `ClubEnrollment` rows are dropped, `DROPPED` rows untouched; `swept_at` is set only
   on success, so `yo'q` re-asks; one audit row per student with non-null `old_data`; the graduate
   leaves debtors, capacity and the sparkline.

## Sibling loops worth specifying next

- **Status checks on the charge paths.** This loop stops *creating* graduated students; it does not
  close the five doors in *out of scope*. The `left_reason` / `history.reason` truncation bug in
  `archive()` itself is a second, independent defect on the same code.
- **Promotion and rollover.** `students` has no `academic_year`, so graduating a year and moving the
  rest up are unconnected manual jobs.
- **Attendance-based quiet exit.** A student who stops attending looks identical to one on a long
  holiday, and archiving them by hand records a false reason. **Monthly tuition** stays blocked on
  #38 and #39.
