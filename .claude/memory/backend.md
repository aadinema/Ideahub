# Backend — IdeaHub (orientation only)

Last verified: 2026-09-27
Scope note: high-level orientation. For full structure (every route, model field,
import edge, community) query graphify — `graphify explain "<node>"`. This file does
not re-list what graphify tracks; per-endpoint detail lives in api-contract.md.

## Shape
Express 5 + Mongoose 9. Entry `server/server.js`: `connectDB()` (L72) → HTTP server
on `PORT` (L245) → mounts routers (L206–L218) → starts in-process jobs (L89–L99).

## Route domains (mount → route file → controller)
All under `/api`. `protect` is applied at mount for most groups; auth/ideas/dashboard
enforce auth inside their routers.

| Mount | Route file | Controller(s) | Auth at mount |
|---|---|---|---|
| /api/auth | authRoutes.js | authController.js | public |
| /api/ideas | ideaRoutes.js | ideaController.js | in-route |
| /api/dashboard | dashboardRoutes.js | dashboardController.js, ceoDashboardController.js | in-route (CEO routes use authorize(ROLES.CEO)) |
| /api/supervisor | supervisorRoutes.js | supervisorController.js | protect |
| /api/evaluations | evaluationRoutes.js | evaluationController.js | protect |
| /api/committee | committeeRoutes.js | committeeController.js | protect |
| /api/events | eventRoutes.js | eventController.js | protect (admin actions authorize(ADMIN)) |
| /api/gallery | galleryRoutes.js | galleryController.js | protect |
| /api/implementations | implementationRoutes.js | implementationController.js | protect |
| /api/benefits | benefitRoutes.js | benefitController.js | protect |
| /api/reports | reportRoutes.js | reportController.js | protect |
| /api/admin | adminRoutes.js | adminController.js | protect |
| /api/notifications | notificationRoutes.js | notificationController.js | protect |

`protect` proves identity only. Role gates use `authorize(...roles)` — present in
11 route files — or controller-level checks. Object-level authorization gaps are
tracked in known-issues.md / report.md §3.

## Middleware (`server/middleware/`)
- `auth.js` — exports `protect`, `authorize(...roles)`, `optionalAuth` (L122).
- `securityHeaders.js` — Helmet/CSP baseline (specifics: UNVERIFIED — confirm before editing).
- `sanitize.js` — Mongo operator (NoSQL-injection) sanitization.
- `upload.js` — multer + upload constraints (S3 mode references uninstalled deps — report §3).
- `errorHandler.js` — central error → JSON `{success:false,...}`.

## Services (`server/services/`)
- `workflowService.js` — idea status state machine + `TRANSITION_ROLE_MAP` (who may transition where).
- `authorizationService.js` — `canAccessIdea/Implementation/Benefit`, `validateImplementationOwner` (exists + active + `IMPLEMENTATION_OWNER`/ADMIN role, dept-agnostic).
- `auditService.js` — writes `AuditLog` rows.
- `notificationService.js` — `trigger(eventKey, payload)` → email + in-app + dashboard alerts per `NOTIFICATION_MATRIX` (shared/constants.js).
- `emailService.js`, `storageService.js` — email + attachment storage/URLs.

## Models (`server/models/`, 16)
- **Domain:** Idea, Evaluation, EvaluationCriteria, Implementation, Benefit, IdeathonEvent, DepartmentTarget, Announcement, Category.
- **Platform:** User, RefreshToken, Notification, AuditLog, SystemConfig, HolidayCalendar, Counter.
(Field-level detail: query graphify per model.)

## Jobs (`server/jobs/`) — all started in-process from `server/server.js` L89–L99
- `slaBreachCheck.js` (hourly), `eventAutoClose.js` (daily — 48h closing reminders + auto-close),
  `galleryAutoPublish.js` (5 min), `implementationReminder.js` (daily 09:00).
- Scaling caveat: in-process execution + process-local dedup state — see known-issues.md.

## Constants
Server imports canonical `shared/constants.js` (CommonJS `exports.X`). The client uses
a mirrored ESM copy (`client/src/constants.js`). Both must stay in sync — see architecture.md.
