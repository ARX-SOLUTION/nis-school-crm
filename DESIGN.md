# DESIGN.md — Nordic International School CRM

> Design direction for NIS School CRM (Nordic International School, Tashkent).
> Applied by AI coding agents under the `/antislop`, `/antislop-ui`, and `/frontend-design` rules.

---

## 1. Identity & Mood

- **Product:** Comprehensive Academic & Operational CRM for Nordic International School (Tashkent).
- **Users:** School Principals, Administrators, Academic Managers, Class Teachers, Subject Teachers, and Parents.
- **Personality:** Calm, disciplined, trustworthy, precise, and transparent. Scandinavian functionalism married with educational clarity.
- **Tone of Voice:** Active voice, professional, clean English interface copy. No buzzwords, no decorative marketing fluff, no em dashes.

---

## 2. Three Dials (antislop-ui)

- **ENERGY: 1 (Calm)** — Predictable, restful, daylight-first surfaces. No fluorescent accents, no dark-mode tech cliches.
- **RHYTHM: 2 (Balanced)** — Consistent structured tables, clean cards, with deliberate asymmetric breaks for the weekly schedule grid and key student records.
- **MOTION: 1 (Functional)** — Micro-interactions on click, focus rings, modal entry/exit only. Zero continuous looping animations or pulses.

---

## 3. Color Token System

Restrained Nordic palette (Core: 2 base + 1 primary accent + 3 semantic status markers):

```
Base Surfaces:
  --bg-app:        #F8FAFC (Slate 50 — clean Arctic Birch ground)
  --bg-surface:    #FFFFFF (White — card & dialog surfaces)
  --border-subtle: #E2E8F0 (Slate 200 — hairline partition rules)
  --text-primary:  #0F172A (Slate 900 — high contrast header & reading)
  --text-muted:    #64748B (Slate 500 — secondary annotations & timestamps)

Primary Accent (Used only for deliberate key actions):
  --accent-nordic: #1D4ED8 (Royal Nordic Blue — primary buttons & active navigation)
  --accent-hover:  #1E40AF (Deep Nordic Blue — hover state)

Semantic Status Markers:
  --status-active: #047857 (Sage Forest — active students, on-time attendance)
  --status-warn:   #B45309 (Amber Ochre — unassigned classes, pending telegram links)
  --status-danger: #B91C1C (Nordic Berry / Crimson — archived, absent, destructive)
```

No generic blue-purple gradients. No multi-colored glowing cards.

---

## 4. Typography Scale

- **Font Family:** `Inter`, system-ui, -apple-system, sans-serif. High legibility, neutral numbers.
- **Rules:**
  - Page Titles: `text-2xl font-semibold tracking-tight text-slate-900`
  - Section Headings: `text-base font-semibold text-slate-900`
  - Data Labels: `text-xs font-medium uppercase tracking-wider text-slate-500`
  - Body Text: `text-sm text-slate-700`
  - Max Line Length: 75 characters for prose/descriptions.
  - **ABSOLUTE BAN:** Em dash (`—`) is strictly forbidden across all UI text (R-02). Use colons, parentheses, or separate badges.

---

## 5. Layout & Components

- **Shell:**
  - Desktop: Clean top navbar or unified sidebar with clear hierarchy, school badge, role pill, user details, and Sign Out.
  - Mobile: Touch-friendly header with hamburger trigger opening a responsive slide-over drawer navigation.
- **Buttons & Tap Targets (R-03):**
  - Minimum tap target of 44px on all touch surfaces.
  - Focused elements must show high-contrast visible ring (`focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2`).
- **Data States (R-27):**
  - Every view must have three robust states: Empty (with helpful explanation and clear action), Loading (with `aria-busy="true"` indicator), and Error (with user-facing reason and Retry button).
- **Navigation (R-24 & R-26):**
  - No links to non-existent pages. Every button and link must perform a verifiable action.
