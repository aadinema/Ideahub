# MASTER BUILD PROMPT — IdeaHub (Ideathon) — MERN Stack
**Paste this entire document into Antigravity as the system/task prompt. Do not summarize, skip, or reorder sections. Build strictly against this spec — no invented fields, roles, statuses, or endpoints.**

---

## 0. ROLE & OPERATING RULES

You are a Senior Full-Stack Engineer (10+ years) building a production-grade enterprise application. Follow these non-negotiable rules:

1. **Zero hallucination policy**: Only implement entities, fields, statuses, roles, and workflows explicitly listed in Section 3–12 below. If something is ambiguous, add a `// TODO: confirm with FRD` comment instead of inventing behavior.
2. **Build in vertical slices, not layers**: Complete one module fully (schema → API → validation → frontend → tests) before moving to the next. Follow the module order in Section 13 (Build Plan).
3. **No placeholder/mock data left in final code.** Seed scripts are allowed and must be clearly separated in `/server/seed`.
4. **Every API must enforce RBAC** per Section 4. Never rely on frontend-only role checks.
5. **State assumptions explicitly** in a running `ASSUMPTIONS.md` file at project root whenever the FRD is ambiguous.
6. **After each module, output a short status report**: files created, endpoints added, what's tested, what's pending.
7. Stack is **MERN only**: MongoDB, Express.js, React (v18+), Node.js. Do not introduce Next.js, Prisma, or other frameworks unless explicitly asked.

---

## 1. PROJECT SUMMARY

**Project**: IdeaHub (Ideathon) — Enterprise Innovation & Ideation Management System for MPOnline Limited.

**Purpose**: Let employees submit ideas → route through Supervisor → Department Innovation Team → Innovation Committee → Publish → Implement → Track Benefits → Close. Full audit trail, RBAC, notifications, reporting.

**Explicitly OUT OF SCOPE for this build** (do not implement, but architect so they can be added later without rework):
- AI-based idea recommendation / duplicate-detection engine (only a simple keyword/title-match duplicate warning is IN scope — see FR-02-06)
- Gamification/rewards engine
- Native mobile apps
- Real-time social feed (like/comment/share)
- Direct ERP/HRMS integration (build the integration points as stubbed service interfaces only)

---

## 2. TECH STACK (MERN — exact choices)

**Frontend**
- React 18 + Vite
- React Router v6
- TailwindCSS for styling
- React Query (TanStack Query) for server state
- Zustand or Redux Toolkit for client/global state (choose Redux Toolkit for predictability at enterprise scale)
- React Hook Form + Zod for form validation
- Axios for HTTP
- Recharts for dashboard/report charts
- react-dropzone for attachment uploads

**Backend**
- Node.js (LTS) + Express.js
- MongoDB + Mongoose ODM
- JWT-based auth (access + refresh token pattern) — stub SSO/AD integration behind an `AuthProvider` interface (Section 13, Phase 1)
- bcrypt for local credential hashing (used only until SSO stub is replaced)
- express-validator or Zod for request validation
- Multer + local/S3-compatible storage abstraction for attachments (max 5 files, 20MB each — FR-02-04)
- node-cron for scheduled jobs (SLA breach checks, reminders, auto-close events)
- Nodemailer for email notifications (SMTP)
- winston or pino for structured logging
- helmet, cors, express-rate-limit for security baseline

**Cross-cutting**
- Role-Based Access Control middleware (Section 4)
- Centralized audit-log service (every create/update/delete/approval action — FR-AD-09, NFR Audit)
- Centralized notification service (Section 11)
- Centralized error-handling middleware with consistent error shape

**Testing**
- Jest + Supertest (backend)
- React Testing Library + Vitest (frontend)

---

## 3. USER ROLES & RBAC MATRIX (Section 4 of FRD — implement exactly these 6 roles)

| Role | Key Permissions |
|---|---|
| `employee` | Create idea, view own ideas, join events, view published gallery |
| `supervisor` | View team ideas, approve/reject/return idea, team reports |
| `dept_innovation_team` | Evaluate, score, shortlist, reject, department reports |
| `innovation_committee` | Final approve/reject, approve for publishing, approve for implementation |
| `implementation_owner` | Update implementation status, record benefits, view assignments |
| `admin` | Full system access, user management, configuration, all reports |

- A single user may hold multiple roles (e.g., a Dept Head is both `supervisor` and `dept_innovation_team`). Model roles as an array on the User document, not a single enum.
- Build an `authorize(...roles)` Express middleware and a `useRole()` frontend hook. Every route handler must declare its allowed roles explicitly — no implicit trust.
- RBAC must be enforced at **API level**, not just UI (NFR Security).

---

## 4. DATA MODEL (MongoDB collections — derive schemas from these fields only)

### 4.1 `User`
```
_id, employeeId, name, email, department, designation, grade,
managerId (ref User), roles: [enum: employee|supervisor|dept_innovation_team|
innovation_committee|implementation_owner|admin],
isActive, createdAt, updatedAt
```
(Employee master fields mirror the HRMS sync requirement — Section 13 Integration; for Phase 1 this is a local synced collection, not a live integration.)

### 4.2 `Idea`
```
_id, ideaId (human-readable auto number), title, category, ideaType, department,
initiative, keywords[],
problemStatement, currentChallenges, proposedSolution, innovationDescription,
expectedOutcome,
benefitTypes[]: enum [cost_reduction, time_savings, automation, customer_experience,
  revenue_generation, employee_satisfaction, compliance_improvement, process_optimization],
attachments[]: {fileName, url, type, sizeBytes, uploadedAt},
linkedEventId (ref IdeathonEvent, nullable),
submittedBy (ref User),
status: enum [
  draft, submitted, under_supervisor_review, supervisor_approved, returned,
  supervisor_rejected, under_department_evaluation, shortlisted, rejected_by_dept,
  under_committee_review, approved_for_publishing, approved_for_implementation,
  committee_rejected, published, implementation_initiated, implementation_in_progress,
  implementation_completed, benefits_recorded, outcome_monitored, closed
],
statusHistory[]: {status, actor (ref User), comment, timestamp},
resubmitCount,
isDraftAutoSaved (bool), lastAutoSavedAt,
createdAt, updatedAt
```
Status trail must exactly match the sequence in FRD Section 5.2. Every transition writes to `statusHistory` AND to the global `AuditLog`.

### 4.3 `Evaluation`
```
_id, ideaId (ref Idea), evaluatorId (ref User),
scores[]: {criterion, score (1-10), weight},
weightedTotal (computed), comments, decision: enum [shortlist, reject, escalate],
createdAt
```
Support multiple evaluators per idea; compute average per FR-04-03.

### 4.4 `EvaluationCriteria` (admin-configurable, versioned — Section 8.2)
```
_id, ideathonEventId (nullable = global default), criterionName, weight, scoreRangeMin,
scoreRangeMax, guidance, isActive, version, effectiveFrom, createdBy
```
Default 9 criteria and weights from Section 8.1 must be seeded exactly as listed (Innovation Score 15%, Feasibility 15%, Strategic Alignment 20%, Business Impact 15%, Cost Saving Potential 10%, Revenue Opportunity 10%, Customer Benefit 5%, Implementation Complexity 5%, Risk Assessment 5%). Enforce weights sum to 100% on save.

### 4.5 `IdeathonEvent`
```
_id, eventName, theme, description, eventType: enum [ideathon, workshop, conference,
survey_poll, training, celebration],
initiative, startDate, endDate, targetDepartments[], maxParticipants,
ideaCategory, visibility: enum [published, restricted, draft],
participants[]: (ref User), status: enum [draft, active, closed, extended],
extensionHistory[]: {newEndDate, justification, extendedBy, timestamp},
createdBy, createdAt
```

### 4.6 `Implementation`
```
_id, ideaId (ref Idea), ownerId (ref User), department, startDate,
targetCompletionDate, progressPercent (0-100),
milestones[]: {title, targetDate, status: enum [pending, in_progress, completed, overdue],
completedAt},
createdAt, updatedAt
```

### 4.7 `Benefit`
```
_id, ideaId (ref Idea), implementationId (ref Implementation),
financial: {costSavingsINR, revenueIncreaseINR, evidenceAttachments[]},
operational: {efficiencyImprovementPct, productivityGainPct, description},
strategic: {customerSatisfactionChange, innovationImpactRating (1-10)},
endorsementStatus: enum [pending, endorsed, disputed],
disputeReason, recordedBy, verifiedBy, createdAt
```

### 4.8 `DepartmentTarget`
```
_id, department, financialYear, ideathonEventId (nullable), targetType: enum
[total_ideas, approved_ideas, implemented_ideas], targetValue, createdBy
```

### 4.9 `Announcement`
```
_id, title, richTextBody, expiryDate, isActive, createdBy, createdAt
```

### 4.10 `AuditLog` (immutable, append-only — NFR Audit & Compliance)
```
_id, actorId (ref User), action, entityType, entityId, beforeState, afterState,
ipAddress, timestamp
```

### 4.11 `Notification`
```
_id, recipientId (ref User), triggerEvent, channel: enum [email, in_app, dashboard_alert],
title, body, link, isRead, sentAt
```

### 4.12 `Category` / `Initiative` (master data, admin-managed)
```
_id, name, type: enum [category, subcategory, initiative], parentId (nullable), isActive
```

---

## 5. INNOVATION LIFECYCLE (Section 5 of FRD — implement exactly)

| Stage | Role | Actions | SLA |
|---|---|---|---|
| 1. Idea Creation | Employee | Draft, Submit | Anytime |
| 2. Supervisor Validation | Supervisor | Approve / Reject / Send Back | 3 business days |
| 3. Department Review | Dept Innovation Team | Evaluate, Score, Shortlist, Reject | 5 business days |
| 4. Committee Review | Innovation Committee | Approve for Publishing / Approve for Implementation / Reject / Defer | 7 business days |
| 5. Published | System | Auto on approval | — |
| 6. Implementation | Implementation Owner | Update progress, milestones | Per plan |
| 7. Benefit Realization | Impl. Owner/Finance | Record actual benefits | Post-completion |
| 8. Outcome Tracking & Closure | Committee/Admin | Monitor, close | Ongoing |

- SLA breach must trigger escalation notification to the reviewer's manager (FR-03-06) via a node-cron job that runs at least hourly, checking business-day-aware deadlines (exclude weekends).
- No stage can be skipped except by Admin override (log the override in AuditLog with reason).

---

## 6. FUNCTIONAL MODULES (build in this order — see Section 13 for phasing)

Implement every requirement ID below. Do not compress multiple FR IDs into a single vague feature — each row is a distinct testable behavior.

### FR-01: Home Dashboard
- 9 KPIs: Ideathons Hosted (FY), Associates Who Shared Ideas (FY), Ideas Received (FY), Opportunities Tagged, Implemented Ideas, Benefits Realized, Active Participants, Department Participation Rate, Innovation Index. Refresh within 5 min (use short polling or cache invalidation on write).
- Featured Ideas (min 3, admin-configurable), Success Stories, Announcements (rich text), 4 Quick Actions (Submit Idea, My Ideas, Track Status, Join Ideathon).
- Filters: Financial Year, Department, Ideathon Event.

### FR-02: Idea Submission & Management
- Full form per fields in Section 4.2. Rich-text editor for narrative fields (use a lightweight React rich text lib, e.g. `react-quill`).
- Min 50 chars on Problem Statement; ≥1 benefit type required.
- Attachments: max 5 files, 20MB each, types PDF/DOCX/XLSX/JPG/PNG/PPTX/MP4.
- Auto-save every 2 minutes + on unload (`beforeunload` + periodic `setInterval`); draft recoverable on next login.
- Duplicate detection: simple keyword/title similarity check (e.g., trigram or Levenshtein against existing titles) — warn, don't block.
- Email + in-app confirmation with Idea ID within 1 minute of submission (use a job queue or immediate async call — do not block the HTTP response).

### FR-03: Supervisor Validation Workflow
- Notify supervisor within 5 min of submission.
- Approve / Reject / Send Back — Reject & Send Back require ≥20-char comment (enforce server-side).
- Send Back sets status `returned`, submitter can revise & resubmit; track `resubmitCount`.
- Supervisor dashboard: pending queue with SLA countdown, amber at >66% of SLA elapsed, red when breached.
- Escalation to supervisor's manager on SLA breach.

### FR-04: Department Innovation Review
- Notify Dept Innovation Team when routed.
- Weighted scoring form bound to active `EvaluationCriteria` version.
- Multiple evaluators, compute average; require ≥2 scores before shortlisting.
- Shortlist / Reject / Escalate with mandatory comments.
- Department dashboard: pipeline by status + target achievement.

### FR-05: Innovation Committee Review & Approval
- Notify committee on shortlist (batch supported).
- 360° idea view: details, scores, evaluator comments, full journey history on one screen.
- Actions: Approve for Publishing / Approve for Implementation (assign Implementation Owner via employee lookup) / Reject / Defer for Next Cycle.
- Optional voting module: each member votes, system aggregates, quorum configurable by Admin (mark as SHOULD HAVE — implement after MUST HAVE items).
- Decision + mandatory rationale recorded and visible in idea history.

### FR-06: Idea Publishing & Innovation Gallery
- Auto-publish approved ideas within 15 min.
- Gallery sections: Published Ideas, Innovation Showcase (featured), Top Contributors leaderboard (monthly auto-update), Success Stories.
- Search/filter: keyword, category, department, date range, innovation type — combinable, <2s response.
- Admin unpublish/archive with justification, logged, submitter notified.

### FR-07: Implementation Tracking
- Fields per Section 4.6. Progress slider 0–100%.
- Milestones with target dates and completion tracking; overdue highlighted.
- Auto-reminder 3 days before target completion date (cron).
- Read-only view for Committee/Admin; edit restricted to Owner + Admin.
- At 100% completion, force a Benefits Realization form as the mandatory next step.

### FR-08: Benefit Realization & Outcome Tracking
- Financial: Cost Savings (INR), Revenue Increase (INR); evidence attachment mandatory if amount > ₹1 Lakh.
- Operational: Efficiency Improvement % (0–100), Productivity Gain % (0–100), description ≥50 chars.
- Strategic (SHOULD HAVE): Customer Satisfaction Score change, Innovation Impact rating (1–10).
- Aggregate on org dashboard + Benefits Realization Report, updated within 1 hour.
- Committee can endorse or flag dispute → routes to a Finance reviewer role stub (do not build full Finance workflow, just the routing hook).

### FR-IE (Section 7): Ideathon Event Management
- Create events with all fields in Section 4.5. End date ≥ start date validation.
- Visibility: published / restricted (target departments only) / draft (admin only).
- Join/register from "My Events" or "Explore"; participant count on card.
- Explore filters: Type, Initiative, Business Category (multi-select).
- Leaderboard (SHOULD HAVE) ranked by evaluation score within event, real-time after evaluation phase starts.
- Auto-close submissions at end date (cron); banner shown to late submitters.
- Admin extend deadline with mandatory justification, logged, all participants notified.

### FR-AD (Section 12): Administration Module
- User management: create/edit/deactivate, assign/revoke roles, bulk CSV import.
- Role/permission configuration; default role per designation/grade.
- Event, category, sub-category, initiative management.
- Workflow config: SLA timelines, escalation rules, approval chain, notification triggers per event type.
- Evaluation config: criteria, weights, thresholds (global or per-event).
- Department target setup by FY and event.
- Announcement create/schedule/expire.
- Audit log viewer with filters (user, action type, date range, entity) + export.
- Master data management: departments, designations, grades, initiatives, integration mappings.

---

## 7. REPORTS & ANALYTICS (Section 10 — implement each as a distinct report, role-gated)

Build a generic `ReportRenderer` component + `/api/reports/:reportKey` pattern. All reports support Excel (.xlsx via `exceljs`) and PDF (via `pdfkit` or `puppeteer`) export with date-range filters.

- **Employee**: My Submitted Ideas, My Idea Journey (timeline), My Implementations
- **Supervisor**: Team Ideas Pipeline, Pending Approvals (with SLA countdown), Team Participation Rate
- **Dept Head**: Dept. Innovation Performance, Dept. Target Achievement, Idea Conversion Ratio (funnel)
- **Management**: Org Innovation Dashboard (trend charts), Cost Savings Report, Benefits Realization Report, Innovation Trend Analysis, Top Performing Departments
- **Admin**: Audit Log Report, User Participation Report

---

## 8. NOTIFICATION FRAMEWORK (Section 11 — build exact trigger matrix)

Implement a single `notificationService.trigger(eventKey, payload)` called from business logic (never scatter raw email calls through controllers). Config table below drives channel selection; make it Admin-configurable per user preference where marked.

| Trigger | Recipients | Email | In-App | Dashboard Alert |
|---|---|---|---|---|
| Idea submitted | Submitter | ✓ | ✓ | ✗ |
| Assigned for Supervisor review | Supervisor | ✓ | ✓ | ✓ |
| Approved by Supervisor | Submitter | ✓ | ✓ | ✗ |
| Returned for clarification | Submitter | ✓ | ✓ | ✓ |
| Rejected | Submitter | ✓ | ✓ | ✗ |
| Routed to Dept Evaluation | Dept Team | ✓ | ✓ | ✓ |
| Shortlisted by Dept | Submitter, Committee | ✓ | ✓ | ✗ |
| Approved by Committee | Submitter, Dept Head | ✓ | ✓ | ✗ |
| Published to Gallery | Submitter, Org-wide | ✓ | ✓ | ✗ |
| Implementation assigned | Owner, Submitter | ✓ | ✓ | ✓ |
| Milestone overdue | Owner, Supervisor | ✓ | ✓ | ✓ |
| Implementation completed | Submitter, Committee | ✓ | ✓ | ✗ |
| Supervisor SLA breach | Supervisor, Manager | ✓ | ✓ | ✓ |
| New Ideathon launched | All eligible users | ✓ | ✓ | ✗ |
| Ideathon closing in 48h | Registered participants | ✓ | ✓ | ✓ |

---

## 9. NON-FUNCTIONAL REQUIREMENTS (build these in, don't defer)

- Page load <3s, search/filter <2s response.
- Support 500 concurrent users without degradation — use pagination everywhere (never return unbounded arrays), index MongoDB queries (see Section 10).
- RBAC enforced at API + UI.
- TLS 1.2+ in transit; at-rest encryption is an infra concern — document it in `DEPLOYMENT.md`, don't fake it in code.
- Session timeout 30 min inactivity; secure, httpOnly cookies for refresh token.
- Immutable audit log for all create/update/delete/approval actions.
- WCAG 2.1 AA: semantic HTML, proper labels, keyboard navigation, color contrast — apply throughout the frontend, not as an afterthought.
- Responsive design: desktop, tablet, mobile breakpoints via Tailwind.
- Architect for horizontal scaling: stateless API servers, session/JWT not in-memory, file storage abstracted (not local disk in prod path).

---

## 10. MONGODB INDEXING (minimum required — add more as needed)

- `Idea`: index on `status`, `submittedBy`, `department`, `linkedEventId`; text index on `title`, `keywords` for search/duplicate detection.
- `User`: unique index on `employeeId`, `email`.
- `AuditLog`: index on `entityType + entityId`, `actorId`, `timestamp`.
- `Notification`: index on `recipientId + isRead`.
- `IdeathonEvent`: index on `status`, `startDate`, `endDate`.

---

## 11. INTEGRATION STUBS (Section 13 of FRD — Phase 1 mandatory, build as interfaces even though real systems aren't connected)

- `AuthProvider` interface: local JWT implementation now; documented extension point for AD/SSO (user provisioning fields already on `User` model).
- `HrmsSyncService` interface: a scheduled job stub that would pull employee/department/reporting-structure data; for this build, implement it as a CSV import (FR-AD-01 bulk import) that populates the same shape an HRMS feed would.
- `EmailService` interface: real SMTP via Nodemailer, swappable provider.
- Do NOT build: ERP integration, Teams push, BI export — leave as documented Phase 2 stubs in `INTEGRATIONS.md`.

---

## 12. FOLDER STRUCTURE (scaffold exactly this shape)

```
ideahub/
├── client/
│   ├── src/
│   │   ├── api/            # axios instances + endpoint functions per module
│   │   ├── components/     # shared UI (Button, Table, Modal, RichTextEditor, FileUpload...)
│   │   ├── features/       # one folder per module: ideas/, events/, evaluation/, committee/,
│   │   │                   #   implementation/, benefits/, reports/, admin/, dashboard/, auth/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── routes/         # role-guarded route definitions
│   │   ├── store/          # redux slices
│   │   ├── utils/
│   │   └── App.jsx
│   └── vite.config.js
├── server/
│   ├── config/             # db, env, roles constants
│   ├── models/             # one file per collection in Section 4
│   ├── controllers/        # one per module
│   ├── routes/             # one per module, mounted in server.js
│   ├── middleware/         # auth, authorize(roles), errorHandler, validate, upload
│   ├── services/           # notificationService, auditService, hrmsSyncService,
│   │                       #   emailService, slaService, scoringService
│   ├── jobs/                # cron: slaBreachCheck, milestoneReminder, eventAutoClose,
│   │                       #   leaderboardRefresh
│   ├── seed/                # seed scripts (criteria defaults, roles, demo users)
│   ├── utils/
│   └── server.js
├── shared/                  # constants shared between client/server if using workspaces
│                             #   (status enums, role enums, benefit types) — single source of truth
├── ASSUMPTIONS.md
├── DEPLOYMENT.md
├── INTEGRATIONS.md
└── README.md
```

Keep `shared/constants.js` (status enums, role enums, benefit types, event types) as the **single source of truth**, imported by both client and server, to guarantee frontend/backend never drift on allowed values.

---

## 13. BUILD PLAN — PHASED, VERTICAL SLICES (execute in this order)

**Phase 0 — Foundation**
1. Scaffold folder structure exactly as Section 12.
2. `shared/constants.js` with every enum from Section 4.
3. Mongoose models for all 12 collections in Section 4, with schema validation matching field constraints.
4. Auth: local JWT login/refresh, `User` seed, `authorize()` middleware, `useRole()` hook.
5. Audit log service wired as middleware/hook on all mutating routes from the start (do not retrofit later).

**Phase 1 — Idea Core (FR-01, FR-02)**
6. Idea CRUD, draft auto-save, attachments upload, duplicate-warning check.
7. Home dashboard KPIs (can show zeros until later phases populate data) and Quick Actions.

**Phase 2 — Review Workflow (FR-03, FR-04, FR-05)**
8. Status machine + statusHistory + notifications wired to the trigger matrix (Section 8).
9. Supervisor validation UI + SLA countdown + escalation cron.
10. Evaluation criteria seed + scoring engine + Dept review queue.
11. Committee review screen (360° view) + decision workflow.

**Phase 3 — Events (Section 7)**
12. IdeathonEvent CRUD, visibility rules, join/register, Explore filters, auto-close cron, leaderboard.

**Phase 4 — Publishing & Gallery (FR-06)**
13. Auto-publish on approval, gallery UI with search/filter, admin unpublish/archive.

**Phase 5 — Implementation & Benefits (FR-07, FR-08)**
14. Implementation record, milestones, reminders cron, forced Benefits form on 100% completion, benefits aggregation.

**Phase 6 — Targets, Reports, Admin (Section 9, 10, 12)**
15. Department targets CRUD + achievement tracking.
16. All reports (Section 7 above) with Excel/PDF export.
17. Full Admin module: users, roles, categories, workflow config, audit log viewer, master data.

**Phase 7 — Hardening**
18. Rate limiting, helmet, input sanitization, pagination audit on every list endpoint, WCAG pass, responsive QA, load-test for 500 concurrent users (k6 or Artillery script), test coverage report.

At the end of every phase: produce a status report (files touched, endpoints added, FR IDs completed, FR IDs deferred with reason) before proceeding.

---

## 14. ACCEPTANCE CHECKLIST (Antigravity must self-verify against this before declaring the project done)

- [ ] All 6 roles implemented with server-side RBAC on every route
- [ ] All 12 Section-4 collections created with exact fields
- [ ] Full status lifecycle (Section 5.2) implemented with audit trail
- [ ] Every FR-ID in Section 6 has a corresponding tested endpoint + UI
- [ ] Notification trigger matrix (Section 8) fully wired
- [ ] All reports in Section 7 render + export Excel/PDF
- [ ] SLA cron jobs (breach escalation, milestone reminders, event auto-close, leaderboard refresh) running
- [ ] Evaluation criteria default weights seeded and sum-to-100 validated
- [ ] Duplicate idea detection functioning (warn, not block)
- [ ] Auto-save drafts working (2-min interval + on unload)
- [ ] File upload constraints enforced (5 files, 20MB, allowed types)
- [ ] Pagination on every list endpoint
- [ ] WCAG 2.1 AA basics (labels, contrast, keyboard nav) applied
- [ ] Responsive on desktop/tablet/mobile
- [ ] `ASSUMPTIONS.md`, `DEPLOYMENT.md`, `INTEGRATIONS.md` present and accurate
- [ ] No feature from Section 1 "Out of Scope" was implemented

---

**Begin with Phase 0. After completing each numbered step in Section 13, pause and report status before continuing to the next step.**
