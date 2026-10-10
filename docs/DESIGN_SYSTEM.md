# Enterprise Automation Web App — Design System Board (DS v2.0)

> **Specification**: Enterprise Dark Mode Theme (Deep Slate & Grays)  
> **Primary Brand**: Tech-Focused Blue (`#2563EB` / `#3B82F6` / `#60A5FA`)  
> **Target Platform**: Desktop-First Responsive Web Application (`nis-school-crm` / Enterprise CRM)

---

## 🏛️ DS - 00 Overview

### 1. Design Principles

* **Density with Clarity (High Signal-to-Noise)**: Enterprise operators manage dense data sets (students, leads, transactions, audit logs). Every element on screen must earn its pixels. We minimize ornamental decoration and maximize contrast, legible data alignment, and contextual hierarchy.
* **Predictable Anatomies**: Every card, table, modal, and filter follows an identical structural rhythm across all 14+ modules. Operators never have to re-learn how a search bar filters or where actions live.
* **Deliberate Dark Mode Hierarchy**: Pure black (`#000000`) is avoided for surfaces to prevent ocular strain. We utilize a layered slate/neutral palette: dark canvas (`slate-950`), elevated container surfaces (`slate-900`), and interactive/floating surfaces (`slate-800`), with precision 1px borders (`slate-800` / `slate-700`).
* **Instant State Feedback**: Interactive surfaces react with crisp transitions (150ms ease-out) providing visible hover, active, focus-visible (2px blue offset ring), and disabled states adhering to WCAG 2.1 AA contrast requirements.
* **Type-Safe Design Tokens**: All design tokens map directly from Tailwind CSS configuration into atomic component props. No magic hex codes or arbitrary `bg-[#...]` classes inside page templates.

### 2. General Usage & Layout Rules

1. **Grid Baseline**: 4px micro-grid, 8px layout grid. Spacing values must strictly follow the token scale (`space-1` to `space-16`).
2. **Surface Elevation Rule**: Dark surfaces step lighter as they elevate toward the user:
   * Level 0 (Canvas Background): `#090D16` (Slate 950)
   * Level 1 (Cards, Tables, Panels): `#0F172A` (Slate 900)
   * Level 2 (Inputs, Sub-containers, Hover): `#1E293B` (Slate 800)
   * Level 3 (Dropdowns, Popovers, Modals): `#1E293B` with border `#334155`
3. **Card Consistency Rule**: All content modules must use the standardized `<Card>` composition (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`). Arbitrary standalone `<div className="bg-... p-...">` blocks are banned.
4. **Semantic Color Rule**: Color conveys state, never mere decoration. Tech Blue is reserved for primary actions and active navigation; Green for confirmed success/payments; Amber for warnings/arrears; Red for critical errors/overdue deadlines.

---

## 🎨 DS - 01 Color

### 1. Primitive Palette

#### Grayscale & Surface Scale (Deep Grays & Slate Tones)
| Step | Token | HEX | Role & Usage |
|---|---|---|---|
| **50** | `slate-50` | `#F8FAFC` | High-contrast primary text, prominent headlines |
| **100** | `slate-100` | `#F1F5F9` | Primary headings, KPI values |
| **200** | `slate-200` | `#E2E8F0` | Body text, card titles |
| **300** | `slate-300` | `#CBD5E1` | Secondary body text, form field values |
| **400** | `slate-400` | `#94A3B8` | Subdued captions, helper text, inactive icons |
| **500** | `slate-500` | `#64748B` | Input placeholders, subtle dividers |
| **600** | `slate-600` | `#475569` | Interactive border hover, separators |
| **700** | `slate-700` | `#334155` | Elevated borders, modal borders |
| **800** | `slate-800` | `#1E293B` | Table headers, secondary buttons, sub-surfaces |
| **900** | `slate-900` | `#0F172A` | Primary card & panel container surface |
| **950** | `slate-950` | `#090D16` | Root application canvas backdrop |

#### Primary Brand Scale (Tech-Focused Blue)
| Step | Token | HEX | Role |
|---|---|---|---|
| **50** | `blue-50` | `#EFF6FF` | Tints in specialized documentation |
| **100** | `blue-100` | `#DBEAFE` | High-contrast chip text |
| **200** | `blue-200` | `#BFDBFE` | Interactive focus state accent |
| **300** | `blue-300` | `#93C5FD` | Light link hover |
| **400** | `blue-400` | `#60A5FA` | Primary active text, active navigation icons |
| **500** | `blue-500` | `#3B82F6` | Primary hover state, brand highlight |
| **600** | `blue-600` | `#2563EB` | **Primary Brand Action** (`bg-blue-600`) |
| **700** | `blue-700` | `#1D4ED8` | Active/Pressed state (`active:bg-blue-700`) |
| **800** | `blue-800` | `#1E40AF` | Deep accent borders |
| **900** | `blue-900` | `#1E3A8A` | Glow backdrops, primary badge background (`15% opacity`) |

### 2. Semantic Roles & Tokens

```css
:root[data-theme="dark"] {
  /* Surfaces */
  --color-canvas-bg: #090D16;          /* App background */
  --color-surface-base: #0F172A;       /* Cards, Sidebar, AppHeader */
  --color-surface-elevated: #1E293B;   /* Modals, Dropdowns, Hovered rows */
  --color-surface-subtle: #172033;     /* Filter bars, table headers */

  /* Borders & Dividers */
  --color-border-subtle: #1E293B;      /* Card internal dividers */
  --color-border-default: #334155;     /* Card borders, input borders */
  --color-border-focus: #3B82F6;       /* Focus ring / active selection */

  /* Typography */
  --color-text-primary: #F8FAFC;       /* Headings, key figures */
  --color-text-secondary: #CBD5E1;     /* Main table cells, form labels */
  --color-text-muted: #94A3B8;         /* Timestamps, descriptions, subtitles */
  --color-text-disabled: #475569;      /* Disabled text */

  /* Interactive States */
  --color-action-primary: #2563EB;
  --color-action-primary-hover: #3B82F6;
  --color-action-secondary: #1E293B;
  --color-action-secondary-hover: #334155;

  /* Status Tokens */
  --color-status-success: #10B981;     /* Emerald 500 */
  --color-status-success-bg: rgba(16, 185, 129, 0.12);
  --color-status-warning: #F59E0B;     /* Amber 500 */
  --color-status-warning-bg: rgba(245, 158, 11, 0.12);
  --color-status-error: #EF4444;       /* Red 500 */
  --color-status-error-bg: rgba(239, 68, 68, 0.12);
  --color-status-info: #06B6D4;        /* Cyan 500 */
  --color-status-info-bg: rgba(6, 182, 212, 0.12);
}
```

---

## 🔤 DS - 02 Typography

### 1. Type Scale Hierarchy

* **Font Family**: `Inter`, `Onest`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif` (with `font-feature-settings: 'tnum' on, 'cv05' on`).

| Level | Size | Line Height | Weight | Class Pattern | Usage |
|---|---|---|---|---|---|
| **Display H1** | `32px` (`2rem`) | `38px` | Bold (`700`) | `text-2xl lg:text-3xl font-bold text-slate-100 tracking-tight` | Page main headers |
| **Section H2** | `24px` (`1.5rem`) | `30px` | Semibold (`600`) | `text-xl lg:text-2xl font-semibold text-slate-100` | Card section headers, Modals |
| **Card H3** | `18px` (`1.125rem`) | `24px` | Semibold (`600`) | `text-lg font-semibold text-slate-200` | Panel titles, Kanban headers |
| **Subheading H4** | `15px` (`0.9375rem`)| `20px` | Medium (`500`) | `text-[15px] font-medium text-slate-300` | Sub-sections, grouped lists |
| **Body Large** | `16px` (`1rem`) | `24px` | Regular (`400`) | `text-base text-slate-200` | Instructions, descriptions |
| **Body Regular** | `14px` (`0.875rem`)| `20px` | Regular (`400`) | `text-sm text-slate-300` | Table cell text, form values |
| **Body Medium** | `14px` (`0.875rem`)| `20px` | Medium (`500`) | `text-sm font-medium text-slate-200` | Key table cells, buttons |
| **Caption / Label** | `12px` (`0.75rem`) | `16px` | Medium (`500`) | `text-xs font-medium text-slate-400` | Field labels, column headers |
| **Micro / Badge** | `11px` (`0.6875rem`)| `14px` | Semibold (`600`) | `text-[11px] font-semibold uppercase tracking-wider` | Status badges, pills |

---

## 📐 DS - 03 Foundations

### 1. Spacing Tokens
- `space-1` (4px): Micro icon offset, compact tag padding
- `space-2` (8px): Button gap, input vertical padding
- `space-3` (12px): Form gap, compact card padding
- `space-4` (16px): Card inner padding, table row height spacing
- `space-5` (20px): Card header padding, modal header gap
- `space-6` (24px): Standard page grid gap, modal padding
- `space-8` (32px): Major section separation

### 2. Border Radius Tokens
- `rounded-sm` (4px): Badges, micro tooltips
- `rounded-md` (6px): Input fields, select triggers, buttons
- `rounded-lg` (8px): Standard cards, dropdown menus
- `rounded-xl` (12px): Modals, major panels, kanban columns
- `rounded-full` (9999px): Avatars, status pills

### 3. Shadows & Elevation
- `shadow-dark-sm`: `0 1px 3px 0 rgba(0, 0, 0, 0.4)` + `border border-slate-800`
- `shadow-dark-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.5)` + `border border-slate-700`
- `shadow-dark-lg`: `0 10px 25px -5px rgba(0, 0, 0, 0.7)` + `border border-slate-700`

---

## 🧩 DS - 04 Component Usage

### 1. Unified Card Anatomy
All cards must use compound subcomponents:
- `<Card>`: Outer container with `rounded-lg border border-slate-800 bg-slate-900 shadow-dark-sm`
- `<CardHeader>`: Header container with optional action slot
- `<CardTitle>`: Standardized typography (`text-base lg:text-lg font-semibold text-slate-100`)
- `<CardDescription>`: Subtitle with muted styling (`text-xs text-slate-400`)
- `<CardContent>`: Main content area (`p-4` or `p-5`)
- `<CardFooter>`: Footer metadata or secondary actions (`border-t border-slate-800/80 pt-3`)

---

## 🛠️ DS - 05 Components Library

### 1. Button Variants
- **Primary**: `bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-sm font-semibold rounded-md`
- **Secondary**: `bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-medium rounded-md`
- **Ghost**: `hover:bg-slate-800 text-slate-300 hover:text-white rounded-md`
- **Danger**: `bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white font-medium rounded-md`

### 2. Input Fields
- `bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-md px-3.5 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500`

### 3. Status Badges
- **Active**: `bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`
- **Warning**: `bg-amber-500/10 text-amber-400 border border-amber-500/20`
- **Error**: `bg-red-500/10 text-red-400 border border-red-500/20`
- **Info**: `bg-blue-500/10 text-blue-400 border border-blue-500/20`
- **Neutral**: `bg-slate-800 text-slate-400 border border-slate-700`
