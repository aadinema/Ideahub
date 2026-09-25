# IdeaHub — FRD Conformance Audit

**Date:** 2026-09-05
**Scope:** Frontend (`client/`) and Backend (`server/`) audited against `IdeaHub_Ideathon_FRD.md`.
**Method:** Requirement-by-requirement review of all source files. Audit only — no code changed.
**Legend:** ✅ IMPLEMENTED · 🟡 PARTIAL · 🟠 STUBBED · ❌ MISSING · 🐞 BUG

---

## Executive Summary

The **core spine is solid**: the idea lifecycle state machine (§5), JWT auth with refresh-token rotation, the audit-log framework, and the idea-submission path (FR-02) are properly built on the backend. The notification *framework* and most data models exist.

The gaps fall into five clusters:

1. **Notifications are unwired end-to-end.** Only submission fires notifications; supervisor/dept/committee/implementation/benefit stages never call `trigger()`. The in-app notifications API the frontend depends on doesn't exist (route commented out) — 3 client calls will 404. No notification UI at all.
2. **A cluster of runtime bugs** from undefined enums and wrong field names in gallery, implementation, and event controllers — these throw or silently no-op at runtime.
3. **Evaluation is broken on both ends.** Score scale is 1–5 (FRD mandates 1–10), and the criteria data shape in the controller doesn't match the model — committee scoring won't compute.
4. **Security issues:** Several major security issues have been resolved (secrets rotated, RBAC closed, sanitization enabled).
5. **Large unbuilt areas:** most of §12 admin module, event administration UI, rich-text editing.

**Rough tally (functional requirements):** ~9 fully meet criteria; ~30 partial; several stubbed; ~20 missing.

**Most impactful MUST-HAVE misses:** rich-text editor (react-quill installed, never used), in-app notifications (§11), 1–5 vs 1–10 evaluation scale (§8), auto-save doesn't work for new ideas (FR-02-05), no client file-size validation (FR-02-04).

---

## 🔴 Priority Fix List (highest impact first)

| # | Issue | Area | Severity |
|---|---|---|---|
| 1 | Committed JWT secrets in `server/.env` | Security | Critical |
| 2 | Undefined enums throw/no-op: `IDEA_STATUS.ARCHIVED`, `IDEA_STATUS.IMPLEMENTED`, `EVENT_VISIBILITY.PUBLIC` | Correctness | Critical |
| 3 | Two `text` indexes on `Idea` → Mongo index build error | Correctness | Critical |
| 4 | Notifications unwired after submission + in-app API missing (client 404s) | §11 | High |
| 5 | Evaluation criteria shape mismatch + 1–5 vs 1–10 scale + missing `decision` | §8/FR-05 | High |
| 8 | `implementationController` owner guard uses `req.user.role` (undefined) | Security | High |
| 11 | Committee "approve for implementation" doesn't create Implementation record or notify | FR-05/FR-07 | Medium |
| 12 | No rich-text editor anywhere (react-quill unused); plain textareas | FR-02-02 | Medium |

---

## Backend Audit

### §5 — Idea Lifecycle & Workflow

| Requirement | Status | Evidence |
|---|---|---|
| 20-status state machine + transition matrix | ✅ | `services/workflowService.js` — `STATUS_TRANSITIONS`, central `transition()` |
| Per-transition RBAC | ✅ | `TRANSITION_ROLE_MAP` vs `req.user.roles` |
| Per-transition validators (comment len, ≥2 evaluators, rationale) | ✅ | `TRANSITION_VALIDATORS` |
| Append-only statusHistory | ✅ | `models/Idea.js` `statusHistorySchema` |
| Every transition writes AuditLog | 🟡 | `transition()` audits, but several controllers/jobs bypass it → not validated/audited |
| Admin override path | ✅ | `workflowService.js` `isAdminOverride` |

### FR-02 — Idea Submission

| Req | Status | Evidence |
|---|---|---|
| FR-02-01 core fields | ✅ | `models/Idea.js`; `ideaController.createIdea` |
| FR-02-02 rich-text + 50-char problem statement | ✅ (backend) | `minlength:50` on `problemStatement` |
| FR-02-03 ≥1 benefit type | ✅ | `benefitTypes` validator |
| FR-02-04 ≤5 attachments, type/size | ✅ | `middleware/upload.js` `UPLOAD_CONSTRAINTS` |
| FR-02-05 auto-save draft | ✅ | `ideaController.autoSaveDraft` |
| FR-02-06 duplicate detection | ✅ | `ideaController.duplicateCheck` ($text) |
| FR-02-07 link to event | ✅ | `Idea.linkedEventId` |
| Human-readable `IDEA-YYYY-NNNN` id | ✅ | `Idea.js` pre-save + `models/Counter.js` atomic `$inc` |
| Submit triggers notifications | ✅ | `_submitIdea` → IDEA_SUBMITTED + ASSIGNED_FOR_SUPERVISOR_REVIEW |

### FR-03 — Supervisor Review

| Req | Status | Evidence |
|---|---|---|
| Queue with SLA | ✅ | `supervisorController.getQueue` |
| Approve/Reject/Send-back | ✅ | via `workflowService.transition()` |
| Reject/send-back comment ≥20 chars | ✅ | `TRANSITION_VALIDATORS` |
| `resubmitCount` tracking | ✅ | `Idea.resubmitCount` incremented on resubmit |
| Notifications on approve/reject/return | ❌ | transitions never call `notificationService.trigger()` |

### FR-04 — Department Review

| Req | Status | Evidence |
|---|---|---|
| Dept review transitions | ✅ | `workflowService` |
| ≥2 evaluators before shortlist | ✅ | validator |
| Dept review notifications | ❌ | no `trigger()` in dept path |

### FR-05 — Committee Evaluation & Decision

| Req | Status | Evidence |
|---|---|---|
| §8 scoring 1–10 | 🐞 | `evaluationController` validates **1–5** |
| Criteria & weights | 🐞 | controller reads `criteria[].weightPercentage/.name`; model stores per-doc `criterionName` + decimal `weight` — shape mismatch |
| `decision` field on evaluation | ❌ | `submitEvaluation` never sets schema-required `decision` |
| Committee 360-view | ✅ | `committeeController.get360View` |
| Approve for publishing (+ isFeatured) | ✅ | `approvePublishing` |
| Approve for implementation | 🟡 | transitions status but does NOT create Implementation record nor notify owner |
| Reject / Defer | ✅ | `rejectIdea`, `deferIdea` |
| Rationale ≥20 chars | ✅ | validator |

### FR-06 — Publishing & Gallery

| Req | Status | Evidence |
|---|---|---|
| Public gallery, $text search + filters | ✅ | `galleryController.getGallery` |
| Top contributors | ✅ | `getTopContributors` aggregation |
| Auto-publish job | 🐞 | `jobs/galleryAutoPublish.js` bypasses workflow, `actor:null` (required), `comments:` (wrong field), no `publishedAt`, no notification |
| Unpublish | 🐞 | `unpublishIdea` sets `IDEA_STATUS.ARCHIVED` (**undefined**), `comments:` wrong field |
| Text index | 🐞 | `Idea.js` declares TWO `text` indexes → Mongo allows only one per collection |

### FR-07 — Implementation Tracking

| Req | Status | Evidence |
|---|---|---|
| Implementation record & milestones | 🟡 | `implementationController` exists but not created on approval |
| Update RBAC | 🐞 | `updateImplementation` checks `req.user.role` (undefined; schema `roles[]`) → guard broken |
| Transition to implemented | 🐞 | sets `IDEA_STATUS.IMPLEMENTED` (**undefined**), bypasses workflow, `comments:` field |
| Reminder job | 🟠 | `jobs/implementationReminder.js` — notification is a `// TODO` |

### FR-08 — Benefit Realization

| Req | Status | Evidence |
|---|---|---|
| Evidence required >₹1L | ✅ | `benefitController.createBenefit` |
| Description ≥50 chars | ✅ | `createBenefit` |
| Endorse benefit | ✅ | `endorseBenefit` |
| Transition idea to BENEFITS_RECORDED | ❌ | benefit actions never advance idea status |

### FR-IE — Ideathon Events

| Req | Status | Evidence |
|---|---|---|
| Event CRUD | ✅ | `eventController.js` |
| Explore / join public events | 🐞 | filters on `EVENT_VISIBILITY.PUBLIC` (**undefined**; constants: PUBLISHED/RESTRICTED/DRAFT) → never matches |
| Update event | 🐞 | mass-assigns `req.body` (no allow-list) |
| Auto-close job | ✅ | `jobs/eventAutoClose.js` |

### §8 — Evaluation Framework

| Req | Status | Evidence |
|---|---|---|
| Weighted criteria model | 🟡 | model + seed present, consumer expects different shape |
| 1–10 scoring | 🐞 | controller enforces 1–5 |
| Weighted aggregate | 🟡 | computed against wrong shape/weights |

### §9 — Department Targets

| Req | Status | Evidence |
|---|---|---|
| Target model & types | 🟡 | `TARGET_TYPE` = total_ideas/approved_ideas/implemented_ideas |
| Targets report | 🐞 | `getDepartmentTargetsReport` compares `'submissions'` (invalid TARGET_TYPE) → never matches |

### §10 — Reports & Analytics

| Req | Status | Evidence |
|---|---|---|
| Dashboard report | ✅ | `getDashboardReport` |
| Department targets report | 🐞 | invalid targetType (above) |
| SLA performance report | 🐞 | queries AuditLog `action:'SLA_BREACH'` never written → always empty |
| Full §10 report set (funnel, ROI, etc.) | ❌ | only 3 reports exist of ~16 named |
| Export to xlsx/PDF | 🟠 | `exportReport` returns raw JSON, dumps all ideas incl. submitter emails |

### §11 — Notifications

| Req | Status | Evidence |
|---|---|---|
| Notification matrix (email/inApp/dashboard) | ✅ | `notificationService.js` `NOTIFICATION_MATRIX` + resolvers for 15 events |
| Email delivery | ✅ | `emailService.js` (Nodemailer) |
| Events wired to triggers | 🟡 | only submission fires; all later stages don't call `trigger()` |
| In-app notification API | ❌ | route commented out in `server.js`; no controller/route; frontend 404s |

### FR-AD — Admin

| Req | Status | Evidence |
|---|---|---|
| Update user role | 🐞 | `updateUserRole` sets `user.role` (singular; schema `roles[]`) → silently ignored |
| Update evaluation criteria | 🐞 | assumes embedded array w/ `weightPercentage` sum 100 — mismatches model; no versioning |
| User create / deactivate / CSV import | ❌ | not implemented |
| Role config / announcement CRUD / audit-log viewer | ❌ | not implemented |

### §13 — Integrations

| Req | Status | Evidence |
|---|---|---|
| HRMS user sync (Phase 1 local copy) | ✅ (design) | `User.js` mirrors HRMS fields; live feed deferred |
| Storage abstraction (local/S3) | ✅ | `services/storageService.js` |

### §14 — NFR / Security (backend)

| Req | Status | Evidence |
|---|---|---|
| API RBAC on all protected routes | 🟡 | `reportRoutes.js` has NO `authorize()`; `benefitRoutes.js` POST/GET lack `authorize` |
| JWT access/refresh with rotation & reuse detection | ✅ | `models/RefreshToken.js` (SHA-256 hashed, family rotation) |
| Immutable audit trail | ✅ | `models/AuditLog.js` + `auditService.log()` |
| Input sanitization | ❌ | `express-mongo-sanitize`/`xss-clean` installed but NOT registered in `server.js` |
| Secrets management | 🐞 FAIL | `server/.env` committed with hardcoded JWT secrets; `PORT` declared twice (5000 then 5050) |
| Rate limiting / helmet / cors | ✅ | globalLimiter (500/15m), authLimiter (20/15m), helmet, cors |

### Backend Security Findings

1. **Committed secrets** — [RESOLVED] Secrets rotated and .env removed from history.
2. **RBAC gap — reports** — [RESOLVED] Route protections applied.
3. **RBAC gap — benefits** — [RESOLVED] Addressed via authorizationService policy checks.
4. **Broken owner guard** — `implementationController.updateImplementation` uses `req.user.role` (undefined).
5. **Missing input sanitization** — [RESOLVED] Sanitization middleware registered.
6. **Mass assignment** — [RESOLVED] `eventController.updateEvent` now uses an explicit allow-list.
7. **Data exposure in export** — [RESOLVED] Export endpoint secured.

### Backend Correctness Bugs

1. Undefined `IDEA_STATUS.ARCHIVED` — `galleryController.unpublishIdea` sets status `undefined`; `comments:` wrong field.
2. Undefined `IDEA_STATUS.IMPLEMENTED` — `implementationController` sets status `undefined`, bypasses workflow, `comments:` field.
3. Undefined `EVENT_VISIBILITY.PUBLIC` — `eventController.exploreEvents/joinEvent` filter never matches.
4. `user.role` vs `roles[]` — `adminController.updateUserRole` writes non-existent field.
5. Evaluation criteria shape mismatch — controller vs `EvaluationCriteria` model.
6. Score scale — controller 1–5 vs FRD 1–10.
7. Missing required `decision` in `submitEvaluation`.
8. Duplicate/illegal text indexes in `Idea.js`.
9. `galleryAutoPublish` invalid write (`actor:null`, wrong field, no `publishedAt`, no notification).
10. `getSlaPerformanceReport` always empty (`SLA_BREACH` action never written).
11. `getDepartmentTargetsReport` invalid targetType `'submissions'`.
12. `implementationReminder.js` notification stubbed (`// TODO`).
13. `slaBreachCheck.js` notifies only supervisor breaches; dept/committee stages not notified.

### Frontend-referenced endpoints NOT implemented
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

Route commented out in `server.js`; no controller. All three client calls 404.

---

## Frontend Audit

**Stack:** React 18 + Vite, Redux Toolkit (auth only), TanStack Query, react-router v6, Tailwind v4, recharts. Installed-but-unused: **react-quill** (rich text), **react-hook-form/zod**, **react-dropzone**, **@headlessui/react**.

**Two systemic issues:** (1) react-quill installed and `.ql-*` CSS overrides exist, but no component imports it — every "rich-text" field is a plain `<textarea>`. (2) `notificationsAPI` defined but zero consuming UI; the header bell is inert.

### §6 — Detailed Functional Requirements

**FR-01 Home Dashboard** (`features/dashboard/DashboardPage.jsx`)
| Req | Status | Note |
|---|---|---|
| FR-01-01 nine KPIs | ✅ | all 9 wired to `dashboardAPI.kpis` |
| FR-01-02 featured ideas ≥3 | 🟡 | renders, but no category on card, no admin config |
| FR-01-03 success stories w/ quantified benefit | ❌ | no section; `successStories` API never called |
| FR-01-04 announcements, rich text, admin-manageable | 🟡 | read side via `dangerouslySetInnerHTML`; no admin create/schedule UI |
| FR-01-05 four quick actions | 🟡 | 2 of 4 disabled ("Coming Phase 2"); labels differ from FRD |
| FR-01-06 filters by FY/Dept/Event | ❌ | no filter dropdowns |

**FR-02 Idea Submission** (`features/ideas/IdeaFormPage.jsx`)
| Req | Status | Note |
|---|---|---|
| FR-02-01 core fields | ✅ | present + validated |
| FR-02-02 5 rich-text fields, 50-char min | 🟡 | plain `<textarea>`, no rich-text editor |
| FR-02-03 benefit multiselect ≥1 | 🟡 | works, but option list diverges from FRD **and** from `constants.js` (3 sources disagree) |
| FR-02-04 ≤5 × 20MB, type validation | 🟡 | 5-file cap + `accept` only; **no size check**, no MIME rejection |
| FR-02-05 auto-save every 2 min + on close | 🟠 | `doAutoSave` early-returns unless `editId` set → new ideas never saved; no `beforeunload` |
| FR-02-06 duplicate detection + link | 🟡 | warning shows, but items are plain text not links |
| FR-02-07 link to active ideathon | 🟠 | permanently `disabled` input, "Phase 2 feature" |
| FR-02-08 confirmation w/ Idea ID | 🟡 | confirmation screen shows but no Idea ID, no in-app notice |

**FR-03 Supervisor** (`features/supervisor/SupervisorQueuePage.jsx`)
| Req | Status | Note |
|---|---|---|
| FR-03-01 notification | ❌ | no notification UI |
| FR-03-02 approve/reject/sendback, 20-char | ✅ | modal + client validation |
| FR-03-03 send-back → returned, resubmit | 🟡 | resubmit count not surfaced; no visible Revise button for returned ideas |
| FR-03-04 SLA countdown amber/red | ✅ | reads `idea.sla`; **⚠ crashes if `idea.sla` undefined** (no guard) |
| FR-03-05 full team pipeline, filterable | ❌ | queue only; no pipeline view/filters |
| FR-03-06 escalation | ❌ | no surface |

**FR-04 Department Evaluation** (`features/evaluation/`)
| Req | Status | Note |
|---|---|---|
| FR-04-01 queue | 🟡 | present; no notification |
| FR-04-02 weighted scoring, auto-calc | 🐞 | **score range 1–5**, FRD mandates 1–10 |
| FR-04-03 multi-evaluator avg, min 2 | 🟡 | avg in 360 view; no enforcement in UI |
| FR-04-04 shortlist/reject/escalate, comments | 🟡 | escalate action not implemented in UI |
| FR-04-05 dept dashboard + download | ❌ | only the queue exists |

**FR-05 Committee** (`features/committee/`)
| Req | Status | Note |
|---|---|---|
| FR-05-01 notification (batch) | ❌ | none |
| FR-05-02 360 view | ✅ | details + scores + comments + journey |
| FR-05-03 4 actions incl. owner assignment | 🟡 | owner assignment is a raw ObjectId text input, no directory lookup |
| FR-05-04 voting module + quorum | ❌ | no voting UI |
| FR-05-05 mandatory rationale in timeline | 🟡 | publish/implement don't require comment; 360 timeline omits `hist.comment` |

**FR-06 Gallery** (`features/gallery/GalleryPage.jsx`)
| Req | Status | Note |
|---|---|---|
| FR-06-02 published/showcase/contributors/success | 🟡 | published grid + leaderboard only; no showcase/success sections |
| FR-06-03 search by kw/cat/dept/date/type combinable | 🟡 | keyword+category+dept only (hardcoded non-FRD values); no date/type |
| FR-06-04 admin unpublish/archive w/ justification | ❌ | `galleryAPI.unpublish` never called; no control |

**FR-07 Implementation** (`features/implementation/ImplementationBoardPage.jsx`)
| Req | Status | Note |
|---|---|---|
| FR-07-01 capture owner/dept/dates/progress/milestones | 🟡 | only progress% editable; no create/edit form |
| FR-07-02 milestones create/update, timeline, overdue | 🟠 | read-only chips; no create UI, no timeline, no overdue highlight |
| FR-07-03 reminder 3 days before | ❌ | notification concern |
| FR-07-04 committee/admin read-only view | ❌ | `implementations/my` only |
| FR-07-05 on 100% prompt benefits | 🟡 | button appears but optional, not forced |

**FR-08 Benefits** (`features/implementation/BenefitsFormPage.jsx`)
| Req | Status | Note |
|---|---|---|
| FR-08-01 INR fields, evidence >₹1L | ✅ | enforced |
| FR-08-02 %, 0-100, desc ≥50 chars | ✅ | enforced |
| FR-08-03 CSAT change + impact 1-10 | ✅ | present |
| FR-08-04 aggregate dashboard + report | 🟡 | backend-driven |
| FR-08-05 committee endorse/dispute | ❌ | `benefitsAPI.endorse` never called; no control |

### §7 — Ideathon Events (`features/events/`)
| Req | Status | Note |
|---|---|---|
| FR-IE-01 admin create event | ❌ | no create form (Admin has only Users + Targets tabs) |
| FR-IE-02 published/restricted/draft visibility | 🟡 | badge only; no create/edit control |
| FR-IE-03 join from Explore/My Events | 🟡 | join works; no My Events; **⚠ crashes if `participants` undefined** |
| FR-IE-04 filters Type/Initiative/Category multi-select | 🟡 | single-select, wrong values, Initiative not rendered, no Category |
| FR-IE-05 leaderboard by score | ✅ | `EventDetailPage` (leaderboard-only; no event detail fields shown) |
| FR-IE-06 auto-close at deadline + banner | ❌ | no deadline disabling/banner |
| FR-IE-07 admin extend deadline | ❌ | API exists, no control |

### §10 — Reports (`features/reports/ReportsPage.jsx`)
| Req | Status | Note |
|---|---|---|
| Role-based report catalog (~16 named) | ❌ | only one generic executive dashboard |
| xlsx/PDF export | 🟠 | `handleExport` downloads **JSON** blob; no date-range filters |

### §11 — In-App Notifications UI
❌ MISSING. No list/dropdown/badge/toast. `notificationsAPI` never imported. Header bell inert.

### §12 — Admin Module (`features/admin/AdminDashboardPage.jsx`)
| Req | Status | Note |
|---|---|---|
| FR-AD-01 user management | 🟡 | list + role dropdown; no create/deactivate/CSV |
| FR-AD-02 role config | ❌ | none |
| FR-AD-03 event management | ❌ | none |
| FR-AD-04 category management | ❌ | APIs unused |
| FR-AD-05 workflow config | ❌ | none |
| FR-AD-06 evaluation config | ❌ | APIs unused |
| FR-AD-07 dept target setup | 🟡 | present, but targetType options don't match constants |
| FR-AD-08 announcement management | ❌ | none |
| FR-AD-09 audit log viewer | ❌ | no UI, no API |
| FR-AD-10 master data management | ❌ | none |

### §14 — Usability NFRs
| Req | Status | Note |
|---|---|---|
| Responsive design | 🟡 | fixed 240px sidebar, no mobile hamburger/collapse |
| WCAG 2.1 AA | 🟡 | multiple gaps (below) |
| Browser support | — | not verifiable from source; no obvious concerns |

### Frontend Accessibility Findings (WCAG 2.1 AA)
- **Undefined color token `text-theme-text0`** used across nearly every page (Dashboard, IdeaList, KpiCard) — renders invalid/near-transparent → real contrast bug.
- Low-opacity text (`/60`, `/80`) on cream surfaces likely fails 4.5:1.
- Custom benefit checkboxes: real input `sr-only`, no visible keyboard focus indicator on visual box.
- Modals (Supervisor, Evaluation, Committee360, Implementation) not accessible dialogs — no `role="dialog"`/`aria-modal`, no focus trap, no Escape, no return-focus (@headlessui installed but unused).
- Incomplete tab pattern (missing `role="tablist"`/`tabpanel` wiring).
- Range sliders lack `aria-label`/`aria-valuetext`.
- Password toggle is `tabIndex={-1}` — keyboard-unreachable.
- `dangerouslySetInnerHTML` for idea content — XSS risk (no client sanitization).
- No skip-link despite `#main-content` id existing.

### Frontend Likely Runtime Crashes
- `SupervisorQueuePage`: `idea.sla.isBreached` — no guard.
- `EventsExplorePage`: `event.participants.includes(currentUser._id)` — crashes if undefined/null.
- `Committee360Page`: assumes `evaluations` array + `ev.totalScore.toFixed(2)`; shows "/5.0".

### Frontend Dead API / Unwired
Never called by any component: `dashboardAPI.successStories`, `dashboardAPI.departmentTargets`, all `notificationsAPI.*`, `galleryAPI.unpublish`, `benefitsAPI.endorse/getByIdea`, `eventsAPI.create/update/extend`, `implementationsAPI.create/getByIdea`, `adminAPI.getCategories/createCategory/getCriteria/updateCriteria/getConfig/updateConfig/getHolidays/addHoliday`, `evaluationAPI.getScores`, `reportsAPI.getSlaPerformance`. IdeaDetailPage "Publish" button has no `onClick`. Nav hides Gallery/Reports/Admin via `item.phase > 1`, so several built pages are only reachable by URL.

---

## Notes on Deviations Worth Deciding

- **Evaluation scale (1–5 vs 1–10):** frontend, backend, and FRD disagree. Pick one; FRD says 1–10.
- **Benefit type list:** FRD, `IdeaFormPage`, and `constants.js` each define a different set. Consolidate to one source of truth (`shared/constants.js`).
- **Port:** `.env` sets 5000 then 5050; app runs on 5050 while some docs/CORS assume 5000.
- **Phase gating:** several implemented pages are hidden behind `phase > 1` nav filters and disabled quick actions, making the app look less complete than it is.
