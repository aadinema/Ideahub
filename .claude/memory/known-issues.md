# Known Issues — IdeaHub

Last verified: 2026-09-27
Legend: OPEN · IN PROGRESS · FIXED
Primary findings source: `IDEAHUB_IMPROVEMENT_REPORT.md` (2026-09-25).
Secondary/older: `audit.md` (2026-09-05, stale in places), `ASSUMPTIONS.md`.

> Status: build-out in progress. Entries are added as verified; the rest of the
> report's findings will be added as they are checked against current code.

## Testing & CI

### KI-001 — CI pipeline exists but is non-functional / non-gating
**Status:** OPEN
**Date:** 2026-09-27 (verified against report.md Phase 3 checklist)
`ci.yml` exists, but verification against report.md's Phase 3 requirements found it
would not deliver a real signal. Evidence:

**Checks report.md Phase 3 asked for vs. reality:**
| Requirement | In ci.yml? | Actually works? |
|---|---|---|
| install | `npm ci` (root, client, server, e2e) | **NO** — no `package-lock.json` tracked anywhere (all gitignored; root has none on disk) → `npm ci` cannot succeed |
| client lint | step present | **NO** — client has no `lint` script; step is `--if-present \|\| echo` → silent skip |
| client build | `npm run build` | **NO** — CI sets `node-version: '18'`; Vite 8.2.1 requires `^20.19.0 \|\| >=22.12.0` → build fails |
| client unit tests | step present | **NO** — no `test` script (see KI-003); `--if-present` → skipped |
| server unit/API tests | `npm run test` | runs, but `\|\| echo "Tests not ready yet"` **masks failures** → non-gating |
| Playwright smoke | `cd e2e && npm run test` | **NO** — no `webServer` in `playwright.config.js` and CI never starts the client (only the backend) → nothing serves `:5173`; also `\|\| echo` masks failures |
| secret scanning | gitleaks action | present but `continue-on-error: true` → **non-gating** |
| dependency audit | `npm audit … \|\| true` + OWASP (continue-on-error) | present but **non-gating** |

**Stale report claim:** report.md said `e2e/package.json` lacks a clear test script —
**false**: it has `test`, `test:smoke`, and per-suite scripts. (CI just doesn't use `test:smoke`.)

**Consequence:** CI currently fails at the install step and is non-gating thereafter, so
it provides no protection. Fixing it requires: commit lockfiles (or change `npm ci` → `npm
install`), bump CI Node to ≥20.19 (or 22.12), add client/server `lint` scripts or drop the
step, wire client tests (KI-003), add Playwright `webServer` (or start Vite in CI), and
remove the `continue-on-error` / `|| echo` escapes for the checks meant to gate.
Not yet fixed — analysis only (see CHANGELOG 2026-09-27).

### KI-003 — Client unit tests exist but are not wired to run
**Status:** OPEN
**Date:** 2026-09-27
`client/src/__tests__/auth.test.jsx` exists (vitest + `@testing-library/react`) and
covers protected routes, token-storage non-persistence, mutation error states,
expired-token recovery, form validation, and accessibility. **But** `client/package.json`
has no `test` script and there is no vitest config, so these tests never execute.
CI's "Client unit tests" step runs `npm run test --if-present`, silently skipping them.
Framing: OPEN and arguably **worse** than "no tests" — a test file that exists but
never runs creates false confidence. Fix = add a `test` script + vitest config
(Phase 3). report.md's "no client unit tests found" is stale.

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

