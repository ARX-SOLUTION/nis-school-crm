# Monthly tuition collection

**Status:** complete — frontier empty, ready to implement
**Owner:** Manager (single, one branch, Tashkent)
**Loop:** 1st of month, 08:00 `Asia/Tashkent`
**Scope:** `TUITION` lines only. `CLUB` / `SERVICE` / `DISCOUNT` / `ADJUSTMENT` are follow-up slices.
**No new dependency** — `@nestjs/schedule ^4.1.2` is already in `apps/api/package.json`.
**Prerequisites:** `workflow_runs` and `school_calendar_days` come from
`workflows/daily-attendance-oversight.md` slices 2–3 — reuse, do not recreate; if this loop ships
first it creates both for the others.

## Problem

Money lives partly outside this CRM. Front desk records cash/card per student in the billing
module, Payme/Click webhooks auto-create `PaymentRecord` rows, and the month rolls over by hand:
nobody generates an invoice, nothing has a due date, and "who owes what" is derived each time as
`SUM(CONFIRMED payments for month) < 2_500_000` (`apps/api/src/modules/billing/billing.service.ts`).
There is no `Invoice` entity, no `InvoiceLine`, no `StudentCredit` — the three nouns wayfinder
#37/#38 settled and #39 has not yet migrated history into.

Three consequences, all verifiable:

1. **A paid student and an invoiced student are indistinguishable.** `payments` rows carry
   `month YYYY-MM` as a label, not a claim. Overpayment in October is invisible in November.
2. **`DEFAULT_MONTHLY_FEE = 2_500_000` is hard-coded twice** (`billing.service.ts:17`,
   `reports.service.ts:21`) with no fee table and no snapshot — changing the tariff rewrites
   history instead of versioning it.
3. **`Student`/`Class` carry no `branch_id`** (only `Club` does). Branch stats are already broken
   (`@ts-expect-error` on a `branchId` neither table has). Any branch-aware invoice must create
   the column it snapshots.

This loop fixes the forward path only: on the 1st it stages one `DRAFT` tuition invoice per
enrolled student, the manager approves once, and the batch becomes `ISSUED` with `dueDate = 10th`.
History migration, gateway FIFO for generic payments, receipts, and cutover stay in #39 —
this spec blocks on none of them.

## Vocabulary

- **billing month** — `YYYY-MM` of the run (the month just started, e.g. run on 1 Oct bills October).
- **candidate** — `students.status = ACTIVE`, `deleted_at IS NULL`, `class_id IS NOT NULL`.
  The whole predicate; mirrors attendance *enrolled count* and graduation *candidate*.
- **orphan** — `ACTIVE`, `deleted_at IS NULL`, `class_id IS NULL`. Counted for the brief,
  never invoiced: with no class there is no grade to price and no branch to own the row.
- **monthly fee** — constant `2_500_000` UZS v1 (`DEFAULT_MONTHLY_FEE`). Snapshot per line;
  no fee table in this spec.
- **proration** — `remaining WORKING days / WORKING days in month`, both from
  `school_calendar_days` (Mon–Fri fallback when empty). Applies only when
  `students.enrolled_at` falls inside the billing month; otherwise factor `1`.
- **pricingSnapshot** — immutable jsonb per `InvoiceLine`: `{ baseTariff, factor,
  workingDaysInMonth, remainingWorkingDays, enrolledAt, branchId, academicYear }`.
- **DRAFT batch** — the set of `Invoice` + `InvoiceLine` rows for one billing month with
  `status = DRAFT`. Editable and deletable; invisible to debtors, parents, and reports.
- **the brief** — one Telegram message: counts + sums + exceptions, then one question.
- **run** — one execution, keyed `(MONTHLY_TUITION, billing_month)`. One row per month,
  enforced by unique index — a restart or second replica never produces a second batch.

**Terms to avoid.** *Billing cycle, arrears campaign, dunning, collection cadence* — each
implies an outbound parent channel this spec deliberately lacks. Say **billing month**,
**OVERDUE**, **brief**.

## Run — 1st, 08:00 `Asia/Tashkent`

`@Cron('0 8 1 * *', { timeZone: 'Asia/Tashkent' })`

08:00 sits before the daily 09:00 lead brief (`workflows/lead-followup.md:96`) on purpose —
on the 1st the manager gets tuition at 08:00 and leads at 09:00, never stacked.

1. `billingMonth` = current month in `Asia/Tashkent`, formatted `YYYY-MM`. Never derived from UTC.
2. **Idempotency gate.** `INSERT INTO workflow_runs (kind, run_month, …) ON CONFLICT
   (kind, run_month) DO NOTHING` with `kind = 'MONTHLY_TUITION'`. Zero rows inserted → exit
   immediately. A crash mid-run resumes against existing `DRAFT` rows for the same month;
   it never inserts a second batch.
3. Load every **candidate** with joined `class` (`branch_id`, `academic_year`, `grade_level`).
4. For each candidate compute the line amount:
   - `factor = 1` when `enrolled_at < first day of billingMonth`;
   - else `remaining WORKING days in month from enrolled_at / WORKING days in month`
     (both ends inclusive, read from `school_calendar_days`; empty table → Mon–Fri).
   - `amount = round(2_500_000 * factor)` to whole UZS; factor `0` (enrolled on a holiday
     past the last working day) → skip with reason `ZERO_PRORATION`, counted in findings.
5. Insert one `Invoice` (`status DRAFT`, `branch_id` = class branch snapshot,
   `due_date = 10th of billingMonth`, `billing_month`) + one `InvoiceLine`
   (`type TUITION`, `amount`, `pricingSnapshot`) per candidate, in one transaction.
6. **Credit pass (auto FIFO).** For candidates with `StudentCredit > 0`, draw down oldest
   credit first against the new `DRAFT` invoice (`applied_credit` on the line, credit ledger
   row `APPLIED`). `StudentCredit >= 0` always; a credit larger than the invoice zeroes the
   invoice (`DRAFT` with `remaining = 0`, still needs `ha` to become `PAID`) and keeps the
   remainder. Nothing goes negative; debt lives only in open invoices.
7. Count **orphans** (no row written) and read **OVERDUE** as
   `status IN ('ISSUED','PARTIALLY_PAID') AND due_date < today` — count + sum only.
8. Freeze everything into `workflow_runs.findings` (counts, sums, exception lists, rendered
   brief), set run `AWAITING_DECISION`, and send the brief. No findings is impossible here
   by construction (a school with zero candidates still gets a brief saying so — unlike the
   daily loops, silence on the 1st would read as "the loop is broken").

## The brief

One Telegram message, `uz` only, decision-ready. Counts + sums + exceptions — never a
200-row student list.

```
🧾 To'lov — Oktabr 2026

Yangi: 182 ta · 448,5 mln so'm
  Kreditdan: 12 ta · 11,0 mln
  Prorata: 6 ta (o'rta oyda kelgan)
Qarz (OVERDUE): 14 ta · 21,0 mln
Sinfsiz (hisoblanmadi): 3 ta

Chiqarilsinmi? (due: 10-oktabr)
```

Rules:

- Sums first, exceptions second, question last. The manager decides from this message alone.
- **No per-student amounts.** The frozen findings hold the per-invoice table; the brief is
  the decision, not the ledger.
- Orphans appear only as a count (`Sinfsiz`) — the fix is class assignment, not process.
- `Prorata` line appears only when count > 0.
- Credit line appears only when applied > 0, as `N ta · M so'm`.
- OVERDUE is count + sum, never a list — the full list lives on the debtors page.
- Language `uz` only; recipient `NIS_MANAGER_CHAT_ID` — the single operator recipient
  shared with all four existing specs. One var, one person, one channel.

## Checkpoint

**Push right.** The run stages every `DRAFT`, computes every proration, applies every credit,
counts orphans and OVERDUE, and renders the brief — before asking anything. The manager is
asked **once**, at the end: *chiqarilsinmi?*

| Button | `callback_data` | Effect |
|---|---|---|
| **ha** | `mtu:yes:<runId>` | all `DRAFT` of this month → `ISSUED`; run → `DISPATCHED` |
| **yo'q** | `mtu:no:<runId>` | all `DRAFT` of this month deleted; run → `SKIPPED` |

- Buttons live **48 hours** (until the 3rd 08:00), then the run auto-closes `EXPIRED` and
  the `DRAFT` rows are deleted by the expiry pass. A 12-hour window fits a daily loop; an
  invoice batch that charges 182 families must survive a busy 1st.
- **"yo'q" and expiry delete, never issue.** Nothing becomes a debt without a `ha`. This is
  deliberate: a wrong `ISSUED` is a claim against a family and cannot be unsent (no
  parent auto-notify exists in v1 precisely for this reason).
- **Re-run is manual.** `POST /v1/workflows/monthly-tuition/regenerate { billingMonth }`,
  `@Roles(ADMIN, MANAGER)`: allowed only when no `ISSUED`/`PARTIALLY_PAID`/`PAID` invoice
  exists for the month; deletes any leftover `DRAFT`, re-runs steps 3–8, sends a fresh brief
  with a fresh 48-hour window. One regeneration per month; the second call is `409`.
- Callback handling reuses the `TelegramUpdate` action-handler pattern introduced by the
  lead-followup spec (`lfu:*`); no `callback_query` handler exists in
  `apps/api/src/modules/telegram/` today — this is the second consumer, not the first.

## Failure handling

1. Batch insert, credit pass, and findings-freeze share **one transaction** per run: a crash
   cannot half-invoice a school.
2. Brief send retries **3 times** with backoff. On exhaustion the run is `FAILED`, `DRAFT`
   rows stay (never auto-issued), and **one** alert goes to the manager chat. If Telegram is
   what broke, that alert is retried once — a different failure.
3. Pessimistic locking (`SELECT … FOR UPDATE`) on `Invoice` rows during the `ha` transition,
   per #38 concurrency rule — two taps on `ha` cannot double-issue.
4. `workflow_runs.status` is the durable record: `RUNNING | AWAITING_DECISION | DISPATCHED |
   SKIPPED | EXPIRED | FAILED | NO_RECIPIENT`. `GET /v1/health` already probes DB/Redis/RabbitMQ;
   no new health surface.
5. A run that cannot resolve `NIS_MANAGER_CHAT_ID` writes `NO_RECIPIENT`, logs at `error`,
   keeps `DRAFT`s, and never auto-issues.

## Explicitly out of scope

- **History migration.** Legacy `PaymentRecord` / `PaymentTransaction` backfill, branch
  ownership for old rows, idempotency of old gateway payloads, cutover and rollback — all
  #39. This spec reads live `StudentCredit` (post-#39 or zero) and never backfills.
- **Gateway allocation for generic payments.** Targeted-invoice vs FIFO-oldest and
  `UNMATCHED_EXTERNAL / UNMATCHED_INTERNAL / AMOUNT_MISMATCH` reconciliation reports are
  #38 rules executed in #39's migration and the future reconciliation-sweep loop — not here.
- **Receipts.** No receipt printing in this loop; `receipt_number` stays on the payment row.
- **Parent notification.** No Telegram/SMS to parents on `ISSUED` in v1. The invoice is
  visible on the debtors page; telling families stays on today's human channel. Auto-notify
  is its own loop with its own undo analysis.
- **Fee table, discounts, club/service lines.** `DISCOUNT` / `ADJUSTMENT` / `CLUB` / `SERVICE`
  line types, tariff history, and the >500k dual-approval thresholds (#38 §4) are accepted
  as vocabulary and unused here.
- **The system never edits an `ISSUED` invoice.** Corrections are compensating reversals /
  child refunds per #38 §3, never updates or deletes. `VOID` requires prior refund/reallocate
  and an audit row — supported by schema, never exercised by this loop.

## Required changes

**A. Branch column (first to ship creates it).**

```sql
ALTER TABLE classes ADD COLUMN branch_id uuid REFERENCES branches(id);
CREATE INDEX idx_classes_branch ON classes(branch_id);
```

Backfill: every existing class → the single live branch (one `UPDATE`; the operator confirms
which branch id before migrate). New classes require `branch_id` (`CreateClassDto`,
`@IsUUID`). `Invoice.branch_id` snapshots this value at issuance and never follows later moves.

**B. Invoice tables.**

```sql
invoices ( id uuid PK, student_id uuid FK → students, branch_id uuid FK → branches NOT NULL,
           billing_month varchar(7) NOT NULL, status varchar(20) NOT NULL DEFAULT 'DRAFT',
           due_date date NOT NULL, total numeric(14,2) NOT NULL,
           applied_credit numeric(14,2) NOT NULL DEFAULT 0,
           created_at timestamptz DEFAULT now(),
           UNIQUE (student_id, billing_month) );

invoice_lines ( id uuid PK, invoice_id uuid FK → invoices ON DELETE CASCADE,
                type varchar(20) NOT NULL DEFAULT 'TUITION',
                amount numeric(14,2) NOT NULL,
                pricing_snapshot jsonb NOT NULL );
```

`status`: `DRAFT | ISSUED | PARTIALLY_PAID | PAID | VOID`. `OVERDUE` is a view predicate,
never stored. `UNIQUE (student_id, billing_month)` is the second idempotency wall behind
`workflow_runs (kind, run_month)`.

**C. Run ledger extension.** `workflow_runs` gains nullable `run_month varchar(7)` with
`UNIQUE (kind, run_month)` partial (where `run_month IS NOT NULL`); existing `(kind, run_date)`
rows untouched. Findings jsonb shape:
`{ billingMonth, counts: { invoices, prorated, zeroProration, orphans, overdueCount },
   sums: { total, appliedCredit, overdueTotal }, renderedBrief }`.

**D. Service.** `MonthlyTuitionService` in `apps/api/src/modules/billing/` — cron, candidate
load, proration, DRAFT insert, credit FIFO, orphan count, OVERDUE count+sum, findings freeze,
brief render + send, `ha`/`yo'q`/expiry/regenerate. Pessimistic lock on `ha`.

**E. Endpoints.** `POST /v1/workflows/monthly-tuition/regenerate` (`ADMIN, MANAGER`);
`POST /v1/workflows/monthly-tuition/:runId/decide` (internal, called by the Telegram action
handler — same pattern as `aov:*` / `lfu:*`).

**F. Configuration.** Reuse `NIS_MANAGER_CHAT_ID` (declared in
`workflows/daily-attendance-oversight.md`, shared by all specs). No per-loop var. Register
`ScheduleModule.forRoot()` from `@nestjs/schedule` with the timetable-module alias
(`apps/api/src/app.module.ts:23,58` — same note as every scheduled spec).

## Slices, in dependency order

1. `classes.branch_id` — migration, entity, DTO, backfill. Independently shippable.
2. `invoices` + `invoice_lines` — migrations, entities, unique index.
3. `workflow_runs.run_month` — migration, partial unique index.
4. `MonthlyTuitionService` — cron 1st 08:00, candidate query, proration, DRAFT batch, credit
   FIFO, idempotency gate, failure handling.
5. Brief renderer + Telegram delivery + frozen findings.
6. Callback handler (`mtu:yes/no`), 48-hour expiry pass, manual regenerate endpoint.
7. Tests: prorated vs full line; orphan counted not invoiced; credit auto-applied never
   negative; two runs one month → one batch; `yo'q`/expiry deletes DRAFTs; regenerate
   refused after any `ISSUED`; OVERDUE count excludes `DRAFT`/`PAID`/`VOID`.

## Sibling loops worth specifying next

- **Reconciliation sweep** (issue #33 / #38 §5): `UNMATCHED_EXTERNAL / UNMATCHED_INTERNAL /
  AMOUNT_MISMATCH` over Payme/Click/bank vs `payment_transactions` + `payments`, immutable
  `ReconciliationReport` + reviewer sign-off.
- **Access granting** (issue #33 auth half): role assignment with branch scope, permission
  matrix comprehension — the workflow twin of the capability model.
- **Parent invoice notice** (deferred from this spec): when and how families learn an invoice
  exists, with undo analysis — deliberately not v1.
- **Fee versioning**: tariff history table replacing the `2_500_000` constant.
