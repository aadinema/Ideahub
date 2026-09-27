# Decisions — IdeaHub

Last verified: 2026-09-27
Scope: **only** decisions explicitly confirmed by the user. Assumptions, defaults,
and open questions do **not** belong here — open questions are tracked in
`known-issues.md` (OPEN/IN PROGRESS/FIXED convention).
Source: `ASSUMPTIONS.md` entries marked "✅ Confirmed by user" + session confirmations.
Rationale is recorded only where the source states it; otherwise marked
"not recorded in source" rather than invented.

## DEC-001 — Financial Year starts April 1 (label `FY2026-27`)
**Source:** `ASSUMPTIONS.md` AUTH-001 (✅ Confirmed by user)
**Status:** Confirmed
**Decision:** Financial Year starts April 1. FY label format is `FY2026-27`.
**Rationale:** India-standard financial year (stated in source).
**Impact:** `getFYLabel()` / `getFYDateRange()` in `shared/constants.js` (L364/L375);
KPI filters; `DepartmentTarget.financialYear`.

## DEC-002 — Business-day SLA excludes weekends and holidays
**Source:** `ASSUMPTIONS.md` AUTH-002 (✅ Confirmed by user)
**Status:** Confirmed
**Decision:** Business days = Mon–Fri, excluding public holidays in the
`HolidayCalendar` collection. `HolidayCalendar` ships empty; an admin adds holidays
via Admin → Master Data without a redeploy.
**Rationale:** Not recorded in source.
**Impact:** business-day calculation; SLA cron jobs.
**Correction (2026-09-27):** AUTH-002 cites `slaService.js`, which **does not exist**.
Actual location: `server/utils/businessDays.js` (plus `jobs/slaBreachCheck.js`).
Drift logged in CHANGELOG.md.

## DEC-003 — Committee voting → available follow-up actions
**Source:** `ASSUMPTIONS.md` AUTH-003 (✅ Confirmed by user)
**Status:** Confirmed
**Decision:**
- Majority **approval** → commit page offers: **Approve for Publishing**,
  **Approve for Implementation**, **Defer**.
- Majority **rejection** → commit page offers only **Reject**.
- Default quorum: `majority` (>50% of active committee members), configurable via
  Admin → Workflow Config as `quorumType` (`majority` | `fixed_count`) + `quorumValue`.
**Rationale:** Not recorded in source.
**Impact:** committee review screen; voting aggregation; `SystemConfig.defaultQuorum`.

## DEC-004 — Implementation owner eligibility (rule A)
**Source:** user decision, 2026-09-27 (Phase 2, KI-005)
**Status:** Confirmed
**Decision:** An assignable Implementation Owner must be **active** AND hold
`ROLES.IMPLEMENTATION_OWNER` (or be ADMIN as a fallback). **Department match is NOT
required** (dept-agnostic).
**Rationale:** `workflowService.TRANSITION_ROLE_MAP` only permits IMPLEMENTATION_OWNER
(or ADMIN) to transition implementation/benefit statuses, so a non-role owner is a
dead assignment. Department-only (old rule) was rejected because it let unassignable
owners be selected; requiring role **and** department was rejected because it would
make Finance/HR ideas unassignable except via admin escalation.
**Follow-on:** the committee owner picker keeps a **soft** same-department default with
an opt-in to show all owners (a nudge, not a constraint).
**Impact:** `services/authorizationService.js` `validateImplementationOwner`;
`controllers/committeeController.js` (`approveImplementation`);
`controllers/implementationController.js`; `Committee360Page.jsx` picker.

## Deliberately not recorded here
- `ASSUMPTIONS.md` AUTH-004…AUTH-010 — **pending user review**; not yet classified as
  confirmed decisions (see CHANGELOG 2026-09-27).
- Open FRD questions FR-05-04, FR-06-02, FR-AD-08 → tracked in `known-issues.md`
  (KI-008…KI-010), not here.
