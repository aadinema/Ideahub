# Graph Report - ideahub  (2026-09-28)

## Corpus Check
- 192 files · ~133,735 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 3, .css 1, .example 1)

## Summary
- 1664 nodes · 2961 edges · 95 communities (87 shown, 8 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 138 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1bcfb5bb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ideaController.js
- reportController.js
- logger.js
- e2e/package.json
- usePageTitle
- src/constants.js
- adminController.js
- client/package.json
- server.js
- dependencies
- authController.js
- evaluationController.js
- a11y.test.jsx
- errorHandler.js
- server/package.json
- dependencies
- CeoDashboardPage.jsx
- dashboardController.js
- event.test.js
- api/index.js
- Idea.js
- committeeController.js
- react
- IdeaFormPage.jsx
- auth.js
- eventController.js
- ref_mongoose
- EventDetailPage.jsx
- benefitController.js
- shared/constants.js
- validators.js
- AdminDashboardPage.jsx
- implementationController.js
- Assumptions
- Audit
- Deployment
- Ideahub Ideathon Frd
- Ideahub Mern Masterprompt
- Integrations
- package.json
- ROLES
- notificationService.js
- E2E Testing Guide
- AppError.js
- IdeaHub Improvement Report
- User.js
- App.jsx
- authorization.test.js
- ideaRoutes.js
- upload.js
- ceoDashboardController.js
- Implementation Plan
- lucide-react
- sanitizeHtml.js
- emailService.js
- Known Issues — IdeaHub
- scripts
- seedCeoDemoIdeas.js
- Phase 3: Auth & Token Handling — Implementation Summary
- Phase 4: Validation & Uploads — Implementation Summary
- validation.test.js
- CEO Dashboard — Implementation Report & UX Assessment
- authorizationService.js
- devDependencies
- Frontend — IdeaHub (orientation only)
- jest
- Graphify
- Graphify
- Index
- API Contract — IdeaHub
- IdeaHub API Contract
- 2026-09-27 — UI / Theme / Workflow audit (session continuation)
- slaBreachCheck.js
- supervisorController.js
- 2. report.md findings — verified state
- GalleryPage.jsx
- Architecture — IdeaHub (orientation only)
- Environment & Configuration — IdeaHub
- getElapsedBusinessDays
- axe.js
- Backend — IdeaHub (orientation only)
- Decisions — IdeaHub
- .claude/memory — IdeaHub Project Memory
- devDependencies
- scripts
- vite.config.js
- storageService.js
- AUDIT_ACTION
- ErrorBoundary
- setup.js
- IdeaHub — Agent Instructions
- IdeaHub Memory
- businessDays.js
- RFC-4122

## God Nodes (most connected - your core abstractions)
1. `lucide-react` - 43 edges
2. `usePageTitle()` - 40 edges
3. `react` - 32 edges
4. `react-router-dom` - 31 edges
5. `ROLES` - 26 edges
6. `@tanstack/react-query` - 25 edges
7. `IDEA_STATUS` - 21 edges
8. `Memory Changelog — IdeaHub` - 19 edges
9. `API Contract — IdeaHub` - 16 edges
10. `ErrorState()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Phase 2 — KI-003 FIXED (client tests wired)` --references--> `App()`  [INFERRED]
  .claude/memory/CHANGELOG.md → client/src/App.jsx
- `KI-012 — App-render tests double-wrapped Router (FIXED)` --references--> `App()`  [INFERRED]
  .claude/memory/known-issues.md → client/src/App.jsx
- `KI-014 — Automated accessibility scoring (was: none) — FIXED` --references--> `KpiCard()`  [INFERRED]
  .claude/memory/known-issues.md → client/src/components/KpiCard.jsx
- `2026-09-27 — UI/UX audit Phase 5 (verification)` --references--> `SkeletonList()`  [INFERRED]
  .claude/memory/CHANGELOG.md → client/src/components/Skeleton.jsx
- `2026-09-27 — UI/UX audit, Phase 3.0 (cross-cutting polish)` --references--> `Toast()`  [INFERRED]
  .claude/memory/CHANGELOG.md → client/src/components/Toast.jsx

## Import Cycles
- None detected.

## Communities (95 total, 8 thin omitted)

### Community 0 - "ideaController.js"
Cohesion: 0.05
Nodes (44): AppError, Idea, { IDEA_STATUS, PAGINATION }, unpublishIdea(), workflowService, AppError, auditService, autoSaveDraft() (+36 more)

### Community 1 - "reportController.js"
Cohesion: 0.12
Nodes (14): exceljs, pdfkit, AppError, auditService, Benefit, DepartmentTarget, ExcelJS, exportReport() (+6 more)

### Community 2 - "logger.js"
Cohesion: 0.06
Nodes (32): winston, connectDB(), logger, mongoose, connectDB, logger, seedCategories, seedCeoDemoIdeas (+24 more)

### Community 3 - "e2e/package.json"
Cohesion: 0.06
Nodes (34): author, dependencies, dotenv, mongoose, description, devDependencies, @playwright/test, @types/node (+26 more)

### Community 4 - "usePageTitle"
Cohesion: 0.12
Nodes (22): 2026-09-27 — UI/UX audit Phase 4 (micro-details), benefitsAPI, evaluationAPI, implementationsAPI, supervisorAPI, EmptyState(), ErrorState(), Modal() (+14 more)

### Community 5 - "src/constants.js"
Cohesion: 0.05
Nodes (41): ALL_BENEFIT_TYPES, ALL_CATEGORY_TYPES, ALL_ENDORSEMENT_STATUSES, ALL_EVALUATION_DECISIONS, ALL_EVENT_STATUSES, ALL_EVENT_TYPES, ALL_EVENT_VISIBILITIES, ALL_IDEA_STATUSES (+33 more)

### Community 6 - "adminController.js"
Cohesion: 0.07
Nodes (21): Announcement, ANNOUNCEMENT_UPDATABLE, AppError, { AUDIT_ACTION, ALL_ROLES }, AuditLog, auditService, Category, createAnnouncement() (+13 more)

### Community 7 - "client/package.json"
Cohesion: 0.10
Nodes (20): author, description, keywords, license, main, name, type, version (+12 more)

### Community 8 - "server.js"
Cohesion: 0.05
Nodes (38): NOTE: This intentionally does NOT HTML-escape string values. Several fields, stripDangerousKeys(), adminRoutes, app, AppError, authLimiter, authRoutes, benefitRoutes (+30 more)

### Community 9 - "dependencies"
Cohesion: 0.08
Nodes (24): dependencies, autoprefixer, axios, @headlessui/react, @heroicons/react, @hookform/resolvers, lucide-react, postcss (+16 more)

### Community 10 - "authController.js"
Cohesion: 0.13
Nodes (19): ref_crypto, uuid, AppError, { AUDIT_ACTION }, auditService, crypto, generateRawRefreshToken(), jwt (+11 more)

### Community 11 - "evaluationController.js"
Cohesion: 0.12
Nodes (16): AppError, Evaluation, EvaluationCriteria, Idea, { IDEA_STATUS, ALL_EVALUATION_DECISIONS, ROLES, NOTIFICATION_EVENT }, notificationService, rejectIdea(), shortlistIdea() (+8 more)

### Community 12 - "a11y.test.jsx"
Cohesion: 0.07
Nodes (30): api, refreshSubscribers, App(), Toast(), TONES, DEMO_USERS, LoginPage(), IdeaDetailPage() (+22 more)

### Community 13 - "errorHandler.js"
Cohesion: 0.40
Nodes (10): AppError, errorHandler(), handleJWTError(), handleJWTExpiredError(), handleMongooseCastError(), handleMongooseDuplicateKeyError(), handleMongooseValidationError(), logger (+2 more)

### Community 14 - "server/package.json"
Cohesion: 0.11
Nodes (18): cookie-parser, cors, express-mongo-sanitize, express-rate-limit, helmet, jest, nodemon, xss-clean (+10 more)

### Community 15 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, bcryptjs, cookie-parser, cors, dotenv, exceljs, express, express-mongo-sanitize (+12 more)

### Community 16 - "CeoDashboardPage.jsx"
Cohesion: 0.06
Nodes (66): 5. Dashboard Panels (component inventory, `client/src/features/ceo/`, ~1,756 lines), 2026-09-27, 2026-09-27 — Phase 3 (Delivery Baseline): CI repaired, 2026-09-27 — UI/UX audit, independent re-audit + P0 regression fixes, 2026-09-27 — UI/UX audit, KI-014 FIXED: real axe-core accessibility gate, 2026-09-27 — UI/UX audit, KI-018 follow-up: component consolidation, 2026-09-27 — UI/UX audit, Phase 2 (design foundation), 2026-09-27 — UI/UX audit, Phase 2 (Design Foundation) (+58 more)

### Community 17 - "dashboardController.js"
Cohesion: 0.15
Nodes (15): Announcement, Benefit, cache, computeKPIs(), DepartmentTarget, getCached(), getDepartmentTargets(), getKPIs() (+7 more)

### Community 18 - "event.test.js"
Cohesion: 0.07
Nodes (34): autoCloseEvents(), cron, { EVENT_STATUS, NOTIFICATION_EVENT }, IdeathonEvent, logger, notificationService, sendClosingReminders(), startJob() (+26 more)

### Community 19 - "api/index.js"
Cohesion: 0.21
Nodes (11): authAPI, dashboardAPI, notificationsAPI, NotificationBell(), NotificationDropdownContent(), timeAgo(), getInitialTheme(), useTheme() (+3 more)

### Community 20 - "Idea.js"
Cohesion: 0.18
Nodes (9): counterSchema, mongoose, {
  ALL_IDEA_STATUSES,
  IDEA_STATUS,
  ALL_BENEFIT_TYPES,
}, attachmentSchema, ideaSchema, mongoose, statusHistorySchema, ALL_BENEFIT_TYPES (+1 more)

### Community 21 - "committeeController.js"
Cohesion: 0.17
Nodes (14): AppError, approvePublishing(), authorizationService, Benefit, deferIdea(), Evaluation, get360View(), Idea (+6 more)

### Community 22 - "react"
Cohesion: 0.23
Nodes (12): committeeAPI, ideasAPI, IdeaStatusBadge(), STATUS_META, RichText(), ACTION_TITLES, Committee360Page(), FeaturedIdeasCarousel() (+4 more)

### Community 23 - "IdeaFormPage.jsx"
Cohesion: 0.24
Nodes (9): ALLOWED_EXTS, BENEFIT_LABELS, BENEFIT_TYPES, DRAFT_FIELDS, emptyForm, IdeaFormPage(), SECTIONS, stripHtml() (+1 more)

### Community 24 - "auth.js"
Cohesion: 0.10
Nodes (22): Conventions, Middleware (`server/middleware/`), { ALL_ROLES }, AppError, authorize(), jwt, optionalAuth(), protect() (+14 more)

### Community 25 - "eventController.js"
Cohesion: 0.14
Nodes (13): AppError, auditService, closeEvent(), Evaluation, {
  EVENT_STATUS,
  EVENT_VISIBILITY,
  AUDIT_ACTION,
  IDEA_STATUS,
  NOTIFICATION_EVENT,
  ROLES,
}, EVENT_UPDATABLE_FIELDS, extendEvent(), getEventById() (+5 more)

### Community 26 - "ref_mongoose"
Cohesion: 0.12
Nodes (11): ref_mongoose, getLeaderboard(), mongoose, mongoose, announcementSchema, mongoose, { AUDIT_ACTION }, auditLogSchema (+3 more)

### Community 27 - "EventDetailPage.jsx"
Cohesion: 0.38
Nodes (5): eventsAPI, EventDetailPage(), fmtDate(), label(), STATUS_STYLE

### Community 28 - "benefitController.js"
Cohesion: 0.18
Nodes (14): KI-004 — Benefit + implementation object-level authz gaps (report.md §3), AppError, auditService, authorizationService, Benefit, buildAttachments(), createBenefit(), endorseBenefit() (+6 more)

### Community 29 - "shared/constants.js"
Cohesion: 0.06
Nodes (36): { ALL_CATEGORY_TYPES }, categorySchema, mongoose, { ALL_TARGET_TYPES }, departmentTargetSchema, mongoose, { ALL_MILESTONE_STATUSES, MILESTONE_STATUS }, implementationSchema (+28 more)

### Community 30 - "validators.js"
Cohesion: 0.07
Nodes (31): adminController, {
  adminUpdateUserSchema,
  handleValidationErrors,
  idParamSchema,
}, { authorize }, express, { ROLES }, router, { authorize }, eventController (+23 more)

### Community 31 - "AdminDashboardPage.jsx"
Cohesion: 0.14
Nodes (12): adminAPI, DEPARTMENTS, emptyEventForm, EVENT_DEPARTMENTS, EVENT_LABEL(), EventsTab(), ROLE_LABEL(), STATUS_BADGE (+4 more)

### Community 32 - "implementationController.js"
Cohesion: 0.20
Nodes (12): Authorization and authentication, AppError, auditService, authorizationService, createImplementation(), getImplementationByIdea(), Idea, { IDEA_STATUS, AUDIT_ACTION, ROLES, NOTIFICATION_EVENT } (+4 more)

### Community 33 - "Assumptions"
Cohesion: 0.18
Nodes (10): AUTH-001: Financial Year Start, AUTH-002: Business Day SLA Calculation, AUTH-003: Innovation Committee Voting → Action Flow, AUTH-004: MongoDB Deployment Target, AUTH-005: Refresh Token Reuse Detection, AUTH-006: ideaId Concurrency Safety, AUTH-007: SMTP / Email for Development, AUTH-008: SSO / Active Directory Integration (+2 more)

### Community 34 - "Audit"
Cohesion: 0.18
Nodes (11): §5 — Idea Lifecycle & Workflow, 🔴 Priority Fix List (highest impact first), Backend Audit, Audit, Executive Summary, FR-02 — Idea Submission, FR-03 — Supervisor Review, FR-04 — Department Review (+3 more)

### Community 35 - "Deployment"
Cohesion: 0.18
Nodes (10): Deployment, docker-compose.yml excerpt:, Edit server/.env with your values, Environment Setup, image: mongo:7, mongo:, MongoDB Connection Options, Option A — Local Docker Compose (Development) (+2 more)

### Community 36 - "Ideahub Ideathon Frd"
Cohesion: 0.18
Nodes (11): 1.1 Scope of This Document, 1.2 Out of Scope, 1. Executive Summary, 2. Business Vision & Objectives, Approvals, Ideahub Ideathon Frd, Document Control & Revision History, Document Information (+3 more)

### Community 37 - "Ideahub Mern Masterprompt"
Cohesion: 0.18
Nodes (11): 0. ROLE & OPERATING RULES, 1. PROJECT SUMMARY, 2. TECH STACK (MERN — exact choices), 3. USER ROLES & RBAC MATRIX (Section 4 of FRD — implement exactly these 6 roles), 4.1 `User`, 4.2 `Idea`, 4.3 `Evaluation`, 4.4 `EvaluationCriteria` (admin-configurable, versioned — Section 8.2) (+3 more)

### Community 38 - "Integrations"
Cohesion: 0.18
Nodes (10): 1. AuthProvider Interface, 2. HrmsSyncService Interface, 3. EmailService Interface, 4. ERP / Finance System Integration, 5. Microsoft Teams / Collaboration Platform, 6. Analytics Platform / BI Export, Data Residency Note, Integrations (+2 more)

### Community 39 - "package.json"
Cohesion: 0.12
Nodes (16): author, description, keywords, license, main, name, scripts, test (+8 more)

### Community 40 - "ROLES"
Cohesion: 0.07
Nodes (26): express, { authorize }, committeeController, express, { ROLES }, router, { authorize }, evaluationController (+18 more)

### Community 41 - "notificationService.js"
Cohesion: 0.06
Nodes (32): node-cron, autoPublishIdeas(), cron, Idea, { IDEA_STATUS, NOTIFICATION_EVENT }, logger, notificationService, startJob() (+24 more)

### Community 42 - "E2E Testing Guide"
Cohesion: 0.05
Nodes (40): CI Integration, Common Issues, Configuration, Debug Mode, Debugging Failed Tests, E2E Testing Guide, Environment Setup, Headed Mode (+32 more)

### Community 43 - "AppError.js"
Cohesion: 0.12
Nodes (12): express-validator, AppError, markAsRead(), Notification, AppError, authController, { body, validationResult }, express (+4 more)

### Community 44 - "IdeaHub Improvement Report"
Cohesion: 0.07
Nodes (29): 1. Codebase Overview, 2. Frontend Analysis, 3. Backend Analysis, 4. Cross-Cutting Concerns, 5. Prioritized Recommendations, API design and conventions, Architecture, Backend structure (+21 more)

### Community 45 - "User.js"
Cohesion: 0.22
Nodes (7): bcryptjs, createEvent(), mongoose, { ALL_ROLES }, bcrypt, mongoose, userSchema

### Community 46 - "App.jsx"
Cohesion: 0.17
Nodes (12): Routes (`client/src/App.jsx`), reportsAPI, ProtectedRoute(), PublicRoute(), NotFoundPage(), COLORS, EXPORT_FORMATS, ReportsPage() (+4 more)

### Community 47 - "authorization.test.js"
Cohesion: 0.07
Nodes (27): jsonwebtoken, supertest, getSuccessStories(), {
  ALL_ENDORSEMENT_STATUSES,
  ENDORSEMENT_STATUS,
}, benefitSchema, evidenceAttachmentSchema, mongoose, app (+19 more)

### Community 48 - "ideaRoutes.js"
Cohesion: 0.22
Nodes (8): express, ideaController, {
  ideaCreateSchema,
  ideaUpdateSchema,
  handleValidationErrors,
  idParamSchema,
  paginationQuery,
}, { protect, authorize }, { ROLES }, router, { uploadAttachments }, ideaCreateSchema

### Community 49 - "upload.js"
Cohesion: 0.09
Nodes (23): ref_aws_sdk_client_s3, multer, ref_multer_s3, AppError, createUploadMiddleware(), fileFilter(), fs, multer (+15 more)

### Community 50 - "ceoDashboardController.js"
Cohesion: 0.09
Nodes (26): AppError, {
  APPROVED_STATUSES,
  IMPLEMENTED_STATUSES,
  ACTIVE_STATUSES,
  REVIEW_STAGES,
  PIPELINE_STAGES,
}, AuditLog, Benefit, bucketKey(), cache, { createCache }, DEFINITIONS (+18 more)

### Community 51 - "Implementation Plan"
Cohesion: 0.29
Nodes (7): 1. Update `index.css`, 2. Node.js Migration Script (`client/scripts/theme-migrate.js`), Convert Frontend to Light Premium Theme, Implementation Plan, Proposed Changes, User Review Required, Verification Plan

### Community 52 - "lucide-react"
Cohesion: 0.17
Nodes (13): KpiCard(), AnnouncementBanner(), DashboardFilters(), DEPARTMENTS, DepartmentProgressSection(), ACTIONS, QuickActionsHub(), SuccessStoriesCarousel() (+5 more)

### Community 53 - "sanitizeHtml.js"
Cohesion: 0.33
Nodes (6): ALLOWED_ATTRS, ALLOWED_TAGS, GLOBAL_ATTRS, NOTE: DOMPurify is the correct tool for this, but it cannot be installed in, sanitizeHtml(), scrubElement()

### Community 54 - "emailService.js"
Cohesion: 0.33
Nodes (6): nodemailer, getTransporter(), logger, nodemailer, send(), TEMPLATES

### Community 55 - "Known Issues — IdeaHub"
Cohesion: 0.08
Nodes (24): Configuration, INF-001 — Intermittent Atlas connectivity, Infrastructure observations, KI-001 — CI pipeline exists but is non-functional / non-gating, KI-002 — Access token in localStorage (report.md §3), KI-003 — Client unit tests wired and passing, KI-006 — Port mismatch (Vite proxy vs server default), KI-007 — S3 storage mode has undeclared dependencies (+16 more)

### Community 56 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, dev, seed, start, test, test:coverage, test:rbac

### Community 57 - "seedCeoDemoIdeas.js"
Cohesion: 0.10
Nodes (20): addDays(), AuditLog, Benefit, Category, CHAINS, d(), EVALS, Evaluation (+12 more)

### Community 58 - "Phase 3: Auth & Token Handling — Implementation Summary"
Cohesion: 0.10
Nodes (19): 1. Token Storage Security (localStorage → in-memory + httpOnly cookie), 2. Account Lockout Protection, 3. Security Headers (CSP and beyond), 4. CLIENT_ORIGIN Fail-Closed Configuration, Changes Made, Client Auth Tests (`client/src/__tests__/auth.test.jsx`), Files Modified, Known Limitations & Future Work (+11 more)

### Community 59 - "Phase 4: Validation & Uploads — Implementation Summary"
Cohesion: 0.11
Nodes (18): 1. Reusable Input Validation Schemas (`server/utils/validators.js`), 2. Safe Filename Handling (`server/utils/safeFilename.js`), 3. S3 Configuration Validation (`server/server.js`), 4. Validation Tests (`server/__tests__/validation.test.js`), Changes Made, Files Modified, For Deployment, For Route Developers (+10 more)

### Community 60 - "validation.test.js"
Cohesion: 0.18
Nodes (15): AppError, { body, validationResult }, {
  ideaCreateSchema,
  ideaUpdateSchema,
  implementationCreateSchema,
  benefitCreateSchema,
  adminUpdateUserSchema,
  handleValidationErrors,
}, {
  sanitizeFilename,
  validateExtensionMatchesMIME,
  validateMagicBytes,
}, AppError, MAGIC_BYTES, MIME_TO_EXT, path (+7 more)

### Community 61 - "CEO Dashboard — Implementation Report & UX Assessment"
Cohesion: 0.12
Nodes (15): 10. Testing, 11. Limitations, 12. Manual Browser Checklist (desktop browser was disconnected from the agent session), 1. Executive Summary, 2. Role Switcher, 3. Backend — Endpoints & Security, 4. KPI Formulas (documented in-code via `DEFINITIONS` and shown in UI tooltips), 6. Responsive Priority Order (mobile) (+7 more)

### Community 62 - "authorizationService.js"
Cohesion: 0.22
Nodes (14): Authorization re-verification (2026-09-27) — against report.md §3, Implementations — `/api/implementations` (protect at mount), Services (`server/services/`), Phase 2 re-run (2026-09-27) — status re-verified, no new code changes, AppError, canAccessBenefit(), canAccessIdea(), canAccessImplementation() (+6 more)

### Community 63 - "devDependencies"
Cohesion: 0.50
Nodes (4): devDependencies, jest, nodemon, supertest

### Community 64 - "Frontend — IdeaHub (orientation only)"
Cohesion: 0.14
Nodes (13): Auth / token handling — report.md §3: VERIFIED FIXED 2026-09-27, Frontend — IdeaHub (orientation only), Key libs, Page titles and motion, Shape, Shared UI state layer (added 2026-09-27, UI/UX audit Phase 2; completed Phase 3), State management — VERIFIED 2026-09-27, Tests — client suite WIRED and passing (KI-003 FIXED 2026-09-27) (+5 more)

### Community 65 - "jest"
Cohesion: 0.40
Nodes (5): jest, maxWorkers, setupFiles, testEnvironment, testMatch

### Community 69 - "API Contract — IdeaHub"
Cohesion: 0.14
Nodes (13): Admin — `/api/admin` (`authorize(ADMIN)`), Notifications — `/api/notifications` (protect), API Contract — IdeaHub, Auth — `/api/auth` (public except /me), Benefits — `/api/benefits` (protect at mount), Committee — `/api/committee` (`authorize(COMM, ADMIN)`), Dashboard — `/api/dashboard` (`router.use(protect)`), Evaluations — `/api/evaluations` (`authorize(DEPT, ADMIN)`), Events — `/api/events` (protect at mount; admin sub-group `authorize(ADMIN)`) (+5 more)

### Community 70 - "IdeaHub API Contract"
Cohesion: 0.15
Nodes (12): Admin-facing, Authentication, Base URLs, Employee-facing, IdeaHub API Contract, Ideathon Events (FR-IE), Observability & Correlation, Pagination (+4 more)

### Community 71 - "2026-09-27 — UI / Theme / Workflow audit (session continuation)"
Cohesion: 0.17
Nodes (11): 2026-09-27 — UI / Theme / Workflow audit (session continuation), Findings / drift, Findings / drift (continued), Findings / drift (Phase 1 close-out, 2026-09-27), Memory files, Memory files (continued), Phase 1 close-out, Phase 2 — C1 + D + item 2 APPLIED (2026-09-27) (+3 more)

### Community 72 - "slaBreachCheck.js"
Cohesion: 0.18
Nodes (11): checkSLABreaches(), cron, { getHolidays, getElapsedBusinessDays }, Idea, { IDEA_STATUS, NOTIFICATION_EVENT }, logger, notificationService, notifiedBreaches (+3 more)

### Community 73 - "supervisorController.js"
Cohesion: 0.24
Nodes (10): AppError, approveIdea(), { getHolidays, getElapsedBusinessDays }, Idea, { IDEA_STATUS, ROLES, NOTIFICATION_EVENT }, notificationService, rejectIdea(), returnIdea() (+2 more)

### Community 74 - "2. report.md findings — verified state"
Cohesion: 0.20
Nodes (9): 1. What Phase 1 produced (on disk at close), 2. report.md findings — verified state, 3. Authority, 4. Consequence for later phases, Corrected / stale (report wrong or superseded), Not yet verified (do not assume either way), Phase 1 Checkpoint — Memory System Build-out, Still open (genuine) (+1 more)

### Community 75 - "GalleryPage.jsx"
Cohesion: 0.29
Nodes (7): galleryAPI, CATEGORIES, GalleryPage(), useDebounce(), IMPORTANT: This is for UI-only conditional rendering., useRole(), ref_shared_constants

### Community 76 - "Architecture — IdeaHub (orientation only)"
Cohesion: 0.22
Nodes (8): Architecture — IdeaHub (orientation only), Deployment topology, Frontend ↔ backend data flow, Repo layout (one line each), Shared constants — TWO mirrored files (important), Stack (versions verified in package.json, 2026-09-27), Structural caveats (detail tracked in known-issues.md), What it is

### Community 77 - "Environment & Configuration — IdeaHub"
Cohesion: 0.22
Nodes (8): Client variables, Config files (non-env), Env files, Env files & git tracking (verified 2026-09-27), Environment & Configuration — IdeaHub, Gaps discovered, ✅ Port mismatch — RESOLVED (2026-09-27), Server variables (name · read at · required?)

### Community 78 - "getElapsedBusinessDays"
Cohesion: 0.47
Nodes (9): computeReviewWaits(), getInsights(), getOverview(), getPipeline(), round1(), getSlaPerformanceReport(), getQueue(), getElapsedBusinessDays() (+1 more)

### Community 79 - "axe.js"
Cohesion: 0.33
Nodes (5): axeViolations(), DISABLED, formatViolations(), expectNoViolations(), axe-core

### Community 80 - "Backend — IdeaHub (orientation only)"
Cohesion: 0.29
Nodes (6): Backend — IdeaHub (orientation only), Constants, Jobs (`server/jobs/`) — all started in-process from `server/server.js` L89–L99, Models (`server/models/`, 16), Route domains (mount → route file → controller), Shape

### Community 81 - "Decisions — IdeaHub"
Cohesion: 0.29
Nodes (6): DEC-001 — Financial Year starts April 1 (label `FY2026-27`), DEC-002 — Business-day SLA excludes weekends and holidays, DEC-003 — Committee voting → available follow-up actions, DEC-004 — Implementation owner eligibility (rule A), Decisions — IdeaHub, Deliberately not recorded here

### Community 82 - ".claude/memory — IdeaHub Project Memory"
Cohesion: 0.29
Nodes (6): .claude/memory — IdeaHub Project Memory, Division of labour inside this folder, How to update, Index, Purpose, Rules

### Community 83 - "devDependencies"
Cohesion: 0.29
Nodes (7): devDependencies, axe-core, jsdom, @testing-library/jest-dom, @testing-library/react, @testing-library/user-event, vitest

### Community 84 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, preview, test, test:coverage, test:watch

### Community 85 - "vite.config.js"
Cohesion: 0.33
Nodes (5): ref_node_path, ref_node_url, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 86 - "storageService.js"
Cohesion: 0.29
Nodes (6): ref_fs, fs, localProvider, logger, path, s3Provider

### Community 87 - "AUDIT_ACTION"
Cohesion: 0.33
Nodes (6): Phase 2 — KI-005 FIXED (implementation owner eligibility), Authorization, KI-005 — Implementation owner eligibility was incomplete, approveImplementation(), getImplementationOwners(), AUDIT_ACTION

### Community 90 - "IdeaHub — Agent Instructions"
Cohesion: 0.50
Nodes (3): Codebase Navigation, IdeaHub — Agent Instructions, Project Memory

### Community 91 - "IdeaHub Memory"
Cohesion: 0.50
Nodes (3): IdeaHub Memory, Instructions, Notes

## Knowledge Gaps
- **919 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+914 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1031 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `2026-09-27 — UI / Theme / Workflow audit (session continuation)` connect `2026-09-27 — UI / Theme / Workflow audit (session continuation)` to `supervisorController.js`, `App.jsx`, `CeoDashboardPage.jsx`, `AUDIT_ACTION`, `eventController.js`, `authorizationService.js`?**
  _High betweenness centrality (0.283) - this node is a cross-community bridge._
- **Why does `AppLayout()` connect `App.jsx` to `GalleryPage.jsx`, `api/index.js`, `lucide-react`, `2026-09-27 — UI / Theme / Workflow audit (session continuation)`?**
  _High betweenness centrality (0.219) - this node is a cross-community bridge._
- **Why does `approveIdea()` connect `supervisorController.js` to `2026-09-27 — UI / Theme / Workflow audit (session continuation)`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `usePageTitle()` (e.g. with `2026-09-27 — UI/UX audit, independent re-audit + P0 regression fixes` and `2026-09-27 — UI/UX audit Phase 4 (micro-details)`) actually correct?**
  _`usePageTitle()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _919 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ideaController.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0512987012987013 - nodes in this community are weakly interconnected._
- **Should `reportController.js` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._