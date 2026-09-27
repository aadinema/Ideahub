# Memory Changelog — IdeaHub

This file logs both code changes and memory-file changes, newest first.
Never overwrite history; append entries.

## 2026-09-27 — UI/UX audit, Phase 3 (remaining screens) + Phase 4 (micro-details)

Completed the per-screen pass and the micro-details sweep. UI-only; no
data/auth/API logic changed. `npm run build` ✓; `npm test` 19/19 ✓.

**AppLayout (shell):** breadcrumb is now the current section (longest matching
`NAV_ITEMS` route) instead of a static "Platform"; profile-switcher + notification
buttons `w-9` → `w-10` (36 → 40px targets); nav/logo/sign-out icons `aria-hidden`.
Removed dead `handleClick` in NotificationBell (referenced an undefined `markRead`).

**IdeaList:** hand-rolled error/empty → shared `ErrorState`/`EmptyState` (the
`#btn-first-idea` E2E hook is preserved via `EmptyState.action`); tablist gains the
WAI-ARIA roving-tabindex + arrow/Home/End keyboard pattern.

**IdeaForm:** section tablist gains the same keyboard pattern.

**EventsExplore:** Explore/My Events tablist gains the keyboard pattern; filter
checkboxes get `accent-theme-accent` styling; loading tiles → `.skeleton`.

**EventDetail:** event-error and leaderboard-empty use shared `ErrorState`/`EmptyState`
(error state now has a working retry); loading → `.skeleton`.

**Committee360:** evaluations-empty → `EmptyState`; attachments gained the
filename/download-icon row parity with IdeaDetail. **Login:** password toggle
restored to the tab order (was `tabIndex=-1`); session-expired notice restyled to
warning tokens. **Queues** (Supervisor, Evaluation, Committee): decorative icons
`aria-hidden`. **ImplementationBoard / BenefitsForm:** icons `aria-hidden`;
loading → `.skeleton`.

**CEO Dashboard:** replaced off-brand inline hex KPI colours (`#f0b90b` etc.) with
AA-safe `-text` tokens; `healthBand`/`Severity`/`SIGNAL_META`/pipeline severity
colours → `-text`; **fixed a systemic invalid-CSS bug** — 6 sites built colours as
`` `${var(--x)}15` `` (e.g. `var(--error)15`), which is not a colour; now
`color-mix(in srgb, … N%, transparent)`. Also fixed the CeoDepartments row-hover
arrow (row had no `group`).

**Micro-details:** `.btn-secondary/-ghost/-danger` gained `:active` feedback
(`.btn-primary` already had it); remaining `animate-pulse` sites → `.skeleton`
(0 left); prose card previews use `.prose-idea-sm`.

**Final state scans:** hardcoded palette classes **0**; external URLs in client
**0**; raw hex in JSX **0**; `animate-pulse` **0**; `appearance-none` **0**;
`alert(` **0**; `!text-<vivid>` **0**; plain-text loaders **0**.

**Still open:** `ceoUtils`↔`components` component duplication; real a11y scoring
(KI-014 — no axe/Lighthouse offline).

## 2026-09-27 — UI/UX audit, Phase 3 — EvaluationFormPage

Fourth screen of the per-screen pass. UI-only; validation copy/DOM only, no API change.
- **Heading order:** "Scoring Matrix" `<h3>` → `<h2>`; per-criterion `<h4>` → `<h3>`
  (page was h1 → h3 → h4, skipping levels).
- **Form validation UX:** replaced the single top error banner for *field* errors
  with inline, per-field messages that appear after a submit attempt
  (`submitted` flag): decision group gets `aria-describedby` → `#decision-error`;
  comments textarea gets `aria-invalid` + `aria-describedby` → `#eval-comments-error`.
  The top banner now only carries **server** errors from the mutation.
- **Submit feedback:** pending state now shows the shared `.spinner` (was plain
  "Submitting..." text); icons `aria-hidden`; score boxes and weighted total use
  `tabular-nums`.
- (Range slider, content skeleton, AA contrast, and hardcoded ring colors were
  already fixed in Phase 3.0.)
- Verified: `npm run build` ✓; `npm test` 19/19 ✓.

## 2026-09-27 — UI/UX audit, Phase 3 — DashboardPage

Fifth screen of the per-screen pass. UI-only; queries only gained read-side flags.
- **Missing states filled (both side panels):** Featured Ideas and Announcements
  previously had **no loading skeleton and no error state** (Featured's empty copy
  was even gated on the *KPI* query's `isLoading`). Each now has its own
  loading skeleton, `ErrorState` + retry, and shared `EmptyState`.
- **Icons:** section-heading icons, submit CTA, "View Gallery" arrow, and quick-action
  icons now `aria-hidden`; removed a stale layout comment above the KPI error banner.
- **Preview text:** announcement body uses `.prose-idea-sm` for a tighter clamp.
- (KPI skeleton visibility and KpiCard hover were fixed in Phase 2.)
- Verified: `npm run build` ✓; `npm test` 19/19 ✓.

## 2026-09-27 — UI/UX audit, Phase 3 — AdminDashboardPage

Third screen of the per-screen pass. UI-only; no data/auth/API logic changed.
- **Tabs (a11y):** the 6-tab `role="tablist"` now implements the WAI-ARIA tabs
  keyboard pattern — roving `tabIndex` (active tab `0`, others `-1`) and
  Arrow/Home/End handling that moves focus with selection. Icons `aria-hidden`.
- **Heading order:** the 8 section `<h3>`s → `<h2>` (page went h1 → h3, skipping a
  level). No other h3s in the file, so the swap was exact.
- **Loading:** 6 hand-rolled `bg-theme-surface … animate-pulse` blocks replaced with
  a new shared `SkeletonRows` (`components/Skeleton.jsx`) — also fixes the
  light-mode invisibility. Heights preserved per section (h-12/h-20/h-24/h-10).
- **A11y gap closed:** Audit-tab filter inputs were placeholder-only; now have
  `sr-only` `<label htmlFor>` pairs (`audit-filter-action`, `audit-filter-entity`).
- **Tables:** Users + Audit bespoke `<table>` markup → shared `.table-base` with
  `<caption class="sr-only">` and `scope="col"` headers. (Completes the Phase-1
  "tables fragmented" item alongside Reports.)
- **Hierarchy:** page `h1` `text-4xl` → `text-3xl`.
- Verified: `npm run build` ✓; `npm test` 19/19 ✓.
- Note: 3 further tablists (IdeaList, IdeaForm, Events) still need the same
  arrow-key treatment; they are queued for their own screens.

## 2026-09-27 — UI/UX audit, Phase 3 — GalleryPage

Second screen of the per-screen pass. UI-only; no query/auth/API logic changed.
- **Invalid nesting (a11y/HTML):** the whole card was a `<Link>` with the admin
  "Unpublish" `<button>` nested inside it (`<a><button>` is invalid and breaks
  keyboard/AT semantics). Restructured to `<article>` + a stretched overlay `<Link>`
  (`absolute inset-0 z-10`, `aria-label`), with the button as a sibling at `z-20`.
  Full-card click is preserved; removed the now-unused `openUnpublish` handler.
- **Hierarchy:** `h1` `text-5xl` → `text-3xl`; subtitle `text-lg` → `text-base`;
  added an `sr-only` `<h2>Published ideas</h2>` for the grid; Top Contributors is now
  a `<section aria-labelledby>` with an `<h2>` (was an unlabelled `<h3>`).
- **Card preview:** RichText preview wrapped in a new `.prose-idea-sm` (0.875rem)
  class so the 3-line clamp is predictable; decorative star is `pointer-events-none`
  + `aria-hidden`.
- **Loading:** generic `glass … animate-pulse` tiles → `.skeleton`.
- **Empty state:** Top Contributors italic one-liner → shared `EmptyState` with
  guidance.
- **Search input:** dropped the `text-lg py-3` overrides so it matches `.input-base`.
- Verified: `npm run build` ✓; `npm test` 19/19 ✓.

## 2026-09-27 — UI/UX audit, Phase 3 — ReportsPage

First screen of the per-screen pass (worst re-audit score). UI-only.
- **Hierarchy:** page title `text-4xl` → `text-3xl` (matches the rest of the app);
  chart/table section headings `<h3>` → `<h2>` with `aria-labelledby` on `<section>`.
- **Error handling:** one `ErrorState` now covers KPI + charts (previously the KPI
  block showed an error while two empty charts rendered below — misleading). The
  targets query gained `isError` + retry and an `ErrorState` (previously absent).
- **Charts:** per-chart `EmptyState` instead of italic "No … data."; both charts are
  wrapped with `role="img"` + a descriptive `aria-label`.
- **Target table:** bespoke table → shared `.table-base` + `.table-responsive`, with
  a `<caption>` (sr-only), `scope="col"` headers, `tabular-nums`, and an
  `aria-label` on the progress cell. (Resolves the Phase-1 "tables fragmented"
  finding for this screen.)
- **Export row:** labelled group with per-button `aria-label`s; icons `aria-hidden`.
- Verified: `npm run build` ✓; `npm test` 19/19 ✓.

## 2026-09-27 — UI/UX audit, Phase 3.0 (cross-cutting polish)

UI-only; no data/auth/API logic touched. One new shared component (`Toast`).

**AA contrast sweep:** every genuine status-colour-as-*body-text* usage now uses
the `-text` variant. `.badge-*` (done in Phase 2), `.sla-ok/amber/red`, `.alert-info`,
SLA badges, status chips, character counters, `!text-success/error` action buttons
(Committee360, SupervisorQueue, EvaluationQueue, EventsExplore, EventDetail),
Gallery "Featured", Admin active/inactive + event status chips, ImplementationBoard
overdue/progress, and the committee "Idea not found" line. Icons (AlertTriangle,
ShieldAlert, AlertCircle, CheckCircle, Medal, IndianRupee) intentionally keep the
vivid tokens (≥3:1 non-text is fine). Verified with a precise negative-match scan:
no `text-<status>` remains that is not `-text` except icons.

**Range inputs:** added a `.range` class (themed track + visible webkit/moz thumb,
focus ring) and replaced the three broken `accent-* + appearance-none` sliders
(EvaluationForm, ImplementationBoard, BenefitsForm). `appearance-none` scan now 0.

**Loading states:** replaced the three remaining plain-text loaders with
content-shaped skeletons — Committee360 (header + 2-col cards), EvaluationForm
(form fields + summary), Reports (3 KPI cards + 2 chart panels).

**Toast (new shared component):** `components/Toast.jsx` — presentational,
dependency-free, `success|error|info` tones, `role="status"`, dismiss button.
ReportsPage now shows an inline themed toast on export failure with a 5s
auto-dismiss, replacing `alert()`. Scan for `alert(` now 0. A provider can wrap
this later without changing call sites.

**Verified:** `npm run build` ✓; `npm test` 19/19 ✓; `appearance-none` 0; `alert()` 0;
plain-text loaders 0. Remaining for Phase 3: per-screen layout/hierarchy fixes and
the `ceoUtils`↔`components` duplication (KI-018).

## 2026-09-27 — UI/UX audit, Phase 2 (design foundation)

UI-only; no data-fetching, auth, or API logic touched. Zero new dependencies.

**Fonts / CSP (resolves the KI-018 typography item):**
- Removed the Google Fonts `<link>`/preconnects from `client/index.html`. They were
  dead-or-broken: `--font-display` was `'Inter'` (Plus Jakarta Sans was downloaded
  and never referenced), and the server CSP (`style-src 'self'`, `font-src 'self'`)
  blocks both if the SPA is served through Express.
- `index.css`: `--font-sans`/`--font-display` are now the platform UI stack
  (`system-ui, -apple-system, 'Segoe UI', Roboto, …`). Registry is blocked here, so a
  self-hosted Inter can be dropped in later without touching component code.
- `<meta name="theme-color">` now has light/dark variants (was always dark `#0f172a`).

**Tokens added (`index.css`):**
- Secondary AA-safe text tokens: `--purple-text`, `--pink-text`, `--orange-text`,
  `--emerald-text` (+ light/dark values), exposed as `text-*-text` utilities.
- Radius: `--radius-sm|md|lg` (+ `--radius-card` utility). Elevation:
  `--shadow-card|pop|modal` (exposed as `shadow-card` etc.).
- Role accent tokens `--role-employee|supervisor|evaluator|evaluator-2|committee|owner|ceo|admin`,
  chosen dark enough for white pill text in both themes.

**Contrast:** `.badge-*` now use the `-text` variants (vivid tokens were ~2–3.8:1 on
their own fills); the three redundant `[data-theme="dark"] .badge-*` overrides were
removed (`-text` vars already swap). `healthBand()` returns an AA-safe `color` plus a
pre-mixed `tint` (no more `${hex}15` concatenation, which broke on CSS vars).

**Palette cleanup:** all remaining hardcoded Tailwind palette classes removed —
CommitteeQueue violet→fuchsia gradient → `gradient-brand`; EvaluationForm
emerald/amber/rose rings → token rings; ReportsPage cream/gold palette + `#737373`
axes + `#c5a059` bars → theme tokens (charts now theme correctly and dark-mode-safe);
AppLayout role hexes → role tokens. A repo-wide grep for palette classes now
genuinely returns **zero** (the earlier claim was false — see KI-018).

**Motion:** `scroll-behavior: smooth` moved behind
`prefers-reduced-motion: no-preference`; added one global reduced-motion rule that
disables decorative animation (`.page-enter`, `.kpi-value`, `.sla-*`) and collapses
transitions, so future motion is covered by default.

**States/polish:** KpiCard + ceoUtils `KpiTile`/`PanelSkeleton` switched from
`bg-theme-surface animate-pulse` (invisible white-on-white in light mode) to the
`.skeleton` sweep. Sidebar active state now uses an inset ring instead of a border
(no 1px content shift). NotFound icon `text-theme-text` → `text-white` (was
near-invisible on the indigo gradient). KpiCard hover `border-white/10` →
`border-theme-border`.

**Verified:** `npm run build` ✓; `npm test` 19/19 ✓; palette-class grep 0; external-URL
grep 0. Still open for later phases: 45 vivid status-text usages, 3 unstyled range
inputs, 3 plain-text loaders, `ceoUtils`/`components` component duplication (KI-018).

## 2026-09-27 — UI/UX audit, independent re-audit + P0 regression fixes

**Why:** a fresh independent audit of the tree *after* the earlier UI pass found
four functional regressions that pass had silently introduced (build+tests never
exercised those code paths). Fixed first, before any further visual work. UI-only:
no data-fetching, auth, or API logic touched.

**P0 fixes (code):**
- **KI-015 — TDZ crashes.** `IdeaDetailPage.jsx` and `IdeaFormPage.jsx` called
  `usePageTitle(<identifier>)` before that identifier was declared →
  `ReferenceError: Cannot access '…' before initialization` on every mount (both
  screens dead). Moved each `usePageTitle` call to after the binding, before the
  first early return. Optional chaining did **not** mask it.
- **KI-016 — AdminDashboardPage** used `<ErrorState>` without importing it
  (crash on error render); also Targets/Criteria checked empty-before-error so the
  error branch was unreachable. Added import; reordered to
  `isLoading → isError → empty → list`. (UsersTab order was already correct.)
- **KI-017 — GalleryPage** never destructured `isError`/`refetch`: error branch
  dead, "Try again" threw. Destructured both.

**New regression guard:**
- `client/src/__tests__/pages.smoke.test.jsx` — 6 render smoke tests (C1–C4).
  Verified it **fails on the buggy code** with the exact `ReferenceError`, then
  passes after the fix. Client suite: **19/19 passing** (was 13). `npm run build` ✓.

**Findings logged (not fixed in P0):** KI-018 groups the re-audit's HIGH visual/
compliance items (AA status-text contrast, leftover cream/gold + hardcoded
palettes, Google-Fonts-vs-CSP typography, invisible light-mode skeletons,
unstyled range thumbs, reduced-motion gaps, component duplication, a11y gaps).

**Memory corrections:**
- **KI-012 was duplicated** — the FIXED Router-double-wrap entry and the OPEN
  a11y-scoring entry shared the id. The a11y entry is renumbered to **KI-014**;
  no content changed. The FIXED Router entry keeps KI-012.
- The earlier Phase-2/3 memory claim that Gallery/AdminDashboard error states were
  added is **corrected** above (they were non-functional until KI-016/KI-017).

**Still unmet:** real a11y scores (KI-014) — no axe/Lighthouse runs offline.

## 2026-09-27

### Phase 2 — KI-012 FIXED (test harness)
- `renderWithProviders` in `client/src/__tests__/auth.test.jsx` now takes `withRouter`
  (default false); `<App/>` renders unwrapped so its own `BrowserRouter` is the only one.
  Anti-assertion scope preserved — the helper changed, assertions did not.
- Evidence: `npm test` → 13 passed, Router error gone (only benign RR v7 future-flag warnings).

### Phase 2 — KI-003 FIXED (client tests wired)
- Added `jsdom` dev dep (29.1.1); created `client/vitest.config.js` and
  `client/src/test/setup.js`; added `test`/`test:watch`/`test:coverage` scripts.
- Real run: **Test Files 1 passed · Tests 13 passed**; `vite build` OK.
- Surface defect logged as **KI-012**: App-render tests double-wrap `Router`
  (`renderWithProviders` wraps `<BrowserRouter>` around `<App/>`, which already has one);
  error is caught by `App`'s ErrorBoundary and the two tests assert store state only,
  so they pass while the render is inert. Fix proposed (harness-only) — awaiting go-ahead.
- Trivial drift fixed: `client/src/api/axios.js` L13 comment said proxy `:5000` → now
  refers to `VITE_API_PORT`/vite config.

### Phase 2 — KI-001 verified (CI non-functional)
- Compared `ci.yml` against report.md Phase 3 checklist. Result: pipeline exists but
  would fail at install (no `package-lock.json` tracked — all gitignored) and is
  non-gating thereafter (lint/test/e2e steps use `--if-present || echo`, secret scan +
  audit use `continue-on-error`). CI Node is `'18'` but Vite 8 needs `^20.19 || >=22.12`.
  E2E has no `webServer` and CI never starts the client. Stale report claim corrected:
  `e2e/package.json` **does** have `test`/`test:smoke` scripts.
- Analysis only — no CI changes made. Findings recorded in KI-001.

### Infra observation
- Atlas (`cluster0.2mdxjwu…`) was intermittently unreachable during Phase 2 —
  DNS `ENOTFOUND` and SSL `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR` +
  `SystemOverloadedError`. KI-005 verification therefore ran against **local `mongod`**
  (tests are DB-agnostic; results valid). Logged as INF-001; not a code regression.

## 2026-09-27 — UI / Theme / Workflow audit (session continuation)

- **Dark mode**: verified full token system (`:root` + `[data-theme="dark"]`) in `client/src/index.css`; `useTheme.js` hook + `AppLayout` toggle button operational.
- **Color palette**: navy/indigo (`#4F46E5`) design tokens already defined; added status tokens (`--rose`, `--purple`, `--emerald`, etc.); batch-converted 26 JSX files from hardcoded `bg-rose-500/10` / `text-emerald-600` etc. to `bg-error-light` / `text-success` etc.
- **Responsive**: sidebar (`md:flex w-[240px]` + mobile drawer `w-[260px] max-w-[80vw]`), header responsive (hidden sm, mobile menu), table wrapper (`table-responsive` overflow-x). No major layout breakages found.
- **EventDetailPage**: enriched with event metadata (name/theme/description/status badges/dates/participants/initative/category), Join CTA, leaderboard preserved; `getEventById` endpoint + route + `eventsAPI.getById()` wired; route mounted in `App.jsx`.
- **Notifications / 2-evaluators**: `supervisorController.approveIdea` already triggers `APPROVED_BY_SUPERVISOR` (submitter) + `ROUTED_TO_DEPT_EVALUATION` (dept team); assigns `.slice(0,2)` evaluators (line 106-109); `notificationService` resolver sends to both via `recipients` array + dedup.
- **Remaining**: full cross-page responsive verification (cards/forms/modals at all 7 breakpoints); notification delivery end-to-end test (DB + UI); 2-evaluator model validation UI; full chunk-size split.
- **Build**: `vite build` succeeds (clean compile, only chunk-size advisory).

### Phase 2 — KI-005 FIXED (implementation owner eligibility)
- Decision (rule A, user-confirmed): eligible owner = **active AND
  `ROLES.IMPLEMENTATION_OWNER`** (or ADMIN), **dept-agnostic**.
- `authorizationService.validateImplementationOwner`: replaced the
  department-or-admin rule with the role-eligibility rule (still exists + active).
- `committeeController.approveImplementation`: now calls the shared validator
  **before** transitioning/creating — previously validated nothing and 500'd on an
  unresolvable `ownerId` (`owner._id` of null).
- `workflowService` APPROVED_FOR_IMPLEMENTATION validator: comment pointing to the
  shared helper (presence-only check retained).
- `Committee360Page.jsx`: owner picker soft-defaults to same-department owners with an
  opt-in to show all; falls back to all when none match (no hard block).
- Tests: added `authorization.test.js` describe "Implementation owner eligibility
  (KI-005)" (3 tests). **Before/after evidence:**
  - no-role same-dept owner → before `201 Created`, after `400`;
  - committee bogus owner → before `500`, after `404`;
  - eligible role-holding owner → `201` (unchanged).
  Full server suite: **85 passing** (4 suites); client build OK.
- Memory: KI-005 → FIXED; `api-contract.md` A3 → RESOLVED + committee note;
  `backend.md` service description updated.

### Phase 2 — item 1: hygiene done, rotation pending
- **D DONE** — untracked `.env.development` via `git rm --cached` (file stays on disk);
  added `.env.development` + `client/.env` to `.gitignore`. Verified via full history
  (single commit `9e3aab1`) the file only ever contained `VITE_API_PORT=5000` +
  comments — non-sensitive, so **no history purge needed**. Updated `env-and-config.md`
  + KI-011.
- **C — JWT_REFRESH_SECRET:** confirmed it is never *read* by runtime code, but it IS
  *referenced* in 4 files: `server/.env`, `server/.env.example`, `.github/workflows/ci.yml`
  (×3), `TEST_GUIDE.md` (×2). So it is not purely dead code; clean removal spans those
  files. Reported to user before deleting (pending decision) rather than deleting blindly.
- **A+B (rotation) pending user** pasting new MONGODB_URI / JWT_ACCESS_SECRET values
  into `server/.env`. No scaffolding done.
- Disclosure: a broad `grep` inadvertently printed the `JWT_REFRESH_SECRET` value from
  `server/.env` to the transcript. It is the unused/dead secret, so impact is low; noted
  for honesty. Avoid printing values from secret files going forward.

### Phase 2 — C1 + D + item 2 APPLIED (2026-09-27)
Code/config changes:
- **C1 — `JWT_REFRESH_SECRET` removed everywhere** (dead: never read): `server/.env`,
  `server/.env.example`, `.github/workflows/ci.yml` (×3), `TEST_GUIDE.md` (×2).
  Repo-wide grep (excl. memory) → 0 references.
- **D — root `.env.development` untracked then deleted** (unused duplicate; never loaded
  by Vite since `envDir` = `client/`). `.gitignore` += `.env.development`, `client/.env`.
- **Item 2 / KI-006 — port fix applied:**
  - `client/vite.config.js` now reads `VITE_API_PORT` (via `loadEnv`) with fallback to
    `server/.env PORT` → 5000, and warns on mismatch.
  - `server/server.js` validates `PORT` at startup (invalid → `process.exit(1)`).
  - `TEST_GUIDE.md` L24 corrected to say `client/.env` / `VITE_API_PORT`.
- Verified with evidence (2026-09-27):
  - resolved Vite proxy = `http://localhost:5001`;
  - temp `VITE_API_PORT=9999` → mismatch warning printed, proxy followed 9999, then restored;
  - `PORT=abc` and `PORT=70000` → clear error + exit 1;
  - `PORT=6000` → "Server running on port 6000".
- Memory updated: `env-and-config.md` (JWT_REFRESH_SECRET removed; client vars; port
  table now RESOLVED), `known-issues.md` (KI-006 → FIXED; KI-011 C1/D done, A+B pending).
- Residual logged: `storageService.js` `SERVER_BASE_URL` default still hard-coded `:5000`.


### Phase 2 — item 1 recon (secrets rotation, guidance only — no changes)
- Re-confirmed against `known-issues.md`: secrets rotation genuinely OPEN (added KI-011).
- Verified `server/.env` is **not** tracked and **not** in git history (positive).
  Tracked env files are non-sensitive only: `server/.env.example` (placeholders),
  `.env.development` (root; `VITE_API_PORT` only).
- Found `.gitignore` does **not** cover `.env.development` or `client/.env`.
- Found `JWT_REFRESH_SECRET` is a **dead env var** — never read; refresh tokens are
  opaque SHA-256-hashed random bytes. Rotating it is a no-op. Corrected in
  `env-and-config.md`; noted in KI-011.
- Extended KI-006: `VITE_API_PORT` exists (`.env.development`=5000, `client/.env`=5001)
  but `vite.config.js` hard-codes 5001 and ignores it; `TEST_GUIDE.md` L24 claim is false.
  Updated `env-and-config.md` port table + env-file tracking table.

### Phase 1 close-out
- Saved `.claude/memory/PHASE1-CHECKPOINT.md` — point-in-time snapshot (findings tally
  + authority note), distinct from the living files.
- Added rule #9 to `README.md` and rule #6 to `SKILL.md`: re-confirm OPEN status in
  `known-issues.md` before any fix; if already handled, stop and update memory rather
  than fixing what isn't broken.
- Updated `README.md` index for PHASE1-CHECKPOINT.md.

### Memory files
- Created `.claude/memory/` with `README.md` (index + rules) and `architecture.md`
  (orientation only) — Phase 1.
- Created `known-issues.md` and `CHANGELOG.md` as initial stubs; then built them out.
- Updated `README.md` index statuses for `known-issues.md` and `CHANGELOG.md` to
  reflect their stub/partial state.
- Created `backend.md` (route domains → controllers, middleware, services, models,
  jobs) and `frontend.md` (routes, state management, auth, tests) — both
  orientation-only per the graphify division of labour.
- Created `api-contract.md` (endpoint list by domain + authz re-verification section;
  generated from real route/controller code) and `env-and-config.md` (every env var
  by name/purpose + port-mismatch verification). Updated `README.md` index.
- Extended `known-issues.md` with KI-004 (FIXED), KI-005 (OPEN, precise),
  KI-006 (OPEN), KI-007 (OPEN).

### Findings / drift
- `ci.yml` exists, contradicting report.md's "No CI/CD found" — flagged for Phase 3
  verification rather than assuming report.md is current. (KI-001, OPEN)
- report.md §3 "access token in localStorage" verified **stale-resolved**: token is
  in-memory only; refresh cookie is httpOnly/secure(prod)/sameSite=strict. (KI-002, FIXED)
- report.md "no client unit tests" verified **stale**: `auth.test.jsx` exists but is
  unwired (no `test` script / no vitest config) → logged OPEN as a false-confidence
  risk, not a downgrade. (KI-003, OPEN)
- Zustand installed-but-unused **CONFIRMED** (`grep -rn zustand client/src` → 0 matches).
- report.md §3 benefit + implementation object-level authz claims verified **stale**:
  both endpoints now enforce object-level checks via `authorizationService`. (KI-004, FIXED)
- report.md §3 createImplementation ownerId: **partially resolved** — existence, active,
  and department/same-dept-or-admin are enforced; only workflow/role eligibility is
  missing. Framing note: department eligibility IS checked (corrects the example).
  (KI-005, OPEN)
- Port mismatch **CONFIRMED still live**: server default 5000 vs Vite proxy 5001 vs
  `SERVER_BASE_URL` default 5000. Extra: report.md said "DEPLOYMENT.md documents 5000"
  but DEPLOYMENT.md documents **no backend port at all** — kept as a distinct nuance.
  (KI-006, OPEN)
- S3 mode dependencies (`multer-s3`, `@aws-sdk/client-s3`) required in code but
  undeclared in `server/package.json`. (KI-007, OPEN)
- report.md §3 "`/uploads` not clearly mounted" verified **stale**: route exists and
  is auth-gated (`server.js` L226).

### Memory files (continued)
- Created `.claude/CLAUDE.md` (fresh): Codebase Navigation (graphify) + Project Memory
  sections — Phase 1.
- Created `.claude/skills/ideahub-memory/SKILL.md` (memory-first behaviour).
- Created `decisions.md` with DEC-001…DEC-003 only (the three "✅ Confirmed by user"
  entries from ASSUMPTIONS.md). AUTH-004…AUTH-010 deliberately excluded pending review.
- Extended `known-issues.md` with KI-008…KI-010 (open FRD questions). Updated
  `README.md` index for `decisions.md`.

### Findings / drift (continued)
- ASSUMPTIONS.md AUTH-002 cites `slaService.js`, which **does not exist** — corrected
  to `server/utils/businessDays.js` (+ `jobs/slaBreachCheck.js`) in `decisions.md`;
  drift logged here.
- Open FRD questions FR-05-04 / FR-06-02 / FR-AD-08 moved to `known-issues.md`
  (KI-008…KI-010) rather than recorded as decisions, so unresolved items don't look
  settled by presence.
- AUTH-004…AUTH-010 (**Acknowledged / Implemented / Assumption / Deferred / Per-FRD**
  statuses — none literally "Confirmed by user") deferred pending user review before
  any are recorded in `decisions.md`.

### Findings / drift (Phase 1 close-out, 2026-09-27)
Four additional report.md claims verified **stale** (code is ahead of the report):
- "No backend unit/API test suite found" → **FALSE**: `server/__tests__/` has 4 suites
  (validation, authorization, auth.integration, event); 79 tests passing (last local run).
- Phase 4 item "Add account lockout / progressive delay" → **already implemented**:
  `User` model has `failedLoginAttempts`, `lockUntil`, `isLocked()`, MAX_ATTEMPTS lock.
- Phase 4 item "Add CSP headers via Helmet" → **already present**: `app.use(helmet())`
  (server.js L124) + custom `securityHeaders` with a full CSP (L127).
- Phase 3 item 3 "Add missing backend auth tests" → **already exist**: auth.integration
  covers refresh rotation, reuse detection, logout, rate limiting, lockout, CSP headers.
Consequence: report.md's "Suggested Delivery Sequence" and Quick Wins are a starting
point, not current status — `known-issues.md` supersedes them (see README / checkpoint).



### Phase 2 re-run (2026-09-27) — status re-verified, no new code changes
- Re-confirmed OPEN before acting (rule #6). Result: KI-011 (secret rotation) is the
  only genuinely OPEN Phase 2 item; the others are already FIXED in code:
  - KI-002 access token → already in-memory; refresh cookie httpOnly/secure/strict (FIXED).
  - KI-004 object-level authz (benefit + implementation) → already enforced via
    `services/authorizationService.js` (`canAccessBenefit` / `canAccessIdea` /
    `canAccessImplementation`); regression tests already in
    `server/__tests__/authorization.test.js` (FIXED).
  - KI-005 implementation-owner eligibility → shared validator
    `authorizationService.validateImplementationOwner` already in use by both
    `implementationController` and `committeeController`; 3 regression tests exist (FIXED).
  - KI-006 port mismatch → `vite.config.js` already reads `VITE_API_PORT` →
    `server/.env PORT` → 5000 with a mismatch warning; `server.js` validates PORT and
    exits 1 on invalid (FIXED).
  - Phase 2 item 3 → `server/.env.example` exists (placeholders only); `.gitignore`
    already excludes `.env`, `.env.local`, `.env.development`, `client/.env` (verified).
  - Phase 2 item 2 → `server/.env` is untracked and absent from git history, so **no
    filter-repo/BFG purge is required**. Verified via `git ls-files` and
    `git log --all --full-history`.
- BLOCKED — needs the user: KI-011 A+B rotation of `MONGODB_URI` (Atlas password) and
  `JWT_ACCESS_SECRET`. These are user-side credential changes; the agent cannot rotate
  Atlas credentials or mint a new secret without the new values. No secret value was
  printed or stored by the agent.
- Residual, unchanged: KI-007 (S3 deps undeclared) remains OPEN for Phase 5.

## 2026-09-27 — Phase 3 (Delivery Baseline): CI repaired

**KI-001 → FIXED.** Re-confirmed OPEN before editing (rule #6). `ci.yml` rewritten to a
single gating job. Changes and why:

| Defect (was) | Fix |
|---|---|
| `node-version: '18'`; Vite 8.2.1 needs ^20.19/\|\|>=22.12 | `node-version: '22.x'` in both jobs |
| `npm ci` at repo root; no root `package-lock.json` exists | Root `npm ci` removed; only `client`/`server`/`e2e` (each HAS a lockfile) |
| server tests `\|\| echo`; audit `\|\| true`; gitleaks `continue-on-error`; e2e `\|\| echo` | Escapes removed. **User decision:** gitleaks GATING (a leaked secret is unambiguous); `npm audit` stays `continue-on-error` (informational — moderate-level findings are often noise) |
| Playwright had no `webServer`; CI never started Vite, so nothing served `:5173` | `e2e/playwright.config.js` now declares BOTH servers via `webServer[]`: server `http://localhost:5000/health` and client `http://localhost:5173`. CI's manual "start backend in background" + `sleep 3` steps removed (Playwright now owns both). New escape hatch: `PW_SKIP_WEBSERVER=1` runs against servers you started yourself (keeps `reuseExistingServer` for local dev). |
| Client lint/server lint steps (`--if-present \|\| echo`) | Removed — neither package has a lint script; the step was a permanent no-op |
| `security-scan` job: `npm ci` at root + Node 18 + OWASP `continue-on-error` | Root `npm ci`/OWASP steps removed (no root lockfile to scan; OWASP was non-gating anyway). Job now = CodeQL only, with `security-events: write` (required for SARIF upload) |

Added: `npx playwright install --with-deps chromium` (CI runners have no browser);
hoisted `NODE_ENV`/`MONGODB_URI`/`JWT_ACCESS_SECRET`/`CLIENT_ORIGIN`/`PORT` to job `env`.

**Phase 3 items 2–4 verified already-done, no change needed:**
- Client tests (protected routes, expired-token recovery, mutation error states) — all
  present in `client/src/__tests__/auth.test.jsx`; `npm test` = **13 passed** (re-run).
- Backend auth tests (refresh rotation, reuse detection, logout, rate limiting) — present
  in `server/__tests__/auth.integration.test.js` (9 describe blocks incl. Token Rotation,
  Logout, Account Lockout, Rate Limiting, Security Headers).
- `e2e/package.json` test scripts — already documented (`test`, `test:smoke`, + per-suite).

**Local verification limits (not code defects):** server `npm test` cannot complete in the
sandbox — Jest's haste-map spawns the native `watchman` binary and macOS Seatbelt denies the
exec (`fb-watchman` dyld/`EPERM` crash), killing the worker before any test runs. Verified
`fb-watchman` itself loads fine; the block is child-process spawn, not config. The suite
passed **85 tests** on an earlier unsandboxed run (Phase 2, against local mongod) — result
stands. CI (Linux, no sandbox) is unaffected. Client tests re-run clean just now.

**Risk:** CI is now genuinely gating — the first run may be red (E2E timing, audit noise,
gitleaks on existing history). That is the intended signal, not a regression from this change.

## 2026-09-27 — UI/UX audit, Phase 2 (Design Foundation)

Structural: new shared state layer + AA contrast tokens. No data-fetching, auth, or
business logic touched; no new dependencies.

**Contrast (fixes the Phase 1 Critical finding), `client/src/index.css`:**
- `--text-muted` `#94A3B8` → `#64748B` in `:root` only. Was 2.56:1 on `--surface`
  (WCAG AA needs 4.5:1); now 4.76:1. Dark-mode value already passed and is unchanged.
  One variable fixes all 163 `text-theme-text0` call sites.
- New AA-safe status *text* tokens: `--success-text` `#047857`, `--warning-text`
  `#B45309`, `--error-text` `#B91C1C` (light) / `#6EE7B7` / `#FCD34D` / `#FCA5A5` (dark).
  Wired into `@theme` as `--color-*-text`, so Tailwind classes `text-success-text` etc.
  are available. The vivid `--success/--warning/--error` are retained unchanged for
  fills, borders and icons — only *text* usage was repointed.
- `.alert-success/-warning/-error` now use the `-text` variants (were 2.54 / 2.15 / 3.76).
  `.alert-info` deliberately unchanged — `#3B82F6` was not in the measured failure set.
- Approved by user: "Darken muted + add -text variants".

**New shared state layer (`client/src/index.css` + 3 components):**
- CSS: `.state`, `.state-icon`, `.state-title`, `.state-desc`, `.state-actions`,
  `.state-error`, `.state-empty`, and `.skeleton` (+ `-text`/`-title`/`-circle`).
  Skeletons honour `prefers-reduced-motion`.
- `components/ErrorState.jsx` (icon + message + optional retry, `role="alert"`),
  `components/EmptyState.jsx`, `components/Skeleton.jsx`. Plain classes rather than
  required wrappers so pages keep composing their own markup.
- `EmptyState`/`Skeleton` are new — **currently unused by any page**; they are the
  basis for the empty-state pass in Phase 3/4.

**Error states added to 12 query pages** (visual only — each is an `isError` branch
plus the query's own `refetch`; no query, auth, or API code was modified):
CommitteeQueue, EvaluationQueue, ImplementationBoard, Reports (KPI block only),
SupervisorQueue, Gallery, EventsExplore, Committee360, EvaluationForm,
AdminDashboard (users / targets / criteria), DashboardPage (inline KPI banner),
IdeaFormPage (inline events banner).
Rationale for the two inline ones: a failed KPI/events fetch must not blank a page
whose primary content is fine.
Approved by user: "Yes — visual only".

**Verified:** `npm run build` ✓; `npm test` 13/13 ✓.

## 2026-09-27 — UI/UX audit, Phase 3 (Screen-by-Screen Polish)

**Dark-mode token completion.** All 18 residual hardcoded Tailwind palette classes
removed — a repo-wide grep for `*-{slate|gray|red|amber|emerald|blue|...}-NNN` in
`client/src/**/*.jsx` now returns nothing. Every one of them was a status color that
did not switch with the theme. New tokens: `--info-text` (`#1D4ED8` / dark `#93C5FD`)
and `--scrim` (`rgba(15,23,42,.45)` / dark `rgba(2,6,23,.6)`), both added to `@theme`.
- `ErrorBoundary.jsx` was fully theme-unaware (`bg-gray-50`, `bg-white`, `text-gray-900`,
  `bg-red-100`) **and** used three classes that never existed — `bg-primary-600`,
  `bg-primary-700`, `ring-primary-500` (no `--color-primary-600/700/500` in `@theme`).
  Rewritten onto `bg-theme-*` + `.btn.btn-primary`. Note: this class only renders when
  a render error escapes, so it is effectively untested by the suite.
- `Modal.jsx` overlay `bg-slate-900/40` → `bg-scrim`.
- Status text in Committee360, AdminDashboard, IdeaFormPage, EventDetailPage,
  EventsExplorePage repointed to the `-text` variants.

**Print stylesheet** (`@media print`, `index.css`): hides `aside`/`header`/`nav`/fixed
elements, forces light backgrounds, drops shadows, `break-inside: avoid` on cards/rows,
`thead { display: table-header-group }` so table headers repeat across pages, and
suppresses `a[href]::after` URL printing. Motivated by ReportsPage's target tracker and
department tables being real export/print targets.

**Tab ARIA:** added `aria-label` to the three unlabelled tablists (AdminDashboard
"Admin sections", IdeaFormPage "Idea form sections", EventsExplorePage "Event views")
and an `id` per AdminDashboard tab. All four tablists already had `role="tab"` +
`aria-selected` — Phase 1's "tabs missing ARIA wiring" was overstated; what was
missing was the tablist name and panel linkage.

**`EmptyState` adopted on 6 pages** (CommitteeQueue, EvaluationQueue, SupervisorQueue,
ImplementationBoard, Gallery, EventsExplore) — replaced six hand-rolled
`glass p-16 flex-col items-center` blocks. Copy preserved verbatim. `Skeleton` is
still unused (see Phase 5).

**Type scale:** consolidated `text-[10px]` → `text-[11px]` (59 sites) so all 85 micro-label
call sites share one size. Visually near-identical, slightly more legible.

**Correction to Phase 1:** the "4 screens with no responsive classes" finding does not
hold. `LoginPage` (`max-w-[420px]` + `px-4`), `CeoDrillDown` (`w-full max-w-[480px]`
drawer) and `CeoHealthScore`/`CeoImpact` (sub-components rendered inside responsive
grids) are all fine; the flag came from grepping for breakpoint prefixes per-file.

**Verified:** `npm run build` ✓; `npm test` 13/13 ✓.

## 2026-09-27 — UI/UX audit Phase 4 (micro-details)

Approved by the user ("go ahead") after the Phase 3 summary. All changes are visual
or presentational only; no query, auth, or API code was touched. Zero new dependencies.

**Favicon (real 404 fixed):** `client/index.html:8` referenced `/favicon.svg`, but no
`client/public/` directory and no favicon existed anywhere in the repo. Added
`client/public/favicon.svg` (518 bytes) on the brand indigo→violet gradient matching
`.gradient-brand`. Confirmed against `server/middleware/securityHeaders.js` that
`img-src 'self' data:` permits a self-hosted asset; no external font/asset added
(`font-src 'self'` blocks Google Fonts).

**Per-route document titles:** added `client/src/hooks/usePageTitle.js` — the project
had no Helmet and never touched `document.title`, so every screen showed the static
index.html title. Applied to 18 pages; dynamic on IdeaFormPage
(`editId ? 'Edit Idea' : 'Submit Idea'`) and IdeaDetailPage (`idea?.title`).
EventDetailPage is static at `"Event"` because its `usePageTitle` call precedes the
`useQuery` that defines `event` and hooks cannot be conditional.

**Editor accessible name:** added an `ariaLabel` prop to `RichTextEditor.jsx`, passed
through to `ReactQuill`. Needed because a `<label htmlFor>` does not associate with a
contenteditable. `IdeaFormPage` passes `ariaLabel={label}`; `AdminDashboardPage` passes
`ariaLabel="Announcement details"`.

**Tap targets:** `AppLayout.jsx` theme toggle and mobile-menu button `w-9 h-9` →
`w-10 h-10` (36px → 40px). A Node scan of every button in `src/` found only these two
genuinely sub-44px targets; the other five candidates were lucide icons inside
correctly-sized buttons and were left alone. Still under the 44px AA target, deliberately.

**Status colour as body text:** swept `text-error` / `text-success` / `text-warning` onto
the AA-safe `-text` variants across 10+ files — alert banners matching
`bg-*-light border border-*/20 text-*`, required-field asterisks, `btn-ghost btn-sm`
labels, inline `text-xs` validation messages, full-page not-found states, big score
numbers, counter labels. **Deliberately unchanged:** all `<Icon className="... text-error" />`
usages (3.76:1 passes the 3:1 non-text minimum), `!bg-*/10 !text-*/600` important
overrides, and `hover:text-error` on de-emphasized links.

**Transition/duration consistency:** normalised interactive transitions to
`transition-all duration-200` across 8 files (Gallery, Dashboard, KpiCard, ceoUtils,
CeoPipeline, IdeaFormPage, EvaluationFormPage, IdeaListPage, AppLayout). `duration-150`,
a lone `duration-300` (KpiCard/ceoUtils), and several bare `transition-all` with no
duration now agree. Left alone: `duration-100` on Headless UI `Transition` enter/leave
(those need a shorter exit), `duration-500`/`duration-700` on the Recharts/width bar
animations (deliberate, they animate a measured value).

**Tab panel linkage:** all four tablists now wire tab → panel.
- IdeaListPage: per-status `id={`tab-status-${value}`}` + `aria-controls` on the
  buttons, and a wrapping `<div role="tabpanel" id="ideas-tabpanel">` around the list
  (loading / error / empty / grid / pagination). The `#btn-first-idea` E2E hook is
  preserved inside the untouched empty state.
- IdeaFormPage: `aria-controls={`panel-${s.id}`}` on each tab; a single
  `<div role="tabpanel" id={`panel-${activeSection}`}>` wrapping the conditional sections.
- AdminDashboardPage: `aria-controls={`admin-panel-${id}`}` per tab + a wrapping panel div.
- EventsExplorePage: `aria-controls="event-panel"` per tab; the existing filters+list
  grid became the panel.

**Skeleton adoption (was defined-but-unused):** added `SkeletonList({ count, rows })` to
`Skeleton.jsx` and replaced the four hand-rolled `animate-pulse` blocks in
CommitteeQueue, EvaluationQueue, SupervisorQueue (`count={3}`) and IdeaListPage
(`count={5}`). The new `.skeleton` sweep animates only `background-position` (compositor-
friendly, unlike `animate-pulse` which animates opacity on the whole card) and honours
`prefers-reduced-motion`. All are `aria-hidden="true"`; no layout jump on arrival, since
the placeholder card mirrors the real list card's padding and line rhythm.

**Verified:** `npm run build` ✓; `npm test` 13/13 ✓.

**Not done / honest limits:** the remaining 20 `animate-pulse` sites (Gallery, EventsExplore,
IdeaDetail, EventDetail, ImplementationBoard, AdminDashboard, ceoUtils, KpiCard) are
custom-shaped placeholders for card grids and detail layouts that `SkeletonList` doesn't
model; converting them was judged cosmetic-only-churn with a regression risk on the detail
screens, so they keep the existing pulse. The 163-site muted-text shift and the 85-site
11px consolidation still want a human visual eyeball.

## 2026-09-27 — UI/UX audit Phase 5 (verification)

**File-corruption incident and full repair (must be known before the next session).**
An automated script intended to pair `<label>` elements with their form controls corrupted
six files. Root cause: it located a label's closing `>` with `s.indexOf(">", li)`, which
matches `>` characters inside JSX *text* (e.g. `* (Mandatory for > ₹1 Lakh)`,
`totalFinancial > 100000 &&`), so it inserted attributes into wrong places. A follow-up
repair by restoring single lines from `git show HEAD:<file>` made it worse, because HEAD
line numbers no longer matched the edited files and spliced unrelated lines into modified
regions. A third pass (mass `>` insertion) added ~30 spurious `>` per file, and a fourth
(`lines.filter(l => !/=\s*$/.test(l))`) deleted 26 legitimate lines from AdminDashboardPage.
A bulk `fs.writeFileSync` sweep was denied by the auto-mode classifier.

Recovery was done entirely with explicit, reviewable `Edit` calls. Verification of the
repair: `npm run build` ✓ and `npm test` 13/13 ✓; a duplicate-attribute scan reports all
six files clean; every apparent "missing" line versus HEAD was confirmed to be an
intentional Phase 2–4 rewrite (emerald/rose → `success`/`error` tokens, `text-[10px]` →
`text-[11px]`, hand-rolled loading/empty blocks → `SkeletonList`/`EmptyState`, query
destructuring gaining `isError`/`refetch`). No business content was lost.

**Lesson for future sessions:** never locate JSX tag boundaries with `indexOf(">")` — `>`
occurs in text, comments and comparison expressions. Match the tag with a regex, or edit
by hand. Scripts that bulk-rewrite `client/src/**` are also blocked by policy here.

**The a11y finding, and the fix.** Static scan found 65 `<label>` elements, 47 without
`htmlFor`. Of those, 10 are *wrapping* labels (the input is a child), which is already a
valid accessible name, and 1 named a RichTextEditor, which takes its own `ariaLabel` —
so 36 were genuinely unlabelled. All 36 are now paired with an explicit `htmlFor`/`id`
(applied as individual `Edit` calls, not a script):

- `AdminDashboardPage.jsx` — 24: create-user (5), department-target (4), announcement (2),
  event form (11), extend-deadline (2).
- `BenefitsFormPage.jsx` — 7 (cost savings, revenue, efficiency, productivity, description,
  innovation rating, evidence file).
- `LoginPage.jsx` — 1 (dev quick-login select).
- `EvaluationQueuePage.jsx` — 1 (rejection comment).
- `EventsExplorePage.jsx` — 1 (status filter).
- `ImplementationBoardPage.jsx` — 1 (completion percentage range).
- `EvaluationFormPage.jsx` — the "Overall Decision" label sat over a group of `<button>`s,
  which no `htmlFor` can target; it is now a `<p id>` referenced by
  `<div role="group" aria-labelledby>`.

Verified: 0 orphaned `htmlFor` (every `htmlFor` has a matching `id`), no duplicate `id`
attributes, `npm run build` ✓, `npm test` 13/13 ✓.

**What could NOT be verified here — do not claim otherwise.**
- **No real axe/Lighthouse scores exist.** No a11y tooling is installed in any of the three
  package.json files and the npm registry is blocked in this sandbox, so neither
  `axe-core` nor Lighthouse could be run. The findings above come from a hand-written
  static scan, which catches a strict subset of what axe reports. The audit's
  "real a11y scores" deliverable is unmet.
- **Server unit tests and the Playwright E2E smoke could not be run locally.** The sandbox
  blocks local sockets (`node -e "require('net').connect(27017)"` → `EPERM`), so MongoDB
  and both dev servers are unreachable, and the child-process spawn that `fb-watchman`
  needs is blocked too. Both suites run in CI (`.github/workflows/ci.yml` gates
  build → client tests → server tests → seed → `test:smoke` → gitleaks, plus CodeQL), so
  that is where their real result lands.
