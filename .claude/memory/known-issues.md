# Known Issues — IdeaHub

Last verified: 2026-10-01
Legend: OPEN · IN PROGRESS · FIXED
Primary findings source: `IDEAHUB_IMPROVEMENT_REPORT.md` (2026-09-25).
Secondary/older: `audit.md` (2026-09-05, stale in places), `ASSUMPTIONS.md`.

> Status: build-out in progress. Entries are added as verified; the rest of the
> report's findings will be added as they are checked against current code.

## Testing & CI

### KI-001 — CI pipeline exists but is non-functional / non-gating
**Status:** FIXED (2026-09-27)
**Date:** 2026-09-27 (originally verified against report.md Phase 3 checklist; repaired same day)
`ci.yml` was rewritten to a single gating job. Defects closed (see CHANGELOG 2026-09-27
"Phase 3" entry for the full before/after table):
- Node `18` → `22.x` (Vite 8.2.1 needs ^20.19 || >=22.12).
- Removed root `npm ci` (no root lockfile); install only `client`/`server`/`e2e`.
- Removed all `|| echo` / `--if-present` / `continue-on-error` escape hatches on gating
  steps. **Decision:** gitleaks + build + client/server tests + E2E all GATE; `npm audit`
  stays `continue-on-error` (informational only, by user decision); CodeQL in `security-scan`.
- Playwright now owns both servers via `webServer[]` (server `:5000/health` + client `:5173`);
  CI's manual background-server step removed. Escape hatch `PW_SKIP_WEBSERVER=1`.
- Added `npx playwright install --with-deps chromium`; `security-scan` given
  `security-events: write` for CodeQL SARIF upload.

Was: install failed at root `npm ci`; build failed on Node 18; tests/e2e/audit/gitleaks all
non-gating. Now: real signal, and the first run may be red (E2E timing / audit noise /
gitleaks on existing history) — that is the intended signal, not a regression.

### KI-003 — Client unit tests wired and passing
**Status:** FIXED (verified 2026-09-27)
**Date:** 2026-09-27
Was: `client/src/__tests__/auth.test.jsx` existed but had no runner (`client/package.json`
had no `test` script, no vitest config, and `jsdom` was not installed) → tests never ran;
CI skipped them via `--if-present`.
Fix applied:
- Added dev dep **`jsdom`** (29.1.1) — the missing DOM environment.
- Added **`client/vitest.config.js`** (jsdom env, `@testing-library/jest-dom/vitest`,
  alias mirror, `include: src/**/*.{test,spec}.{js,jsx}`, `globals: false`).
- Added **`client/src/test/setup.js`** (jest-dom matchers + jsdom polyfills for
  `matchMedia` / `ResizeObserver` / `scrollTo` + RTL `cleanup`). Harness only — no
  assertions touched.
- Added scripts: `test` (`vitest run`), `test:watch`, `test:coverage`.
Evidence (real run): `npm test` → **Test Files 1 passed · Tests 13 passed**; client build OK.
Related: see **KI-012** (a pre-existing test-harness defect surfaced once the tests ran).

### KI-012 — App-render tests double-wrapped Router (FIXED)
**Status:** FIXED (verified 2026-09-27)
**Date:** 2026-09-27
Was: `auth.test.jsx` logged `Error: You cannot render a <Router> inside another
<Router>` because `renderWithProviders` wrapped the component in `<BrowserRouter>`
while `<App/>` already provides its own. Caught by `App`'s ErrorBoundary, so the two
"Protected Routes" tests passed on store-state assertions while the render was inert.
Fix (harness only, no assertions changed): `renderWithProviders` now takes
`withRouter` (default `false`) and only wraps when requested; `<App/>` renders
unwrapped so it uses its own router.
Evidence: `npm test` → **13 passed**, and the Router error no longer appears; only
benign React Router v7 future-flag warnings remain.

## Security

### KI-002 — Access token in localStorage (report.md §3)
**Status:** FIXED (verified 2026-09-27)
**Date:** 2026-09-27
report.md §3 flagged the access token being persisted in `localStorage`.
Current code holds the access token in memory only — `client/src/store/authSlice.js`
sets `accessToken: null` with explicit "never persisted" comments; `updateToken`
updates memory only. localStorage stores only non-sensitive user info (`ideahub_user`).
The **other half** of the finding — the refresh cookie — is correctly configured:
`httpOnly: true`, `secure` when `NODE_ENV==='production'`, `sameSite: 'strict'`,
path-scoped to `/api/auth/refresh` (`server/controllers/authController.js` L66–L74).
UNVERIFIED: whether this predates report.md — the repo has a single "first commit".
Residual (separate): confirm CSP coverage (Phase 4) — note a CSP header and
`helmet()` already exist (`middleware/securityHeaders.js`, `server.js` L124).

### KI-011 — Rotate secrets in `server/.env` (report §1)
**Status:** OPEN
**Date:** 2026-09-27
`server/.env` holds a real `MONGODB_URI` (Atlas credentials) and `JWT_ACCESS_SECRET`.
Report §1 treats them as compromised. Re-verified 2026-09-27:
- `server/.env` is **NOT tracked by git** and **not present in git history** (positive).
- Tracked env files are non-sensitive: `server/.env.example` (placeholders only) and
  `.env.development` (root, contains only `VITE_API_PORT`).
- `.gitignore` originally covered only `.env` / `.env.*.local` (not `.env.development`
  nor `client/.env`) — **fixed 2026-09-27** (see DONE note below).
- **`JWT_REFRESH_SECRET` is a dead env var** — never read anywhere in code; refresh
  tokens are opaque `crypto.randomBytes(64)` values stored SHA-256-hashed, not JWTs.
  Rotating it has no effect; its presence is misleading.
- **C1 DONE 2026-09-27 — `JWT_REFRESH_SECRET` removed everywhere:** `server/.env`,
  `server/.env.example`, `.github/workflows/ci.yml` (×3), `TEST_GUIDE.md` (×2).
  Repo-wide grep (excl. memory notes) → **0 references**. It was never read at runtime.
- **D DONE 2026-09-27 — root `.env.development` untracked + deleted:** non-sensitive
  (`VITE_API_PORT=5000` + comments); full history (single commit `9e3aab1`) confirms it
  never held anything else, so **no history purge needed**. `git rm --cached` first, then
  deleted from disk as an unused duplicate; `.gitignore` updated.

**Remaining (A+B) — rotation:** rotate the Atlas `MONGODB_URI` password and
`JWT_ACCESS_SECRET`; awaiting user to paste new values into `server/.env`.
No rotation/destructive step taken by the agent.
Disclosure: a broad grep printed the (now-removed, unused) `JWT_REFRESH_SECRET` value to
the session transcript; low impact (dead secret). Avoid printing values from secret files.


## Authorization

### KI-004 — Benefit + implementation object-level authz gaps (report.md §3)
**Status:** FIXED (verified 2026-09-27)
**Date:** 2026-09-27
report.md claimed benefits create/read had no ownership check and implementation
read-by-idea returned to any authenticated caller. Current code:
- `createBenefit` → `canAccessBenefit(..., 'create')` (owner/admin/committee), else 403;
  also verifies `implementation.ideaId === ideaId`.
- `getBenefitByIdea` → `canAccessIdea(..., 'read')`, else 403.
- `getImplementationByIdea` → `canAccessImplementation(..., 'read')`, else 403;
  `canAccessImplementation` unwraps a populated `ownerId` (L90) so owners aren't
  wrongly denied (bug fixed this cycle).
Both report claims are **stale**. Evidence: `benefitController.js`, 
`implementationController.js`, `services/authorizationService.js`.

### KI-005 — Implementation owner eligibility was incomplete
**Status:** FIXED (verified 2026-09-27)
**Date:** 2026-09-27 (fixed same day)
Was: `createImplementation` accepted a caller-supplied `ownerId` validated only as
exists + active + department-or-admin; `committeeController.approveImplementation`
validated **nothing** and crashed (500) on an unresolvable owner id.
**Decision (rule A, confirmed by user):** an eligible owner must be **active AND hold
`ROLES.IMPLEMENTATION_OWNER`** (or be ADMIN) — dept-agnostic. Rationale: the workflow
role map only lets IMPLEMENTATION_OWNER/ADMIN transition implementation & benefit
statuses, so a non-role owner is a dead assignment; department matching was dropped to
align with the dept-agnostic committee owner picker.
Fix applied:
- `authorizationService.validateImplementationOwner` enforces existence + active +
  role eligibility (dept no longer required).
- `committeeController.approveImplementation` calls the shared helper **before**
  transitioning/creating (kills the 500-on-bad-id); `implementationController.createImplementation`
  already used it.
- `committeeController.getImplementationOwners` unchanged (already role-filtered).
- Committee owner picker UI: soft default to same-department owners, with an opt-in
  "show other departments" and automatic fall-back to all when none match (no hard block).
Evidence: `authorizationService.js` (validator); `committeeController.js` L~139;
`Committee360Page.jsx`. Regression tests in `authorization.test.js` (describe
"Implementation owner eligibility (KI-005)") — **before/after verified**:
- no-role same-dept owner: before `201`, after `400`;
- committee bogus owner: before `500`, after `404`;
- eligible role-holding owner: `201` (both).
Full server suite: 85 passing.

## Configuration

### KI-006 — Port mismatch (Vite proxy vs server default)
**Status:** FIXED (verified 2026-09-27)
**Date:** 2026-09-27 (fixed same day)
Was: `server/server.js` defaulted to 5000; `client/vite.config.js` hard-coded 5001;
`VITE_API_PORT` existed but was unused; `TEST_GUIDE.md` claimed otherwise.
Fix applied: `vite.config.js` now reads `VITE_API_PORT` (client/.env) → falls back to
`server/.env PORT` → 5000, and warns on mismatch; `server.js` validates `PORT`
(invalid → exit 1). `TEST_GUIDE.md` updated; root `.env.development` (unused duplicate) deleted.
Verified with evidence: resolved proxy = `http://localhost:5001`; temp `VITE_API_PORT=9999`
logged the mismatch warning; `PORT=abc` / `PORT=70000` exited 1; `PORT=6000` reached
"Server running on port 6000".
Report nuance (kept): report.md said "DEPLOYMENT.md documents port 5000" — it documents
**no backend port at all**.
**Residual:** `storageService.js` L29 `SERVER_BASE_URL` default is still a hard-coded
`:5000` (independent of this fix) — not yet aligned.

### KI-007 — S3 storage mode has undeclared dependencies
**Status:** OPEN
**Date:** 2026-09-27
`STORAGE_PROVIDER=s3` requires `multer-s3` (`middleware/upload.js` L41) and
`@aws-sdk/client-s3` (`upload.js`, `services/storageService.js` L57), but neither is
declared in `server/package.json`. Startup validates required **env vars**
(`server.js` L16–L23) but not **modules**, so S3 mode crashes at require time.
Also: `.env.example` omits `S3_REGION`, `S3_BUCKET`, `SERVER_BASE_URL`.
Fix = add deps + module/dep startup check, or remove S3 mode until ready (Phase 5).
Report §3 confirmed.

## Infrastructure observations

### INF-001 — Intermittent Atlas connectivity
**Status:** OPEN (observation, not a code bug)
**Date:** 2026-09-27
During Phase 2 work the Atlas cluster (`cluster0.2mdxjwu…`) was repeatedly unreachable
from this environment, in two distinct failure modes:
1. DNS `getaddrinfo ENOTFOUND` for `ac-*.2mdxjwu.mongodb.net` (earlier in the session);
2. `MongoServerSelectionError` / `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR` + `SystemOverloadedError`
   (during KI-005 verification).
Effect: KI-005 verification (and other runs) fell back to **local `mongod`**
(`mongodb://localhost:27017/ideahub`) — tests are DB-agnostic, so results still valid,
but the dev API and Atlas-backed runs are intermittently unavailable.
Not caused by app code. Likely causes: IP not on the Atlas access list, or cluster
network/SSL issues. Re-check the Atlas IP allowlist and cluster health if it recurs.
Owner action (infra) — flagged so it is not mistaken for a code regression.

## Open Questions (pending product confirmation)

> Tracked here (not in `decisions.md`) so unresolved items never look settled by
> presence. Each needs an explicit product answer before it becomes a decision.

### KI-008 — Committee tie-break rule undefined (FR-05-04)
**Status:** OPEN
**Date:** 2026-09-27
If the committee has an even number of members and the vote ties, the tie-break is
undefined. `ASSUMPTIONS.md` assumes "Defer available as tiebreaker" — **assumption
only, not confirmed**. Needs product confirmation.

### KI-009 — "Monthly" leaderboard reset definition (FR-06-02)
**Status:** OPEN
**Date:** 2026-09-27
FR-06-02 says the Top Contributors leaderboard "auto-updates monthly" but does not
define monthly: calendar month (reset on the 1st) vs rolling 30 days.
`ASSUMPTIONS.md` assumes calendar month — **assumption only, not confirmed**.

### KI-010 — Announcement "schedule" semantics (FR-AD-08)
**Status:** OPEN
**Date:** 2026-09-27
FR-AD-08 (SHOULD HAVE) references announcement "schedule" without defining it:
future publish date/time vs expiry-date-only. `ASSUMPTIONS.md` assumes `expiryDate`
only + immediate publish — **assumption only, not confirmed**.


### KI-014 — Automated accessibility scoring (was: none) — FIXED
**Status:** FIXED (2026-09-27)
**Date:** 2026-09-27
Was: no a11y tooling; the audit's "real a11y scores" deliverable was unmet and all
findings came from a hand-written static scan.
Fix: added devDependency **`axe-core`** (^4.13.0) plus `client/src/test/axe.js` and
`client/src/__tests__/a11y.test.jsx` — 7 axe checks over Login, Dashboard, IdeaList,
Admin, EmptyState/ErrorState, Modal, Toast. All pass (**26/26** total client tests).
First run found a real WCAG 4.1.2 violation (`aria-prohibited-attr`: `aria-label`
on a roleless `<div>` in `KpiCard`) — fixed.
**Limits:** runs under jsdom, so `color-contrast` and `region` rules are disabled;
colour contrast + full-page landmarks still require Lighthouse / axe DevTools in a
real browser. Lighthouse numeric scores are still uncollected.

_Original finding (now resolved):_ no `axe-core`/`jest-axe`/`eslint-plugin-jsx-a11y`/
Lighthouse existed and nothing gated a11y. Chosen fix was axe-core in the existing
vitest suite (not a full eslint plugin), matching the earlier "cheap path" note.

### KI-019 — CI `npm ci` cannot succeed: lockfiles are gitignored/untracked
**Status:** OPEN
**Date:** 2026-09-27
`.github/workflows/ci.yml` installs with `cd client && npm ci` (and server/e2e) and
caches on `client|server|e2e/package-lock.json`, but `.gitignore` (lines 10–11)
ignores `package-lock.json`/`yarn.lock` and **no lockfile is tracked**
(`git ls-files | grep package-lock` → none). On a fresh CI checkout `npm ci` fails
with "can only install with an existing package-lock.json". So the whole client/
server/e2e install — and therefore the client test gate (including the new axe-core
a11y gate) — cannot run in CI as written.
This is **pre-existing** (surfaced while adding axe-core; not caused by it) and
touches KI-001's "CI repaired" claim. Two options, needs a decision:
(a) track the three lockfiles (remove the `.gitignore` rule, `git add -f`), or
(b) switch CI to `npm install` (less reproducible). Option (a) is recommended.
No change made — repo-hygiene decision, not a UI change.

### KI-013 — Server tests and E2E cannot be run from this sandbox
**Status:** OPEN (environment limitation, not a code defect)
**Date:** 2026-09-27
Local sockets are blocked (EPERM on `net.connect(27017)`) and child-process spawn is
blocked, so MongoDB is unreachable and `fb-watchman` crashes the server Jest run. E2E
needs both dev servers. Both suites *do* gate in CI (`.github/workflows/ci.yml`), so the
real result lands there. Until they are run in CI, no claim should be made about server
test or E2E status.

## UI/UX audit — independent re-audit of the current tree (2026-09-27)

Context: a second, independent UI/UX audit was run against the tree *after* the
earlier Phase 2–5 UI pass. It found four **functional regressions that pass had
introduced** (all now fixed) plus a set of HIGH visual/compliance findings that
remain open. Scope of this pass is UI/UX only — no data-fetching, auth, or API
code changed.

### KI-015 — IdeaDetailPage + IdeaFormPage crashed on every render (TDZ) — FIXED
**Status:** FIXED (2026-09-27)
Was: both pages called `usePageTitle(<non-literal>)` **before** the identifier it
referenced was declared, putting the identifier in the temporal dead zone →
`ReferenceError: Cannot access 'idea'/'editId' before initialization` on mount.
Optional chaining does not help (`idea?.title` still reads the binding).
- `IdeaDetailPage.jsx`: `usePageTitle(idea?.title)` ran before `const idea = data`.
- `IdeaFormPage.jsx`: `usePageTitle(editId ? …)` ran before `const { id: editId } = useParams()`.
Fix: moved each call to after the identifier is bound and before the first early
return (hooks stay unconditional). No logic changed.
Regression guard: new `client/src/__tests__/pages.smoke.test.jsx` (C1/C2 cases).
Verified the guard fails on the buggy code with the exact `ReferenceError`, then
passes after the fix.

### KI-016 — AdminDashboardPage used ErrorState without importing it — FIXED
**Status:** FIXED (2026-09-27)
Was: `<ErrorState>` used 3× (Users/Targets/Criteria tabs) but never imported →
`ReferenceError` whenever that branch rendered; build/lint never caught it (no
lint script). Also, Targets and Criteria checked `length === 0` **before**
`isError`, so a failed fetch rendered the "No targets configured"/"No criteria"
empty copy instead of the error — the error branch was effectively unreachable.
Fix: added the import; reordered both branches to `isLoading → isError → empty → list`.
Regression guard: `pages.smoke.test.jsx` C3.

### KI-017 — GalleryPage error branch was dead and its retry threw — FIXED
**Status:** FIXED (2026-09-27)
Was: the gallery query destructured only `{ data, isLoading }`, so `isError` was
`undefined` (falsy → fell through to the empty state) and `refetch` was
`undefined` (the "Try again" button threw on click). The Phase-2/3 memory claim
that a Gallery error state was added was therefore not functionally true.
Fix: destructured `isError, refetch` from the query. Regression guard:
`pages.smoke.test.jsx` C4.

### KI-018 — Re-audit HIGH findings (visual / compliance) — FIXED
**Status:** FIXED (2026-09-27)
**Date:** 2026-09-27
All UI-only findings from the re-audit are resolved (Phase 2 + 3.0 + Phase 3
screen pass + Phase 4). Final scans: 0 hardcoded palette classes, 0 raw hex in
JSX, 0 `animate-pulse`, 0 `appearance-none`, 0 `alert(`, 0 plain-text loaders.
**Component duplication also resolved:** the shared `ErrorState`/`EmptyState`
gained a `compact` variant, and `ceoUtils.jsx` now delegates to them instead of
reimplementing the markup — one implementation app-wide.
The original finding bullets below are kept only as a record.
> Status per item (see CHANGELOG for evidence). Kept as the record; do not
> re-report resolved items as open.
- **Contrast (AA):** RESOLVED (Phase 2 badges + 3.0 body text; icons stay vivid).
- **Hardcoded palette / raw hex:** RESOLVED (Phase 2 + CEO pass; 0 palette classes,
  0 raw hex in JSX). Role pills use dark role tokens → white text passes AA.
- **Typography/CSP:** RESOLVED (Phase 2 — system-ui stack, external links removed).
- **Skeletons (light-mode + fidelity):** RESOLVED (Phase 2 + 3 + `SkeletonRows`).
- **Range inputs:** RESOLVED (Phase 3.0 — `.range`).
- **Reduced motion:** RESOLVED (Phase 2 — global rule).
- **tablist keyboard (roving focus):** RESOLVED (Admin, IdeaList, IdeaForm, Events).
- **Audit-filter labels:** RESOLVED (Admin Phase 3).
- **Password toggle tab order:** RESOLVED (Phase 3, Login).
- **`alert()` → `Toast`; sidebar shift; NotFound icon:** RESOLVED (Phase 2/3).
- **Invalid CSS colour (`${var(--x)}15`):** RESOLVED (CEO pass → `color-mix`).
- **Component duplication (`ceoUtils` vs `components`):** RESOLVED — shared
  `ErrorState`/`EmptyState` gained a `compact` variant; `ceoUtils` delegates.

**A11y scoring:** still unmet — KI-014. No axe/Lighthouse could be run (registry
blocked); findings above are from source inspection, not rendered-DOM tooling.

## Idea lifecycle workflow defects (found 2026-10-01 by tracing the flow)

All three were found by reading `STATUS_TRANSITIONS` + `TRANSITION_ROLE_MAP`
against every call site of `workflowService.transition()`, and all three are
now fixed with regression tests. Diagram: `docs/idea-lifecycle-flow.svg`.

### KI-020 — A returned idea can never be resubmitted — FIXED (2026-10-01)
**Status:** FIXED (2026-10-01)
`ideaController._submitIdea` asked for `SUBMITTED` first, but
`STATUS_TRANSITIONS[RETURNED]` holds only `UNDER_SUPERVISOR_REVIEW`
(`shared/constants.js`) — there is no `returned → submitted` edge, so every
resubmission died with a 422. `ideaController.js:418` was even written to
*accept* a returned idea, so the guard and the matrix contradicted each other.
**Fix:** `workflowService.submitIdea()` now branches on `idea.status`; a
returned idea re-enters review in one hop. `_submitIdea` delegates to that
wrapper instead of hand-rolling both hops. The second hop is inlined rather
than routed through `routeToSupervisor`, which attributes to `idea.supervisorId`
and drops the request IP — the submission must be attributed to the submitter.

### KI-021 — Every committee defer was logged as ADMIN_OVERRIDE — FIXED (2026-10-01)
**Status:** FIXED (2026-10-01)
`committeeController.deferIdea` passed `isAdminOverride: true` for
`under_committee_review → submitted`, which **is** a declared edge. The flag
therefore bypassed nothing and only mislabelled the entry: every ordinary
committee decision was stamped `ADMIN_OVERRIDE` in the admin audit viewer.
Committee members also hold none of the roles `TRANSITION_ROLE_MAP` lists for
`submitted`, so the fix passes a system actor carrying the committee member's
real id — the role check at `workflowService.js:174` also short-circuits on
`isAdminOverride`, which is what let the old code through at all.
Note this was **not** a 403 (an earlier reading of the code was wrong).

### KI-022 — approve-implementation stranded the idea after writing the row — FIXED (2026-10-01)
**Status:** FIXED (2026-10-01)
`approveImplementation` creates the `Implementation` document and then
auto-transitions to `IMPLEMENTATION_INITIATED` with `actor: req.user`. That
status is gated to `['system', ADMIN]`, so a committee member got a 403 *after*
the row was already written, leaving the idea parked at
`approved_for_implementation` with an orphaned implementation. Fixed with the
same system-actor pattern used by `routeToSupervisor`.

### KI-023 — `outcome_monitored` and `closed` are unreachable — OPEN
**Status:** OPEN (product gap, not a code defect)
Nothing transitions *into* either status, although `STATUS_TRANSITIONS` declares
`benefits_recorded → outcome_monitored → closed` and
`published → outcome_monitored | closed`. The lifecycle therefore terminates in
practice at `benefits_recorded`, while FRD §5.2 specifies it ending at `Closed`.
Either add the Stage-8 endpoint or delete the dead edges — but do not leave the
matrix implying a path that does not exist.

## Where the lifecycle rules actually live

- Matrix: `shared/constants.js` → `STATUS_TRANSITIONS` (20 states, 4 terminal).
- Role gate, keyed by **target** status: `TRANSITION_ROLE_MAP` in
  `server/services/workflowService.js`. `system` bypasses it.
- Order of enforcement in `transition()`: matrix → admin override → role →
  per-target validators → side effects → audit log.
- Audit fires on **every** transition; notifications do **not** — each
  controller triggers its own. Defer, unpublish, and benefit
  create/endorse send no notification.
