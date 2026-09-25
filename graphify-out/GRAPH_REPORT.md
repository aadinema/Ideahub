# Graph Report - ideahub  (2026-09-23)

## Corpus Check
- Large corpus: 136 files · ~787,448 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1049 nodes · 1748 edges · 74 communities (65 shown, 9 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- mongoose / ideaController.js / AppError
- exceljs / pdfkit / reportController.js
- bcryptjs / winston / db.js
- playwright.config.js / { defineConfig, d
- api/index.js / authAPI / benefitsAPI
- src/constants.js / ALL_BENEFIT_TYPES / A
- adminController.js / addHoliday() / Anno
- client/package.json / author / descripti
- server.js / adminRoutes / app
- dependencies / autoprefixer / axios
- ref_crypto / uuid / authController.js
- evaluationController.js / AppError / Eva
- axios.js / api / onRefreshed()
- notificationController.js / AppError / g
- cookie-parser / cors / express-mongo-san
- dependencies / bcryptjs / cookie-parser
- e2e/package.json / author / dependencies
- dashboardController.js / Announcement / 
- IdeathonEvent.js / {
  ALL_EVENT_TYPES,

- notificationsAPI / NotificationBell.jsx 
- galleryController.js / AppError / getGal
- committeeController.js / AppError / appr
- committeeAPI / Modal.jsx / Modal()
- RichTextEditor.jsx / FORMATS / MODULES
- jsonwebtoken / auth.js / { ALL_ROLES }
- eventController.js / AppError / auditSer
- ref_mongoose / getImpl.js / mongoose
- IdeaStatusBadge.jsx / IdeaStatusBadge() 
- benefitController.js / AppError / auditS
- Category.js / { ALL_CATEGORY_TYPES } / c
- galleryRoutes.js / { authorize } / expre
- adminAPI / AdminDashboardPage.jsx / Admi
- implementationController.js / AppError /
- ASSUMPTIONS.md / AUTH-001: Financial Yea
- §5 — Idea Lifecycle & Workflow / 🔴 Prior
- DEPLOYMENT.md / Deployment / docker-comp
- 1.1 Scope of This Document / 1.2 Out of 
- 0. ROLE & OPERATING RULES / 1. PROJECT S
- 1. AuthProvider Interface / 2. HrmsSyncS
- package.json / author / description
- express / committeeRoutes.js / { authori
- implementationReminder.js / checkImpleme
- galleryAutoPublish.js / autoPublishIdeas
- express-validator / authRoutes.js / AppE
- node-cron / eventAutoClose.js / autoClos
- fixImpl.js / mongoose / Implementation.j
- reportsAPI / ReportsPage.jsx / COLORS
- getSuccessStories() / Benefit.js / {
  A
- uploadAttachments / ideaRoutes.js / expr
- uploadEvidence / benefitRoutes.js / { au
- notificationService.js / emailService / 
- 1. Update `index.css` / 2. Node.js Migra
- dashboardAPI / KpiCard.jsx / KpiCard()
- sanitizeHtml.js / ALLOWED_ATTRS / ALLOWE
- nodemailer / emailService.js / getTransp
- Notification.js / {
  ALL_NOTIFICATION_C
- scripts / dev / seed
- reportRoutes.js / { authorize } / expres
- adminRoutes.js / adminController / { aut
- evaluationRoutes.js / { authorize } / ev
- eventRoutes.js / { authorize } / eventCo
- supervisorRoutes.js / { authorize } / ex
- DepartmentTarget.js / { ALL_TARGET_TYPES
- devDependencies / jest / nodemon
- sanitize.js / NOTE: This intentionally d
- jest / testEnvironment / testMatch
- Graphify / graphify
- Graphify / Workflow: graphify
- Index
- 1786213505493-wallhaven-7jlgjo_2940x1912
- 1789320923963-ChatGPT_Image_Nov_9__2025_
- 1789323369553-ChatGPT_Image_Nov_9__2025_
- 1789393862027-ChatGPT_Image_Nov_9__2025_
- 1789395153768-ChatGPT_Image_Nov_9__2025_

## God Nodes (most connected - your core abstractions)
1. `react` - 23 edges
2. `lucide-react` - 22 edges
3. `ROLES` - 21 edges
4. `react-router-dom` - 20 edges
5. `@tanstack/react-query` - 19 edges
6. `IDEA_STATUS` - 16 edges
7. `express` - 15 edges
8. `authorize()` - 12 edges
9. `transition()` - 11 edges
10. `NOTIFICATION_EVENT` - 11 edges

## Surprising Connections (you probably didn't know these)
- `getHolidays()` --calls--> `getFYLabel()`  [EXTRACTED]
  server/utils/businessDays.js → shared/constants.js
- `DashboardPage()` --indirect_call--> `selectCurrentUser()`  [INFERRED]
  client/src/features/dashboard/DashboardPage.jsx → client/src/store/authSlice.js
- `computeKPIs()` --calls--> `getFYDateRange()`  [EXTRACTED]
  server/controllers/dashboardController.js → shared/constants.js
- `getKPIs()` --calls--> `getFYLabel()`  [EXTRACTED]
  server/controllers/dashboardController.js → shared/constants.js
- `getDepartmentTargets()` --calls--> `getFYDateRange()`  [EXTRACTED]
  server/controllers/dashboardController.js → shared/constants.js

## Import Cycles
- None detected.

## Communities (74 total, 9 thin omitted)

### Community 0 - "mongoose / ideaController.js / AppError"
Cohesion: 0.06
Nodes (38): AppError, auditService, autoSaveDraft(), buildAttachments(), createIdea(), deleteIdea(), getIdeaById(), Idea (+30 more)

### Community 1 - "exceljs / pdfkit / reportController.js"
Cohesion: 0.06
Nodes (41): exceljs, pdfkit, AppError, auditService, Benefit, DepartmentTarget, ExcelJS, exportReport() (+33 more)

### Community 2 - "bcryptjs / winston / db.js"
Cohesion: 0.06
Nodes (36): bcryptjs, winston, connectDB(), logger, mongoose, createEvent(), { ALL_ROLES }, bcrypt (+28 more)

### Community 3 - "playwright.config.js / { defineConfig, d"
Cohesion: 0.08
Nodes (26): { defineConfig, devices }, e2e_tests_fixtures_auth_fixture_expect, login(), SEED_USERS, test, ref_aws_sdk_client_s3, ref_dotenv, ref_fs (+18 more)

### Community 4 - "api/index.js / authAPI / benefitsAPI"
Cohesion: 0.12
Nodes (27): authAPI, benefitsAPI, evaluationAPI, eventsAPI, galleryAPI, ideasAPI, implementationsAPI, supervisorAPI (+19 more)

### Community 5 - "src/constants.js / ALL_BENEFIT_TYPES / A"
Cohesion: 0.06
Nodes (36): ALL_BENEFIT_TYPES, ALL_CATEGORY_TYPES, ALL_ENDORSEMENT_STATUSES, ALL_EVALUATION_DECISIONS, ALL_EVENT_STATUSES, ALL_EVENT_TYPES, ALL_EVENT_VISIBILITIES, ALL_IDEA_STATUSES (+28 more)

### Community 6 - "adminController.js / addHoliday() / Anno"
Cohesion: 0.07
Nodes (23): Announcement, ANNOUNCEMENT_UPDATABLE, AppError, { AUDIT_ACTION, ALL_ROLES }, AuditLog, auditService, Category, createAnnouncement() (+15 more)

### Community 7 - "client/package.json / author / descripti"
Cohesion: 0.06
Nodes (34): author, description, devDependencies, @testing-library/jest-dom, @testing-library/react, @testing-library/user-event, vitest, keywords (+26 more)

### Community 8 - "server.js / adminRoutes / app"
Cohesion: 0.06
Nodes (32): adminRoutes, app, AppError, authLimiter, authRoutes, benefitRoutes, committeeRoutes, connectDB (+24 more)

### Community 9 - "dependencies / autoprefixer / axios"
Cohesion: 0.08
Nodes (24): dependencies, autoprefixer, axios, @headlessui/react, @heroicons/react, @hookform/resolvers, lucide-react, postcss (+16 more)

### Community 10 - "ref_crypto / uuid / authController.js"
Cohesion: 0.13
Nodes (19): ref_crypto, uuid, AppError, { AUDIT_ACTION }, auditService, crypto, generateRawRefreshToken(), jwt (+11 more)

### Community 11 - "evaluationController.js / AppError / Eva"
Cohesion: 0.10
Nodes (18): AppError, Evaluation, EvaluationCriteria, Idea, { IDEA_STATUS, ALL_EVALUATION_DECISIONS, ROLES, NOTIFICATION_EVENT }, notificationService, rejectIdea(), shortlistIdea() (+10 more)

### Community 12 - "axios.js / api / onRefreshed()"
Cohesion: 0.12
Nodes (15): api, refreshSubscribers, App(), client_src_index, queryClient, authSlice, client_src_store_authslice_clearcredentials, initialState (+7 more)

### Community 13 - "notificationController.js / AppError / g"
Cohesion: 0.16
Nodes (14): AppError, markAsRead(), Notification, AppError, errorHandler(), handleJWTError(), handleJWTExpiredError(), handleMongooseCastError() (+6 more)

### Community 14 - "cookie-parser / cors / express-mongo-san"
Cohesion: 0.10
Nodes (19): cookie-parser, cors, express-mongo-sanitize, express-rate-limit, helmet, jest, nodemon, supertest (+11 more)

### Community 15 - "dependencies / bcryptjs / cookie-parser"
Cohesion: 0.10
Nodes (20): dependencies, bcryptjs, cookie-parser, cors, dotenv, exceljs, express, express-mongo-sanitize (+12 more)

### Community 16 - "e2e/package.json / author / dependencies"
Cohesion: 0.11
Nodes (18): author, dependencies, dotenv, mongoose, description, devDependencies, @playwright/test, @types/node (+10 more)

### Community 17 - "dashboardController.js / Announcement / "
Cohesion: 0.15
Nodes (15): Announcement, Benefit, cache, computeKPIs(), DepartmentTarget, getCached(), getDepartmentTargets(), getKPIs() (+7 more)

### Community 18 - "IdeathonEvent.js / {
  ALL_EVENT_TYPES,
"
Cohesion: 0.13
Nodes (16): {
  ALL_EVENT_TYPES,
  ALL_EVENT_VISIBILITIES,
  ALL_EVENT_STATUSES,
  EVENT_STATUS,
  EVENT_VISIBILITY,
}, extensionHistorySchema, ideathonEventSchema, mongoose, mongoose, { SLA_BUSINESS_DAYS }, systemConfigSchema, ALL_EVENT_STATUSES (+8 more)

### Community 19 - "notificationsAPI / NotificationBell.jsx "
Cohesion: 0.20
Nodes (13): notificationsAPI, NotificationBell(), timeAgo(), IdeaDetailPage(), IMPORTANT: This is for UI-only conditional rendering., ROLES, useRole(), getInitialTheme() (+5 more)

### Community 20 - "galleryController.js / AppError / getGal"
Cohesion: 0.12
Nodes (14): AppError, Idea, { IDEA_STATUS, PAGINATION }, unpublishIdea(), workflowService, {
  ALL_IDEA_STATUSES,
  IDEA_STATUS,
  ALL_BENEFIT_TYPES,
}, attachmentSchema, ideaSchema (+6 more)

### Community 21 - "committeeController.js / AppError / appr"
Cohesion: 0.17
Nodes (14): AppError, approveImplementation(), approvePublishing(), Benefit, deferIdea(), Evaluation, get360View(), Idea (+6 more)

### Community 22 - "committeeAPI / Modal.jsx / Modal()"
Cohesion: 0.24
Nodes (10): committeeAPI, Modal(), RichText(), ACTION_TITLES, Committee360Page(), CATEGORIES, GalleryPage(), useDebounce() (+2 more)

### Community 23 - "RichTextEditor.jsx / FORMATS / MODULES"
Cohesion: 0.16
Nodes (13): FORMATS, MODULES, RichTextEditor(), ALLOWED_EXTS, BENEFIT_LABELS, BENEFIT_TYPES, DRAFT_FIELDS, emptyForm (+5 more)

### Community 24 - "jsonwebtoken / auth.js / { ALL_ROLES }"
Cohesion: 0.16
Nodes (12): jsonwebtoken, { ALL_ROLES }, AppError, authorize(), jwt, protect(), User, dashboardController (+4 more)

### Community 25 - "eventController.js / AppError / auditSer"
Cohesion: 0.17
Nodes (12): AppError, auditService, Evaluation, {
  EVENT_STATUS,
  EVENT_VISIBILITY,
  AUDIT_ACTION,
  IDEA_STATUS,
  NOTIFICATION_EVENT,
  ROLES,
}, EVENT_UPDATABLE_FIELDS, extendEvent(), getEventById(), Idea (+4 more)

### Community 26 - "ref_mongoose / getImpl.js / mongoose"
Cohesion: 0.14
Nodes (9): ref_mongoose, mongoose, mongoose, announcementSchema, mongoose, counterSchema, mongoose, holidayCalendarSchema (+1 more)

### Community 27 - "IdeaStatusBadge.jsx / IdeaStatusBadge() "
Cohesion: 0.22
Nodes (9): IdeaStatusBadge(), STATUS_META, EventDetailPage(), fmtDate(), label(), STATUS_STYLE, IdeaListPage(), STATUSES (+1 more)

### Community 28 - "benefitController.js / AppError / auditS"
Cohesion: 0.21
Nodes (12): AppError, auditService, Benefit, buildAttachments(), createBenefit(), endorseBenefit(), { ENDORSEMENT_STATUS, AUDIT_ACTION, ROLES, IDEA_STATUS }, getBenefitByIdea() (+4 more)

### Community 29 - "Category.js / { ALL_CATEGORY_TYPES } / c"
Cohesion: 0.15
Nodes (10): { ALL_CATEGORY_TYPES }, categorySchema, mongoose, Category, Idea, { IDEA_STATUS, BENEFIT_TYPE }, logger, User (+2 more)

### Community 30 - "galleryRoutes.js / { authorize } / expre"
Cohesion: 0.15
Nodes (11): { authorize }, express, galleryController, { ROLES }, router, { authorize }, express, implementationController (+3 more)

### Community 31 - "adminAPI / AdminDashboardPage.jsx / Admi"
Cohesion: 0.18
Nodes (7): adminAPI, AdminDashboardPage(), DEPARTMENTS, ROLE_LABEL(), TABS, TARGET_TYPE_LABEL, UsersTab()

### Community 32 - "implementationController.js / AppError /"
Cohesion: 0.21
Nodes (10): AppError, auditService, createImplementation(), getImplementationByIdea(), Idea, { IDEA_STATUS, AUDIT_ACTION, ROLES, NOTIFICATION_EVENT }, Implementation, notificationService (+2 more)

### Community 33 - "ASSUMPTIONS.md / AUTH-001: Financial Yea"
Cohesion: 0.18
Nodes (10): AUTH-001: Financial Year Start, AUTH-002: Business Day SLA Calculation, AUTH-003: Innovation Committee Voting → Action Flow, AUTH-004: MongoDB Deployment Target, AUTH-005: Refresh Token Reuse Detection, AUTH-006: ideaId Concurrency Safety, AUTH-007: SMTP / Email for Development, AUTH-008: SSO / Active Directory Integration (+2 more)

### Community 34 - "§5 — Idea Lifecycle & Workflow / 🔴 Prior"
Cohesion: 0.18
Nodes (11): §5 — Idea Lifecycle & Workflow, 🔴 Priority Fix List (highest impact first), Backend Audit, Audit, Executive Summary, FR-02 — Idea Submission, FR-03 — Supervisor Review, FR-04 — Department Review (+3 more)

### Community 35 - "DEPLOYMENT.md / Deployment / docker-comp"
Cohesion: 0.18
Nodes (10): Deployment, docker-compose.yml excerpt:, Edit server/.env with your values, Environment Setup, image: mongo:7, mongo:, MongoDB Connection Options, Option A — Local Docker Compose (Development) (+2 more)

### Community 36 - "1.1 Scope of This Document / 1.2 Out of "
Cohesion: 0.18
Nodes (11): 1.1 Scope of This Document, 1.2 Out of Scope, 1. Executive Summary, 2. Business Vision & Objectives, Approvals, Ideahub Ideathon Frd, Document Control & Revision History, Document Information (+3 more)

### Community 37 - "0. ROLE & OPERATING RULES / 1. PROJECT S"
Cohesion: 0.18
Nodes (11): 0. ROLE & OPERATING RULES, 1. PROJECT SUMMARY, 2. TECH STACK (MERN — exact choices), 3. USER ROLES & RBAC MATRIX (Section 4 of FRD — implement exactly these 6 roles), 4.1 `User`, 4.2 `Idea`, 4.3 `Evaluation`, 4.4 `EvaluationCriteria` (admin-configurable, versioned — Section 8.2) (+3 more)

### Community 38 - "1. AuthProvider Interface / 2. HrmsSyncS"
Cohesion: 0.18
Nodes (10): 1. AuthProvider Interface, 2. HrmsSyncService Interface, 3. EmailService Interface, 4. ERP / Finance System Integration, 5. Microsoft Teams / Collaboration Platform, 6. Analytics Platform / BI Export, Data Residency Note, Integrations (+2 more)

### Community 39 - "package.json / author / description"
Cohesion: 0.18
Nodes (10): author, description, keywords, license, main, name, scripts, test (+2 more)

### Community 40 - "express / committeeRoutes.js / { authori"
Cohesion: 0.18
Nodes (9): express, { authorize }, committeeController, express, { ROLES }, router, express, notificationController (+1 more)

### Community 41 - "implementationReminder.js / checkImpleme"
Cohesion: 0.20
Nodes (10): checkImplementationReminders(), cron, Idea, Implementation, logger, { NOTIFICATION_EVENT }, notificationService, startJob() (+2 more)

### Community 42 - "galleryAutoPublish.js / autoPublishIdeas"
Cohesion: 0.22
Nodes (9): autoPublishIdeas(), cron, Idea, { IDEA_STATUS, NOTIFICATION_EVENT }, logger, notificationService, startJob(), User (+1 more)

### Community 43 - "express-validator / authRoutes.js / AppE"
Cohesion: 0.25
Nodes (8): express-validator, AppError, authController, { body, validationResult }, express, { protect }, router, validate()

### Community 44 - "node-cron / eventAutoClose.js / autoClos"
Cohesion: 0.25
Nodes (8): node-cron, autoCloseEvents(), cron, { EVENT_STATUS }, IdeathonEvent, logger, startJob(), EVENT_STATUS

### Community 45 - "fixImpl.js / mongoose / Implementation.j"
Cohesion: 0.22
Nodes (7): mongoose, { ALL_MILESTONE_STATUSES, MILESTONE_STATUS }, implementationSchema, milestoneSchema, mongoose, ALL_MILESTONE_STATUSES, MILESTONE_STATUS

### Community 46 - "reportsAPI / ReportsPage.jsx / COLORS"
Cohesion: 0.25
Nodes (7): reportsAPI, COLORS, EXPORT_FORMATS, ReportsPage(), TARGET_TYPE_LABEL, TOOLTIP_STYLE, recharts

### Community 47 - "getSuccessStories() / Benefit.js / {
  A"
Cohesion: 0.25
Nodes (7): getSuccessStories(), {
  ALL_ENDORSEMENT_STATUSES,
  ENDORSEMENT_STATUS,
}, benefitSchema, evidenceAttachmentSchema, mongoose, ALL_ENDORSEMENT_STATUSES, ENDORSEMENT_STATUS

### Community 48 - "uploadAttachments / ideaRoutes.js / expr"
Cohesion: 0.25
Nodes (7): uploadAttachments, express, ideaController, { protect, authorize }, { ROLES }, router, { uploadAttachments }

### Community 49 - "uploadEvidence / benefitRoutes.js / { au"
Cohesion: 0.25
Nodes (7): uploadEvidence, { authorize }, benefitController, express, { ROLES }, router, { uploadEvidence }

### Community 50 - "notificationService.js / emailService / "
Cohesion: 0.25
Nodes (6): emailService, logger, Notification, {
  NOTIFICATION_EVENT,
  NOTIFICATION_MATRIX,
  NOTIFICATION_CHANNEL,
}, resolvers, NOTIFICATION_MATRIX

### Community 51 - "1. Update `index.css` / 2. Node.js Migra"
Cohesion: 0.29
Nodes (7): 1. Update `index.css`, 2. Node.js Migration Script (`client/scripts/theme-migrate.js`), Convert Frontend to Light Premium Theme, Implementation Plan, Proposed Changes, User Review Required, Verification Plan

### Community 52 - "dashboardAPI / KpiCard.jsx / KpiCard()"
Cohesion: 0.38
Nodes (5): dashboardAPI, KpiCard(), DashboardPage(), formatValue(), KPI_ICONS

### Community 53 - "sanitizeHtml.js / ALLOWED_ATTRS / ALLOWE"
Cohesion: 0.33
Nodes (6): ALLOWED_ATTRS, ALLOWED_TAGS, GLOBAL_ATTRS, NOTE: DOMPurify is the correct tool for this, but it cannot be installed in, sanitizeHtml(), scrubElement()

### Community 54 - "nodemailer / emailService.js / getTransp"
Cohesion: 0.33
Nodes (6): nodemailer, getTransporter(), logger, nodemailer, send(), TEMPLATES

### Community 55 - "Notification.js / {
  ALL_NOTIFICATION_C"
Cohesion: 0.29
Nodes (6): {
  ALL_NOTIFICATION_CHANNELS,
  ALL_NOTIFICATION_EVENTS: _events, // not needed on schema, used in service
  NOTIFICATION_CHANNEL,
}, mongoose, notificationSchema, ALL_NOTIFICATION_CHANNELS, shared_constants_all_notification_events, NOTIFICATION_CHANNEL

### Community 56 - "scripts / dev / seed"
Cohesion: 0.29
Nodes (7): scripts, dev, seed, start, test, test:coverage, test:rbac

### Community 57 - "reportRoutes.js / { authorize } / expres"
Cohesion: 0.29
Nodes (6): { authorize }, express, reportController, reportViewers, { ROLES }, router

### Community 58 - "adminRoutes.js / adminController / { aut"
Cohesion: 0.33
Nodes (5): adminController, { authorize }, express, { ROLES }, router

### Community 59 - "evaluationRoutes.js / { authorize } / ev"
Cohesion: 0.33
Nodes (5): { authorize }, evaluationController, express, { ROLES }, router

### Community 60 - "eventRoutes.js / { authorize } / eventCo"
Cohesion: 0.33
Nodes (5): { authorize }, eventController, express, { ROLES }, router

### Community 61 - "supervisorRoutes.js / { authorize } / ex"
Cohesion: 0.33
Nodes (5): { authorize }, express, { ROLES }, router, supervisorController

### Community 62 - "DepartmentTarget.js / { ALL_TARGET_TYPES"
Cohesion: 0.40
Nodes (4): { ALL_TARGET_TYPES }, departmentTargetSchema, mongoose, ALL_TARGET_TYPES

### Community 63 - "devDependencies / jest / nodemon"
Cohesion: 0.50
Nodes (4): devDependencies, jest, nodemon, supertest

### Community 65 - "jest / testEnvironment / testMatch"
Cohesion: 0.67
Nodes (3): jest, testEnvironment, testMatch

## Knowledge Gaps
- **596 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+591 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 664 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `express` connect `express / committeeRoutes.js / { authori` to `server.js / adminRoutes / app`, `express-validator / authRoutes.js / AppE`, `cookie-parser / cors / express-mongo-san`, `uploadAttachments / ideaRoutes.js / expr`, `uploadEvidence / benefitRoutes.js / { au`, `jsonwebtoken / auth.js / { ALL_ROLES }`, `reportRoutes.js / { authorize } / expres`, `adminRoutes.js / adminController / { aut`, `evaluationRoutes.js / { authorize } / ev`, `eventRoutes.js / { authorize } / eventCo`, `supervisorRoutes.js / { authorize } / ex`, `galleryRoutes.js / { authorize } / expre`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies / bcryptjs / cookie-parser` to `cookie-parser / cors / express-mongo-san`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `@playwright/test` connect `playwright.config.js / { defineConfig, d` to `e2e/package.json / author / dependencies`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _596 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `mongoose / ideaController.js / AppError` be split into smaller, more focused modules?**
  _Cohesion score 0.06290471785383904 - nodes in this community are weakly interconnected._
- **Should `exceljs / pdfkit / reportController.js` be split into smaller, more focused modules?**
  _Cohesion score 0.058279370952821465 - nodes in this community are weakly interconnected._
- **Should `bcryptjs / winston / db.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05603864734299517 - nodes in this community are weakly interconnected._