---
name: ideahub-memory
description: Use whenever the user asks about IdeaHub's architecture, endpoints, models, configuration, known issues, or decisions, or asks for changes to the IdeaHub codebase. Ensures .claude/memory/ is read first and kept current.
---

# IdeaHub Memory

## Instructions
1. **Read memory first.** Before responding to any IdeaHub question or task, read
   `.claude/memory/*.md` — start with `README.md`, then the relevant file
   (`architecture.md`, `backend.md`, `frontend.md`, `api-contract.md`,
   `env-and-config.md`, `known-issues.md`, `decisions.md`, `CHANGELOG.md`).
2. **Never guess.** If memory covers the topic, use it. Do not answer from general
   assumption or re-derive facts memory already records.
3. **Update after every change.** After any code change, update the relevant
   `.claude/memory/*.md` file(s) **in the same session** — never defer it.
4. **Log drift/contradictions.** If the codebase contradicts memory, flag the
   conflict, ask which is correct, then update memory and append the entry to
   `.claude/memory/CHANGELOG.md`. Never silently overwrite a contradicting fact.
5. **Audit on request.** When the user says "audit memory", re-scan the codebase
   against memory and report what is **stale, missing, or wrong**, citing file evidence.
6. **Re-confirm OPEN status before every fix.** Before changing anything, verify in
   `known-issues.md` (not the historical report) that the item is still OPEN. If it is
   actually already handled, **stop** — update `known-issues.md` + `CHANGELOG.md`
   immediately and tell the user; never fix what isn't broken.

## Notes
- Structure/architecture questions: prefer graphify (`graphify query|path|explain`,
  `graphify-out/GRAPH_REPORT.md`) over manual re-derivation — see `.agents/rules/graphify.md`.
- Keep `architecture.md`, `backend.md`, `frontend.md` short (orientation; point to graphify).
  `api-contract.md`, `env-and-config.md`, `known-issues.md`, `decisions.md`, `CHANGELOG.md`
  carry the weight.
- Never store real secret values in memory (env var names/purpose only).
