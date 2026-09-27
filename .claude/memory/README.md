# .claude/memory — IdeaHub Project Memory

Last verified: 2026-09-27

## Purpose
Durable project knowledge that survives across sessions, so future agents stop
re-deriving context. This folder does NOT duplicate graphify
(see `.agents/rules/graphify.md`). Division of labour:

- graphify (`graphify-out/graph.json`, GRAPH_REPORT.md) = **what the structure is**
  (nodes, communities, file-to-file edges).
- `.claude/memory/` = **what the posture is**: security state, configuration,
  open issues, decisions, and change history — things graphify cannot know.

## Division of labour inside this folder
Keep these SHORT — high-level orientation only; for full structure, query graphify:
- `architecture.md`
- `backend.md`
- `frontend.md`

These carry the weight (build out fully):
- `api-contract.md`
- `env-and-config.md`
- `known-issues.md`
- `decisions.md`
- `CHANGELOG.md`

## Index
| File | Scope | Status |
|---|---|---|
| README.md | This index + rules | Drafted 2026-09-27 |
| architecture.md | Stack, layout, data flow, deployment topology | Drafted 2026-09-27 |
| backend.md | Routes by domain, models, middleware, services, jobs | Drafted 2026-09-27 |
| frontend.md | Routes, state management, component structure, libs | Drafted 2026-09-27 |
| api-contract.md | Endpoint list generated from real controller code | Drafted 2026-09-27 |
| env-and-config.md | Every env var: name, where read, purpose, required? | Drafted 2026-09-27 |
| known-issues.md | Open bugs / security gaps / tech debt, tagged + dated | KI-001…KI-007 (2026-09-27) |
| decisions.md | Confirmed architectural decisions + rationale | DEC-001…004 (2026-09-27) |
| CHANGELOG.md | Dated log of code + memory changes | Partial — 2026-09-27 entries |
| PHASE1-CHECKPOINT.md | Point-in-time Phase 1 snapshot (do not rewrite) | Saved 2026-09-27 |

Primary findings source to cross-reference: `IDEAHUB_IMPROVEMENT_REPORT.md`
(2026-09-25). Secondary/older: `audit.md` (2026-09-05, stale in places),
`ASSUMPTIONS.md`.

**Authority:** `known-issues.md` is the **authoritative "what is actually open"**
list. `IDEAHUB_IMPROVEMENT_REPORT.md` is a historical input — several of its findings
have been verified stale, corrected, or already-resolved (see `known-issues.md` and
`CHANGELOG.md`). Where they diverge, memory wins; where memory is silent, do not
assume report.md is still current without re-verifying.

## Rules
1. Read `.claude/memory/*.md` before starting any task on IdeaHub.
2. State only facts traceable to a specific file/line actually read. Never invent
   versions, endpoints, env var names, or behaviour.
3. Mark anything inferred-but-unconfirmed as `UNVERIFIED — confirm`.
4. Date every file/section: `Last verified: YYYY-MM-DD`.
5. Short factual statements, not prose. This is a reference, not a report.
6. Never silently overwrite a contradicting fact. Note the change and date it in
   `CHANGELOG.md`.
7. After any code change, update the affected memory file(s) in the same session.
8. Never store real secret values. `env-and-config.md` lists names/purpose only.
9. **Re-confirm OPEN status before every fix.** Before changing anything, check
   `known-issues.md` (not `IDEAHUB_IMPROVEMENT_REPORT.md`) that the item is still OPEN.
   If you discover something thought-open is actually already handled, **stop** —
   update `known-issues.md` + `CHANGELOG.md` immediately and tell the user. Do not
   fix what isn't broken.

## How to update
- Code change → update the affected file(s) + append to `CHANGELOG.md`, same session.
- Codebase contradicts memory → flag the conflict, ask which is correct, then update
  memory and log it in `CHANGELOG.md`.
- "Audit memory" request → re-scan codebase vs memory, report what is stale /
  missing / wrong.
