# Phase 1 Checkpoint — Memory System Build-out

**Date:** 2026-09-27
**Type:** point-in-time artifact (snapshot). Living files are `README.md`,
`known-issues.md`, `CHANGELOG.md` — this file is kept so the Phase 1 findings don't
have to be re-derived from CHANGELOG history. Do not rewrite it; add newer
checkpoints as separate files if needed.

## 1. What Phase 1 produced (on disk at close)
```
.claude/
├── CLAUDE.md                                  Codebase Navigation + Project Memory
├── settings.local.json                        UNTOUCHED (guard)
├── skills/ideahub-memory/SKILL.md             memory-first skill
└── memory/
    ├── README.md            index + rules + authority note
    ├── architecture.md      orientation (points to graphify)
    ├── backend.md           orientation
    ├── frontend.md          orientation
    ├── api-contract.md      endpoints + authz re-verification
    ├── env-and-config.md    env vars + port verification
    ├── known-issues.md      KI-001…KI-010
    ├── decisions.md         DEC-001…DEC-003
    ├── CHANGELOG.md         dated log
    └── PHASE1-CHECKPOINT.md this file
```
Total memory content ≈ 800 lines. Guards intact: `settings.local.json` (18 lines),
`.agents/` (2 graphify files).

## 2. report.md findings — verified state
Caveat: git has a single commit, so "always wrong" vs "fixed since" is
indistinguishable; both are labelled *corrected/stale*.

### Verified as stated (report still accurate)
- Zustand installed but unused (`grep -rn zustand client/src` → 0 matches).
- In-process cron jobs + process-local cache block horizontal scaling.
- Secrets present in `server/.env` (needs rotation).

### Corrected / stale (report wrong or superseded)
- Access token in `localStorage` → actually in-memory only (KI-002 FIXED).
- No client unit tests → `auth.test.jsx` exists but unwired (KI-003 OPEN).
- No backend unit/API tests → 4 suites, 79 passing.
- No CI/CD → `ci.yml` exists (KI-001 OPEN, coverage TBD).
- Benefit create/read no ownership check → enforced (KI-004 FIXED).
- Implementation read-by-idea open to any caller → enforced (KI-004 FIXED).
- `/uploads` not clearly mounted → exists + `protect`-gated.
- Account lockout missing → already implemented.
- CSP headers missing → already present (helmet + custom CSP).
- Backend auth tests missing → already cover rotation/reuse/logout/rate-limit/lockout.
- Event leaderboard computed in JS → already a MongoDB `aggregate`.
- "DEPLOYMENT.md documents port 5000" → DEPLOYMENT.md states no backend port at all.

### Still open (genuine)
- KI-001 CI coverage unverified.
- KI-003 client tests unwired.
- KI-005 implementation-owner role/workflow eligibility missing.
- KI-006 port mismatch (5000 vs 5001 vs 5000).
- KI-007 S3 deps undeclared.
- KI-008/009/010 open FRD questions.
- Not yet KI-numbered: secrets rotation/history purge, in-process jobs/cache,
  API versioning, dashboard error states, a11y, validation standardization.

### Not yet verified (do not assume either way)
- `reportController` export scalability; `INTEGRATIONS.md` staleness; `audit.md`
  details; a11y specifics; dashboard error states.

## 3. Authority
`known-issues.md` is the authoritative "what is actually open" list;
`IDEAHUB_IMPROVEMENT_REPORT.md` is a historical input. Where they diverge, memory
wins; where memory is silent, re-verify the report before acting.

## 4. Consequence for later phases
Do not re-fix items already marked FIXED (token storage, CSP, lockout, authz gaps
A1/A2, leaderboard aggregation, backend auth tests). Phase 2 begins from the
genuinely-open list above.
