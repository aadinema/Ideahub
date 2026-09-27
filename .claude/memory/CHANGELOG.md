# Memory Changelog — IdeaHub

This file logs both code changes and memory-file changes, newest first.
Never overwrite history; append entries.

## 2026-09-27

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


