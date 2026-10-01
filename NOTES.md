# NOTES.md — NIS School CRM (loop-me workspace)

## World

**Repo**: nis-school-crm. NestJS API (`apps/api`) + Vite/React web (`apps/web`), npm workspaces,
`@nis/shared` for wire types. PostgreSQL 15 + TypeORM (migrations only), Redis, RabbitMQ, Socket.IO,
Telegraf bot. Deployed via Docker Compose + Caddy (`deploy/`), Cloudflare Workers for web.

**Product**: CRM for Nordic International School, Tashkent. Multi-branch.
Language default `uz` (also `ru`, `en` on `user.language`).

**Roles**: `SUPER_ADMIN(4) > ADMIN(3) > MANAGER(2) > TEACHER(1)`, plus orthogonal `PARENT(0)`.
Global `JwtAuthGuard` + `RolesGuard` + `AuditInterceptor`.

**23 API modules**: students, billing, attendance, grades, leads, classes, subjects, schedule,
clubs, rooms, branches, teachers, parents, users, auth, audit, dashboard, notifications,
telegram, reports, events, health.

### Surfaces (channels the school processes work through)

| Surface | Used for |
|---|---|
| Web UI (desktop) | everything staff: students, classes, attendance, grades, billing, leads, clubs, schedule, reports, users |
| Telegram bot | parent + teacher notifications; parent self-service (`/today`, `/grades`, `/report`); staff account linking (`/link <code>`), `/me`, `/unlink` |
| Payme / Click webhooks | incoming online payments → auto-created `PaymentRecord` |
| SMS | declared in `NOTIFICATION_CHANNELS`, never written |
| No e-mail at all | — no inbox, no digest, no reports-by-email |
| Admin broadcasts | `POST /notifications/broadcast` → Telegram, target `ALL_USERS / ALL_PARENTS / ALL_TEACHERS / CLASS_PARENTS` |

### Event bus (RabbitMQ topic exchange `nis.events`)

`user.created`, `user.password_reset`, `audit.write`, `attendance.recorded` (ABSENT/LATE only),
`grade.recorded`, `payment.recorded`, `broadcast.announcement`.
Two consumers only: `audit.log` (all `audit.*`) and `notifications.telegram` (all six above).
Socket.IO namespace `events`; rooms `user:<id>`, `role:<ROLE>`; emits `attendance.updated`,
`notification.new`.

### ⚠️ There is NO scheduled work in this system

Verified: zero `@Cron`, `@Interval`, `node-cron`, `bullmq`, `@nestjs/schedule`.
There is no timer anywhere in the backend. Every loop today is **human-triggered** —
somebody opens a page and clicks. The event bus carries things that already happened
(recorded → notify); it never decides *when* something should happen.

---

## Canonical terms

- **student** — enrolled person. `status: ACTIVE | INACTIVE | GRADUATED`. `GRADUATED` has
  **no write site anywhere in the codebase** — proven by enumerating all five write sites
  for `students.status` (column default, `create()`, `archive()`, lead conversion, DB default).
  It exists only as an enum member, a filter option, and a UI label.
  `?status=GRADUATED` is a working filter that today returns nothing.
  `enrolled_at`, `left_at`, `left_reason`, `student_code` (`NIS-2026-00042`).
  Archived = `DELETE` → `INACTIVE` + class cleared + history rows closed.
  No `graduated_at` column, no academic-year field, no promotion or rollover path.
- **lead** — pre-enrolment enquiry. `stage: NEW → CONTACTED → TRIAL_SCHEDULED → CONTRACT_SENT → ENROLLED`,
  sink `LOST`. **Transitions are not enforced** — any stage → any stage is accepted.
  `source: TELEGRAM | INSTAGRAM | FACEBOOK | WEBSITE | RECOMMENDATION | WALK_IN | OTHER`.
- **class** — `(name, academicYear)` unique. `grade_level`, `max_students` (30), `room_number`, `is_active`.
  `grade_level` and `academic_year` immutable after create.
- **class assignment** — `PATCH /students/:id/assign-class`. Requires `ACTIVE` student, active class,
  matching `grade_level`, `activeCount < max_students`, under a pessimistic row lock.
  Tracked in `StudentClassHistory` (`assigned_at`, `removed_at`, `reason`).
- **attendance** — one row per `(student, date)` — re-marking **overwrites in place**.
  `PRESENT | ABSENT | LATE | EXCUSED`. Marked in bulk per class per date.
  Rate = `(PRESENT+LATE)/total` in `attendance.service`, but `(PRESENT+LATE+EXCUSED)/total` in `reports` — **two different formulas**.
- **grade** — append-only. `CLASSWORK | HOMEWORK | EXAM | QUARTER`. `score` / `max_score` (default 5).
  No update or delete endpoint → a corrected mark is inserted again and both average in.
  `QUARTER` exists but is never aggregated. No period/term entity.
- **payment** — `payments` row. `amount` UZS numeric(14,2). `method: CASH|CARD|CLICK|PAYME|BANK_TRANSFER`,
  `status: CONFIRMED|PENDING|REFUNDED`, `receipt_number` unique, `month` `YYYY-MM`, `paid_at`.
- **payment transaction** — gateway-side row. `provider: PAYME|CLICK`, `provider_trans_id`,
  `state` (int, Payme convention) **plus** `status: PENDING|SUCCESS|CANCELLED|FAILED` — two parallel
  status representations. `meta` jsonb keeps the raw provider payload.
- **monthly fee** — `DEFAULT_MONTHLY_FEE = 2_500_000` UZS, **hard-coded twice**, no fee table.
- **debtor** — derived, not stored: active student whose `SUM(CONFIRMED payments for month) < 2_500_000`.
- **invoice** — **does not exist yet**. This is the gap the open wayfinder map (#33–#41) is closing.
- **club** — after-school. `category`, `fee_type: FREE|PAID`, `monthly_fee`, `status: ACTIVE|INACTIVE|ARCHIVED`,
  `capacity`, `min_grade`/`max_grade`. Enrollment `ACTIVE|PAUSED|DROPPED` (`PAUSED` never set).
  Club attendance `PRESENT|ABSENT|EXCUSED` — **no `LATE`**, unlike core attendance.
- **substitution** — `CONFIRMED | CANCELLED`, unique `(entry, date)`. **Nobody is notified.**
- **branch** — campus. Only `Club` actually carries `branch_id`. Branch stats are broken
  (`@ts-expect-error` on a `branchId` that `Student`/`Class` do not have).
- **parent** — `PARENT` user linked to students via `parent_students` (`is_primary`).
  Auth only via Telegram Login Widget; placeholder email `tg_<id>@nis.parent`, throwaway bcrypt hash.
- **parent invite** — `token` (64 hex, plaintext by design), `expires_at` +7d, `used_at`, `used_by_user_id`.
  `PENDING → CONSUMED | REVOKED | (implicit) EXPIRED`. No sweeper job.
- **audit log** — `action`, `entity_type`, `entity_id`, `old_data`, `new_data`, `ip`, `user_agent`, `status_code`.
  **`old_data` is always null.** **Failed (4xx/5xx) requests are never audited.**
  Fire-and-forget over RabbitMQ → a failed audit write never surfaces.
- **notification log** — `title`, `message`, `type`, `target`, `channel`, `recipient_count`, `sent_by`.
  Written **only for manual broadcasts**. Attendance/grade/payment notices are never logged.
- **notification prefs** — `users.notification_prefs` jsonb, settable via `PATCH /auth/me/prefs`
  (unvalidated), and **read by nothing**. Opt-outs do not work.

## People (who does what)

| Persona | Touches |
|---|---|
| Super Admin | branches, users, everything, security review of audit log |
| Admin | academic setup, reports, broadcasts, class/subject/room/club config |
| Manager | day-to-day: leads, students, attendance, payments, clubs, schedule |
| Teacher | own class: mark attendance, enter grades, club attendance |
| Accountant / front desk | payments, receipts, debtors, reconciliation (role today is `MANAGER`) |
| Parent | Telegram only: notices, `/today`, `/grades`, `/report` |

---

## Loops visible in the system (candidates — not yet confirmed)

Each is something the school **repeats**, not something the code does.

1. **Daily attendance marking** — every teacher, every school day, per class. Manual bulk form.
2. **Monthly tuition collection** — front desk records cash/card payments per student, prints receipt,
   chases debtors. Month rolls over by hand; nothing generates an invoice.
3. **Lead follow-up** — admissions works the pipeline; no reminder ever tells them a lead went quiet.
4. **New-student onboarding chain** — lead → student → class assignment → parent invite → parent
   Telegram link → first payment. A multi-day, multi-actor chain with no owner.
5. **Grade entry + reporting** — teacher enters marks; nobody aggregates quarters; parent asks.
6. **Teacher substitution** — recorded in the system, never communicated.
7. **Club session** — enrollment → weekly session → club attendance → monthly club fee.
8. **Month-close / finance review** — `GET /reports/finance?months=6`. Pull it, eyeball it.
9. **Staff onboarding** — create user → generated password → delivered over Telegram → `mustChangePassword`.
10. **Granting someone access** — role assignment today is a single enum on `users`. Changing it is
    a manual DB-flavoured edit; there is no permission model to reason about.
11. **The wayfinder loop itself** — issues #38–#41 are open decisions on this very spec.

## Known defects that a workflow would hit immediately

- Broadcast `target` mismatch: consumer branches on `PARENTS|TEACHERS|CLASS`, publisher sends
  `ALL_PARENTS|ALL_TEACHERS|CLASS_PARENTS|ALL_USERS` → **every broadcast reaches all active users**.
- Event payloads carry empty `studentName` / `subjectName` → parent alerts read "Farzandingiz" / "Fan".
- `/grades` bot command is broken SQL (`g.value` does not exist, wrong join).
- `/today` maps JS `getDay()` (Sun=0) onto `ScheduleEntry.dayOfWeek` (`MONDAY..FRIDAY` string) — off by one.
- `/report` bot command is a stub (`ponytail:` marker).
- Telegram family templates are uz-only regardless of `user.language`.
- `rooms/:id/availability` returns a hard-coded `{ available: true, conflicts: [] }`.
- `ClubStatsDto.averageAttendanceRate` returns a fake `95` when there are no records.
- Attendance rate formula differs between `attendance` and `reports`.
- Payme late-cancel flips a `PaymentRecord` to `REFUNDED`; Click has **no refund path at all**.
- **`GRADUATED` students are unreachable.** `dashboard.service.ts` computes
  `total: active + archived` — **arithmetic, not `COUNT(*)`** — so a `GRADUATED` row falls out
  of all four numbers at once, and the invariant `active + archived === total` still holds, so
  nothing looks broken. There is no write site for the value anywhere. Web UI renders only
  `active` and `unassigned`, so the defect is latent in the API contract. First visible symptom:
  `?status=GRADUATED` is a valid filter that always returns empty, so staff conclude the student
  does not exist. Also: club enrollment, payment recording, and payment-link generation do **not**
  check student status, so a graduated student can still be enrolled in a club and charged.
- **Archive writes a reason into a narrower column.** `ArchiveStudentDto` validates `@MaxLength(500)`
  and the same string goes to `students.left_reason` (500) and `student_class_history.reason` (255).

## Settled — round 1

| Decision | Answer |
|---|---|
| **What a workflow spec is** | An **operational automation spec** — who runs it, when, who gets told what. Not a repo-build ticket. Repo changes fall out of it as slices. |
| **Who the user is** | One **Manager/Admin**, single-handed, one branch, **Tashkent**. |
| **Where the work lives today** | Partly **outside** this CRM — Excel/calculator for money. The CRM has no invoice generation. |
| **Two independent cycles** | Money month (`2026-10`, monthly tuition) and academic year (`2026-2027`) are **separate**. No quarter/term exists — `QUARTER` is declared but never aggregated. |
| **Where specs live** | `workflows/*.md`, in-repo, written for an agent but readable by a human. |

**Why ops-automation and not a repo ticket:** the repo already has 23 modules and every endpoint.
Writing more code is not the gap. The gap is that nothing in the system decides *when* anything
happens. Every loop today is a person opening a page and clicking.

## Settled — round 2

| Decision | Answer |
|---|---|
| **First loop** | **A — daily attendance oversight.** No blockers; the event pipeline already exists. |
| **Where it runs** | Inside the API, `@nestjs/schedule` (`^4.1.2` already a dependency — no new dep). |
| **Where the brief lands** | **Telegram only.** The manager is on a phone; the web dashboard needs navigation, and that makes it a task, not a brief. |
| **Autonomy** | **Push right** — maximal mechanical work first, then one question. Never fully autonomous: a message to a parent cannot be unsent. |
| **Language** | **`uz` only.** The Telegram family templates are already uz-only and ignore `user.language`; adding `ru` would spread that bug. |

## Settled — rounds 3–4 (loop A)

| Decision | Answer |
|---|---|
| **Attendance grain** | Once per day per class, by the **homeroom teacher**. Not per lesson — bell times are not in the DB. |
| **Run time** | **18:00 `Asia/Tashkent`**, a constant. Not derived from a timetable that does not exist. |
| **Working days** | New `school_calendar_days` table (`date`, `kind: WORKING\|HOLIDAY`, `note`). Falls back to `MONDAY..FRIDAY` when empty. |
| **Unlinked teacher** | Reminder row goes `BLOCKED_NO_TELEGRAM` and is **named in the brief** as a config gap. Never silently dropped. |
| **Brief scope** | Unmarked **and** incomplete. Degraded mode is **not persistent** — "yo'q" applies to that run only. |
| **"Yo'q" storage** | Per-run only. A standing mute is a lost key, not a decision. |
| **Recipient** | One named `NIS_MANAGER_CHAT_ID` (unified later across all specs). Not a role broadcast, not "highest role present". |
| **No homeroom teacher** | Reported in the brief as a config gap, **no reminder row**. The fix is data, not process. |
| **Substitution** | Shown in the brief; does **not** move responsibility. Homeroom teacher stays responsible. |
| **Run failure** | 3 retries, then `FAILED` in `workflow_runs` + one alert. The run row is the durable record. |

**Spec:** `workflows/daily-attendance-oversight.md` — 8 slices, ready to implement.

## Specs produced

| Spec | Loop | Trigger |
|---|---|---|
| `workflows/daily-attendance-oversight.md` | unmarked / incomplete classes, one brief, one decision | schedule 18:00 `Asia/Tashkent` |
| `workflows/announcement-broadcast.md` | compose → preview → verified send to the right audience | event + on-demand |
| `workflows/lead-followup.md` | stale leads in a board whose stages are not enforced | schedule 09:00 |
| `workflows/student-graduation-sweep.md` | students who finished the year and are still `ACTIVE` | schedule 11:00, only while an ended year is unswept |

The three scheduled loops sit at 09:00, 11:00 and 18:00 on purpose — three briefs in one
Telegram channel must not land on top of each other.

### Shared across all four — decided once, do not re-derive

- **`NIS_MANAGER_CHAT_ID`** — one env var, one recipient, all four specs. Each lane proposed a
  different per-loop name independently (`ATTENDANCE_OVERSIGHT_…`, `NIS_MANAGER_CHAT_ID`,
  `LEAD_FOLLOWUP_…`); the parent unified them. A per-loop variant invites a second recipient for
  a second loop, and the operator ends up with two briefs from two channels.
- **`school_calendar_days`** (`date` PK, `kind: WORKING|HOLIDAY`, `note`) — declared in the
  attendance spec, consumed by the lead and graduation specs. **First to ship creates it.**
- **`workflow_runs`** (`kind`, `run_date`, unique) — the durable run ledger, shared by all three
  scheduled specs. Same rule. It also carries the frozen findings jsonb, so a run's decision
  is made against the list that was actually shown.
- **`academic_years`** (`academic_year` PK, `starts_on`, `ends_on`, `swept_at`) — new, from the
  graduation spec. `classes.academic_year` is a bare `YYYY-YYYY` string with no boundary anywhere,
  so "the year has ended" had nothing to test against. Class setup needs this too.
- **All scheduled loops live inside the API** via `@nestjs/schedule`. `ScheduleModule` is already
  a taken name in `app.module.ts` (the school timetable module) — alias the import.
- **`uz` only.** One recipient, one language, one channel.

### Facts corrected during the session

Recorded because a scout subagent found them and I had them wrong:

- Dashboard `students.total` is **arithmetic** `active + archived` (`dashboard.service.ts:65`),
  not `COUNT(*)`. A `GRADUATED` row therefore drops out of all four numbers and the invariant
  still holds — nothing looks broken.
- `dashboard.service.ts:80` is teacher-stats, not average fill. The fill filter is the join at
  `:102-104`.
- `env.validation.ts:43` is a poor anchor; `:60-67` is the feature-flag block.

## Still open — needs the user

- **Monthly tuition collection** is blocked on wayfinder issues #38 and #39 — its spec cannot be
  finished until those close. It is the loop with real Excel dependency and the one that moves
  actual money.
- Remaining loops from the candidate list, none yet specified: new-student onboarding chain,
  grade entry + quarter reporting, teacher substitution notification, club session, month-close
  finance review, staff onboarding, access granting.
- **Status checks missing on write paths** — club enrollment, payment recording, and payment-link
  generation each check existence but never status, so a graduated or archived student can still
  be enrolled and charged. Found by the scout; deliberately left out of the graduation spec as
  siblings.
