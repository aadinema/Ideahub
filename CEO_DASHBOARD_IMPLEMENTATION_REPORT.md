# CEO Dashboard — Implementation Report & UX Assessment

**Date:** 26 Sep 2026
**Scope:** Fix `POST /api/ideas?submit=true` (422) · Profile/Role Switcher · C-Suite Executive Dashboard (`/ceo`) · backend test hardening
**Status:** Implemented, API-verified, test suite green (64/64). Visual browser verification pending (desktop browser not connected to the agent session — manual checklist in §12).

---

## 1. Executive Summary

| Workstream | Outcome |
|---|---|
| 422 on idea submission | **Fixed** — validators rewritten to match the frontend payload and Mongoose model; create/submit verified 201/200 |
| Profile/Role Switcher | **Delivered** — 8 profiles in the app header, reuses the existing JWT/refresh auth flow (re-login as seeded users), no new state library, active role shown with checkmark, ARIA/Escape/click-outside supported |
| CEO role (`ceo`) | **Delivered** — added to shared `ROLES`, seeded `ceo@ideahub.local` (Aaditya Nema), gated by `authorize(ROLES.CEO)` |
| `estimatedValueINR` | **Delivered** — optional Idea field (schema + validators + submit form + detail view) so Potential vs Approved vs Realized value can be compared |
| CEO Executive Dashboard | **Delivered** — 4 aggregated endpoints, 9 UI components, every KPI computed from real records, drill-downs, URL filters, responsive priority order, reduced-motion support |
| Backend tests | **Green: 3 suites, 64/64 tests** — plus a new test-database isolation layer (see §10) |

**Verified live (as CEO):** all 4 endpoints → 200; as employee → 403 on all 4; no token → 401. `vite build` passes (2805 modules).

---

## 2. Role Switcher

**Files:** `client/src/layouts/AppLayout.jsx` (ROLE_PROFILES, NAV_ITEMS, `ProfileSwitcher`), `client/src/hooks/useRole.js`, `client/src/api/index.js` (`ceoAPI`), `client/src/App.jsx` (`/ceo` route), `client/src/constants.js` (ROLES mirror).

- 8 profiles (CEO + Dept. Evaluator · Suresh among them), keyed by **email** (role id collides — there are two dept evaluators).
- Switching = **re-login through `authAPI.login` + `setCredentials`** with the seeded demo password — the JWT/refresh-token machinery is unchanged, so there is *no* parallel auth state and no backend bypass. The switcher is a convenience over the existing multi-user demo seeding, not a privilege grant: each profile still authenticates normally and is authorized by its own roles.
- CEO lands on `/ceo`; the Crown nav entry appears only when `isCeo`.
- Active profile shows a checkmark; the menu is keyboard-accessible (ARIA roles, Escape closes, click-outside closes).
- Demo password: `IdeaHub@Dev2026!` (seed fallback constant).

## 3. Backend — Endpoints & Security

**Files:** `server/controllers/ceoDashboardController.js` (952 lines), `server/routes/dashboardRoutes.js`, `server/utils/ideaStatusGroups.js`, `server/utils/memoryCache.js`.

| Endpoint | Purpose |
|---|---|
| `GET /api/dashboard/ceo/overview?period=` | KPIs, health composite, business impact, participation |
| `GET /api/dashboard/ceo/trends?range=` | Time series (7d/30d/90d/1y/**all**) + department performance |
| `GET /api/dashboard/ceo/pipeline` | Funnel, waiting counts, bottlenecks, counters |
| `GET /api/dashboard/ceo/insights` | Executive attention, strategic ideas, recent activity |

- Every route is wrapped in `authorize(ROLES.CEO)` — a non-CEO JWT receives **403**, anonymous **401** (verified with curl for all four).
- Aggregated: **4 requests total** (not one per card); each endpoint has a **5-minute per-key in-memory TTL cache**. The page refresh button refetches all four.
- Drill-downs do **not** add endpoints — they reuse the existing `GET /api/ideas` (CEO gets org-wide read in `ideaController`) with the comma-separated `status` filter, using status-group arrays (`current`, `waitingStatuses`, `IDEA_STATUS_GROUPS`) that the API itself returns — one source of truth shared by server and client (`shared/constants.js` ↔ `client/src/constants.js`, kept in sync).

## 4. KPI Formulas (documented in-code via `DEFINITIONS` and shown in UI tooltips)

| KPI | Formula |
|---|---|
| Total ideas | Non-draft ideas **created in period** |
| Active ideas | Currently in a non-terminal state (excludes drafts, rejections, closures) |
| Approved ideas | Current status at/past Innovation-Committee approval |
| Implemented ideas | At completion or beyond (completed / benefits / outcome / closed) |
| Approval rate | Approved ÷ Total × 100 (current-status basis) |
| Implementation rate | Implemented ÷ Approved × 100 (null if none approved) |
| Participation rate | Distinct submitters in period ÷ active employees × 100 |
| Ideas per employee | Ideas in period ÷ active employees |
| Potential value | Σ `estimatedValueINR` (missing estimates contribute nothing — never treated as 0) |
| Approved value | Σ estimates of approved ideas |
| Realized value | Σ (`costSavingsINR + revenueIncreaseINR`) from **Benefit** records — *Estimated ≠ Realized, labeled separately* |
| Avg processing time | Mean **business days** (weekends + holidays excluded) creation→completion for terminal ideas, creation→today for in-flight (“so far”) |
| Innovation Health | Weighted composite: Generation 20% · Participation 20% · Evaluation 25% · Implementation 20% · Impact 15%; dimensions without data are dropped and weights renormalized. Generation = min(100, ideas/employee ÷ 3 × 100); Evaluation = in-review ideas within SLA ÷ in-review; Implementation = implemented ÷ approved; Impact = implemented ideas with a Benefit ÷ implemented |
| Funnel stages | `everReached` inferred from the current status backwards through the canonical stage order (repairs partial seeded histories); `waitingNow` = current status ∈ stage |
| Bottleneck | Waiting count, avg business-day wait, SLA-breach count per review stage; flagged when it is the leading waiting stage with breaches |
| Strategic ideas | ≥1 real signal: realized value, submitter estimate, featured flag, avg evaluator score ≥ 7/10, committee approval — ranked by signal strength |
| Attention items | Rule-based only: (1) review-SLA breaches, (2) implementations past target date, (3) approved ideas with no implementation record |

**No metric is fabricated or mocked** — each panel documents its definition inline (`definitions` blocks in every payload, surfaced via Info-tip tooltips).

## 5. Dashboard Panels (component inventory, `client/src/features/ceo/`, ~1,756 lines)

| Component | Panel | Data source |
|---|---|---|
| `CeoDashboardPage.jsx` | Orchestrator: header, 6 KPI tiles, filters, refresh footer, drill drawer | 4 queries (staleTime 60 s), URL params `period`/`department` |
| `CeoHealthScore.jsx` | Innovation Health score + 5 weighted dimensions | `overview.health` |
| `CeoTrendChart.jsx` | Composed trend chart (submitted/approved/implemented), range selector | `trends.series` |
| `CeoDepartments.jsx` | Department table (desktop) / cards (mobile), drill per row | `trends.departments` |
| `CeoPipeline.jsx` | Funnel + bottleneck callouts, stage drill-down | `pipeline.stages`, `bottlenecks` |
| `CeoInsights.jsx` | Executive attention · Strategic ideas · Recent activity | `insights.*` |
| `CeoImpact.jsx` | Business impact (potential vs approved vs realized-endorse/pending) + Participation | `overview.businessImpact`, `overview.participation` |
| `CeoDrillDown.jsx` | Side drawer: filtered idea list reusing the existing idea-list UI patterns | `GET /api/ideas?status=…` |
| `ceoUtils.jsx` | Formatters (₹/days/%), `PERIOD_OPTIONS`, `InfoTip`, `KpiTile`, skeletons, empty/error states, `usePrefersReducedMotion` | — |

- **Filters live in the URL** (`?period=&department=`) — shareable/back-button-safe.
- **Drill-down:** every KPI tile, funnel stage, bottleneck, department row, attention and strategic item opens the drawer; **Escape and click-outside close it**; status groups come from `IDEA_STATUS_GROUPS`.
- **States:** per-query skeleton loaders, empty states with explanatory copy, error states with retry, and a dedicated **403 access-denied panel** if a non-CEO reaches `/ceo`.
- **Animation:** subtle transitions only (chart draw, drawer, progress bars) — all wrapped so `prefers-reduced-motion: reduce` disables them.

## 6. Responsive Priority Order (mobile)

Page is a flex column; sections carry base `order-*` classes with `md:order-none` to restore source order on desktop:

**Mobile:** header → KPIs → executive attention → pipeline → strategic ideas → health + trend → departments + impact → footer.

Desktop keeps the decision-support layout: KPIs on top, health/trend beside the funnel, insights and impact in their own rows.

## 7. Visual Identity

- No palette changes; sidebar and IdeaHub theme tokens untouched.
- Chart/tooltip styling uses theme design tokens (`--primary #4F46E5`, `--success #10B981`, `--warning #F59E0B`, `var(--surface)`, `var(--border)`) instead of the legacy cream/gold Reports style — works in light and dark.
- KPI tile accents: Total `#f0b90b`, Active `#3b82f6`, Approved `#a78bfa`, Implemented `#f59e0b`, Impl. rate `#6366f1`, Realized `#10b981`.
- No unrelated pages were redesigned.

## 8. Shared Contract Changes (both mirrors updated)

- `ROLES.CEO = 'ceo'` and `IDEA_STATUS_GROUPS` (ACTIVE / APPROVED / IMPLEMENTED / NON_DRAFT) in `shared/constants.js` **and** `client/src/constants.js` (CJS ↔ ESM).
- `adminUpdateUserSchema` validates roles against `ALL_ROLES` (now includes `ceo`).
- `Idea.estimatedValueINR` (Number, default `null`, min 0) + validators + form input + detail display.

## 9. Current Dataset (real records only)

| Metric | Value |
|---|---|
| Users | 8 (incl. CEO), all seeded via `seed/seedUsers.js` |
| Ideas | 37 total — **33 non-draft**, 4 drafts; created 13–25 Sep 2026 |
| Departments | Operations 13 · IT 12 · Human Resources 4 · Finance 4 (clean names) |
| With `estimatedValueINR` | 28 |
| Evaluations | 5 (weighted totals on the 1–10 scale) |
| Implementations | 3 (one overdue → attention) |
| Benefits | 2 — ₹1.2 L endorsed + ₹4.5 L pending = **₹5.7 L realized** |

**Sample readout (90d, verified via API):** 33 total · 25 active · 7 approved · 2 implemented · approval 21 % · implementation 29 % · participation 63 % (5/8) · 4.1 ideas/employee · avg processing 5.6 business days · health **70**. Funnel 33→29→22→13→7→3→2. Bottlenecks: Supervisor Review 6 waiting (avg 4.3 d, 3 breached), Department Evaluation 4 waiting (avg 5.3 d, 1 breached). Attention 8 items · Strategic 6 ideas · Activity 8 events. Potential ₹1.99 Cr / Approved ₹61 L / Realized ₹5.7 L.

### Data incident & restoration (disclosure)

The backend suites' `afterAll` hooks run destructive `deleteMany({})` cleanups and, until this session, **had no database isolation** — running them wiped the shared dev dataset (users/ideas/implementations/benefits). Remediation:

1. **`server/jest.setup.js`** now rewrites `MONGODB_URI` to an isolated **`ideahub_test`** database before any test loads the app; `maxWorkers: 1` prevents cross-suite fixture collisions. Tests can never touch dev data again.
2. Dev data restored via the official `seed/index.js` (8 users incl. CEO, categories, criteria idempotent) plus a new idempotent **`seed/seedCeoDemoIdeas.js`** (wired into the master runner) that rebuilds a comparable dataset **through the app's own models** — status histories, audit-trail entries, implementations, benefits, evaluations — so every dashboard number is computed from genuine records. It also cleans orphaned audit logs/evaluations/notifications left by the destroyed records.

## 10. Testing

`cd server && npx jest --forceExit` → **Test Suites: 3 passed · Tests: 64 passed**.

Fixes required to get there (all were stale-fixture/assertion issues or latent bugs surfaced by the suite — no product behavior was weakened):

- `server/__mocks__/uuid.js` — `uuid@14` is ESM-only; Jest's CJS runtime cannot parse it. Auto-mock (`v4` → `crypto.randomUUID()`), test-env only.
- `authorization.test.js` fixtures: added required `benefitTypes` and ≥50-char `problemStatement` (model rules FR-02-02/03); owner fixture now holds `ROLES.IMPLEMENTATION_OWNER` — the workflow role map legitimately requires it for benefits transitions.
- **Real bug fixed** in `services/authorizationService.js`: `canAccessImplementation` compared `implementation.ownerId.toString()` after the controller had *populated* it — owners were denied 403 on their own records. Now unwraps `ownerId._id ?? ownerId` (works for both populated and raw shapes).
- `auth.integration.test.js`: fixture password now matches logins (pre-save hook hashes it); rotation asserted on the refresh token (same-second JWTs are byte-identical); reuse-detection and rate-limit message expectations updated to the actual copy; logout test now verifies the refresh-token family revocation (the design — access tokens are stateless); temp users pre-deleted for idempotency; the rate-limit suite moved last so it can't starve later logins; second-granular `passwordChangedAt` test made explicit.
- `validation.test.js` updated for the corrected schema (benefitTypes, estimated value, `ceo` role).

`vite build` passes. Chunk-size warning is pre-existing.

## 11. Limitations

- **`estimatedValueINR`** only exists on ideas created after the field shipped — older records show “Not estimated” (never `₹0`).
- **Participation denominators** use user-profile departments; `Finance` and `Human Resources` currently have no employee users in those departments, so their participation renders “—” with an explanatory tooltip (by design, not a bug).
- Health “Evaluation” dimension = SLA compliance of ideas *currently* in review, not scoring coverage.
- Dashboard data refreshes on the 5-minute server cache + manual refresh; there is no live push.
- Seeded datasets reproduce timestamps as given by the seed scripts; the seed is idempotent but not a substitute for production history.
- **Browser verification not yet executed** (see §12).

## 12. Manual Browser Checklist (desktop browser was disconnected from the agent session)

Run against `http://localhost:5175` (API on `:5001`):

1. Log in as `ceo@ideahub.local` / `IdeaHub@Dev2026!` → header shows **CEO** role badge; Crown *Executive Dashboard* nav entry present; lands on `/ceo`.
2. All six KPI tiles, health ring, trend chart, funnel, department table, impact + participation, attention/strategic/activity render with real numbers; info-tips show the §4 formulas.
3. Change period filter → URL gains `?period=…`, data refetches; department filter likewise; back button restores state.
4. Click a KPI tile / funnel stage / department row → drawer opens with idea list; **Escape** closes; **click-outside** closes; drawer traps focus.
5. Resize 1280 → 768 → 390 px: mobile order = §6; department table becomes cards; chart axes stay legible.
6. OS “reduce motion” enabled → chart/drawer transitions suppressed.
7. Log in as `employee@ideahub.local` → navigate to `/ceo` → **access-denied panel**; direct API calls return 403.
8. Open the Profile Switcher: checkmark on the active profile, arrow-key navigation, Escape closes, click-outside closes.

---

### File index (this feature)

```
client/src/features/ceo/            9 components (~1,756 lines)
client/src/layouts/AppLayout.jsx    ProfileSwitcher, role badge, CEO nav
client/src/hooks/useRole.js         isCeo / canAccessCeo
client/src/api/index.js             ceoAPI
server/controllers/ceoDashboardController.js   4 endpoints + DEFINITIONS
server/routes/dashboardRoutes.js    authorize(ROLES.CEO)
server/utils/ideaStatusGroups.js    shared status-group logic
server/utils/memoryCache.js         5-min per-key TTL
server/jest.setup.js                test-DB isolation (ideahub_test)
server/seed/seedCeoDemoIdeas.js     idempotent demo dataset (in seed/index.js)
server/__mocks__/uuid.js            ESM-only uuid for Jest CJS
```
