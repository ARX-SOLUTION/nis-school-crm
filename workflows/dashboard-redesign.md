# Dashboard redesign

**Status:** complete — frontier empty, ready to implement
**Kind:** a **view**, not a scheduled loop. This spec deliberately breaks the house skeleton
where the loop sections do not apply; the reason is stated under *Skeleton deviation*.
**Owner:** Manager (single, one branch, Tashkent)

## Problem

`DashboardPage.tsx` is 322 lines and shows four bare numbers. It has no target, no trend,
no comparison, and no alert. It is a list, not a dashboard.

Specific failures, all verifiable:

1. **Context is discarded, not absent.** `BillingStatsDto` returns `expectedThisMonth` and
   `collectionRate` (`packages/shared/src/billing.ts:33-39`). The card at
   `DashboardPage.tsx:195-202` reads only `totalCollectedThisMonth` and `debtorCount` and
   throws the other two away. The one metric that makes money meaningful is on the wire and
   unused.
2. **Two vanity metrics.** "Total Classes" and "Lead Pipeline" (a raw count of leads) cannot
   prompt a decision.
3. **An average hides the shape.** `averageFillPercent: 3.3` is ambiguous — one empty class or
   all of them? The distribution is the signal, the mean is not.
4. **A log is masquerading as a KPI.** "Recent Activity" (`DashboardPage.tsx:229-274`) renders
   the audit log. That is an ops feed. It also has no page of its own: `GET /v1/audit-logs`
   exists on the API and no route exists in `router.tsx`.
5. **No alerts.** Nothing on the screen says *act now*.
6. **The teacher view has no KPIs.** `DashboardPage.tsx:276-318` shows class name, grade,
   year, capacity. Metadata, not performance.
7. **Hardcoded.** `DashboardPage.tsx:43` says "Good afternoon" at 08:00. `:45` says
   "NIS Tashkent" in a multi-branch system.
8. **No methodology.** `DEFAULT_MONTHLY_FEE = 2_500_000` is hardcoded in **two** files —
   `billing.service.ts:17` and `reports.service.ts:21`. Two sources of truth for the same
   number is how a dashboard ends up contradicting a report.
9. **A live landmine.** `attendance.service.ts` computes rate as `(PRESENT+LATE)/total`;
   `reports.service.ts` uses `(PRESENT+LATE+EXCUSED)/total`. **They disagree today.** Any
   dashboard card showing an "attendance rate" inherits that conflict and becomes a third
   opinion.

## Vocabulary

- **compliance** — the share of expected classes that have any attendance row for today.
  Counts *marked classes*, never students, and never uses a rate formula. Deliberately
  immune to the formula disagreement above.
- **expected class** — `classes.is_active AND deleted_at IS NULL` with at least one ACTIVE
  student. Mirrors loop A's candidate set so the two can never disagree.
- **collection rate** — `confirmed payments this month ÷ expectedThisMonth`, already computed
  server-side. Not recomputed on the client.
- **arrears** — a per-student gap: for each month, `monthly fee − confirmed payments`,
  summed over every month with a gap. Distinct from **debt**, which today is per-month only.
- **alert** — a row that demands an action and links to where the action is taken. Absent
  when there is nothing to do.
- **methodology note** — a persistent disclosure of how a number was computed.

## The screen

Four bands. Silent when healthy.

### Band 0 — Alerts

Renders **only** when non-empty. No "all clear" row; a daily all-clear trains the operator to
stop reading the band.

| Alert | Condition | Goes to |
|---|---|---|
| 🔴 unmarked classes | compliance < 100% today | `/attendance` |
| 🔴 stuck payments | `payment_transactions` `status = PENDING` older than 24h | `/billing` |
| 🟡 arrears | any student with a gap in a prior month | `/billing` |
| 🟡 unlinked parents | `parent_students` whose parent has `telegram_chat_id IS NULL` | `/notifications` |

Each row carries the count, the plain-language reason, and one link. No thresholds on this
band beyond "something is wrong" — the judgement thresholds live on the KPI cards.

### Band 1 — Headline KPIs

Four cards. Each carries **value, target, trend, and a drilldown link**. A card missing any of
those is not a KPI and does not ship.

| KPI | Value | Target | Trend | Drilldown |
|---|---|---|---|---|
| Collection rate | `collectionRate` | see thresholds | vs same day last month | `/billing` |
| Arrears | `SUM(totalArrears)` UZS | — | vs last month | `/billing` |
| Compliance | marked ÷ expected classes | 100% | vs 30-day mean | `/attendance` |
| Enrolled students | `students.active` | — | 7-day delta; `unassigned` as qualifier | `/students` |

Arrears is a **sum of money**, not a debtor count. `DebtorStudentDto.debtAmount`
(`packages/shared/src/billing.ts:49`) is per-month, so today the system can only say *who
owes the most this month* — it cannot rank debtors by what they actually owe.

### Band 2 — Trends and breakdowns

- **Collected revenue, 6 months** — exists: `GET /v1/reports/finance?months=6`.
- **Leads as a funnel by stage** — exists: `GET /v1/leads/stats`. A count is not a funnel;
  render the stage distribution with the conversion rate beneath it.
- **Class fill as a distribution** — "4 classes below 50%", not a mean. Buckets at
  `<50%`, `50–79%`, `80–99%`, `full`, over two columns.

### Band 3 — Removed

"Recent Activity" leaves this screen and becomes `/audit-logs`, a new page and route.
`GET /v1/audit-logs` already exists and is `@Roles(ADMIN)`; only the web surface is missing.

### Teacher view

Separate branch, three items, all actionable:

1. My class's attendance rate for the current week.
2. Whether my class is marked today.
3. Any arrears among my students.

Not class metadata. Capacity and grade level are inputs, not performance.

## Thresholds

Fixed thresholds produce alert fatigue. These are **self-referential** — each compares the
current period to the school's own baseline.

- **Collection rate.** 🔴 when the rate is **more than 10 points below the same day of the
  previous month** *and* **below 80%**. Both conditions, so a school that consistently collects
  in October is not alarmed in October, and a school that never exceeds 50% is alarmed on day 1
  rather than every day of the month. Same-day-last-month beats month-to-date because a
  month-to-date comparison is always behind.
- **Arrears.** Amber when the gap is in the current month. 🔴 when any prior month has a gap.
  Escalation is by *how many months*, which is the only age signal the data supports today.
- **Compliance.** 🔴 below 100%. There is no target below perfect — an unmarked class is an
  unmarked class.
- **Stuck payments.** Older than 24h. Payme's own timeout is 12h
  (`payme.service.ts` `TIMEOUT_MS`), so 24h is safely past any legitimate pending state.

Every threshold is stated in the methodology note with its formula, so an operator can
disagree with a number rather than with the screen.

## Skeleton deviation

The other four specs are scheduled loops, so they carry *Run*, *Checkpoint*, and *Failure
handling* driven by a cron and a Telegram decision. This screen has none of that: it is a
pull, it is recomputed per visit, and it has no checkpoint because it has no decision — the
decision belongs to the workflows.

The one thing it does share with the loops is the **alert band**. Bands 0 and loop A's brief
must report the same unmarked-class count from the same query, or the operator will receive two
different numbers from two different channels on the same day. `compliance` and loop A's
candidate predicate are specified identically for that reason.

Everything else in the house skeleton — Problem, Vocabulary, Required changes, Slices,
Siblings — applies unchanged.

## Required changes

**A. Attendance compliance query.** New, in `dashboard.service.ts`. One query, no writes:

```
expected = active classes with >=1 ACTIVE student
marked   = those having >=1 attendance_records row for today (Asia/Tashkent)
```

Must use the same `Asia/Tashkent` date as loop A. Deriving it from UTC — as
`reports.service.ts:41` and `billing.service.ts:142` currently do — will disagree with rows
written after 19:00 local. **No rate formula is involved, so the `EXCUSED` disagreement does
not apply.**

**B. Per-student total arrears.** New. `SUM` over months per student of
`fee − confirmed payments`, positive only. Returned as `totalArrears` alongside the existing
per-month `debtAmount`, which is left untouched so `PaymentLinkModal.tsx:24` keeps working —
it builds payment links from the per-month figure and must keep doing exactly that.

**C. Prior-month arrears count for the alert band.** A boolean-ish count of students with a
gap in any month before the current one.

**D. Stuck-payment count.** `payment_transactions WHERE status = 'PENDING' AND created_at <
now() - 24h`. Table already exists (`payment-transaction.entity.ts`); only the query is new.

**E. Unlinked-parent count.** `parent_students` joined to `users` where
`telegram_chat_id IS NULL`. Note `ParentStudent.isPrimary` exists — count primaries only, so
one family with two guardians counts once.

**F. Same-day-last-month collection rate.** One extra query against `payments` keyed on
`month` plus `paid_at`. The existing `collectionRate` cannot supply it.

**G. New `/audit-logs` route and page.** Move the table out of the dashboard. Reuse the
existing `AuditLogResponseDto`; the query and its `@Roles(ADMIN)` guard already exist.

**H. Time-aware greeting and real branch name.** `DashboardPage.tsx:43-45`. Time bucketed in
`Asia/Tashkent`, never the browser's clock. Branch from the selected branch context, not the
literal string "NIS Tashkent".

**I. Methodology note component.** A disclosure, not a tooltip — tooltips are unreachable by
keyboard. Reachable by click *and* focus.

**J. `StatCard` gains target, trend, and link props.** Currently `label / value / hint`
(`StatCard.tsx`). Also fix `label`'s contrast: it renders `text-neutral-400`, which measures
**2.56:1** against white and fails WCAG AA. `tailwind.config.ts:22` sets
`neutral.400: '#94A3B8'` while `DESIGN.md` documents `#64748B` as the token — the scale is
inverted relative to its own design document. Same class is used in 85 places.

## Slices, in dependency order

1. **`StatCard` extends** — target / trend / link props, contrast fix. Independently shippable
   and every later slice depends on it.
2. **`/audit-logs` route and page** — removes the log from the dashboard, smallest real win.
3. **Compliance query + card.** Pure read over existing tables; needs no workflow and no
   migration. Ships on its own.
4. **Same-day-last-month rate + threshold logic.** Turns a number into a KPI.
5. **Band 0 alerts: unmarked classes + stuck payments.** The two that need only new queries.
6. **Per-student total arrears + arrears KPI + arrears alert.**
7. **Band 2 breakdowns** — lead funnel and class-fill distribution.
8. **Teacher view.**
9. **Methodology note.**
10. **Greeting and branch name.**

Slices 3 and 4 are the whole difference between a number and a KPI. Slices 1–2 are quick and
remove real noise. Do them first.

## Explicitly out of scope

- **Reconciling the two attendance-rate formulas.** This screen avoids the disagreement by not
  showing a rate at all, for staff. That is a workaround, not a fix, and it is owned by the
  reports work.
- **The `GRADUATED` gap.** `students.total` is arithmetic `active + archived`
  (`dashboard.service.ts:65`), so a `GRADUATED` row silently drops out of every count. No
  write site exists for the value, so today no row can be affected — but the KPI is wrong the
  moment that lands. Owned by `student-graduation-sweep.md`.
- **Alerts to Telegram.** Delivery is the workflows' job. This screen only surfaces.
- **Per-branch KPI scoping.** `branches.service.ts:81-87` filters students on a `branch_id`
  that the `Student` entity does not have — it is added by raw `ALTER TABLE`, and the query
  carries an `@ts-expect-error`. Branch-scoping the dashboard inherits that. Single branch
  today, so it is not worth it yet.
- **A fee table.** `DEFAULT_MONTHLY_FEE` stays hardcoded. Two call sites is already wrong, but
  replacing it belongs to the billing work in wayfinder #37/#38, not here.

## Sibling loops worth specifying next

The alerts in Band 0 are the pull mirror of the four push workflows. Where one is missing, the
other should not invent it:

- `daily-attendance-oversight.md` → 🔴 unmarked classes. Same query as slice 3.
- `lead-followup.md` → a stale-lead alert, which this screen deliberately omits because the
  thresholds live in that spec.
- `announcement-broadcast.md` → nothing on this screen; it is a send flow, not a KPI.
- `student-graduation-sweep.md` → a graduation-pending alert once academic years exist.
