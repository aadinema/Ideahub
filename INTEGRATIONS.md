# INTEGRATIONS.md

## Phase 1 — Implemented (Stubs)

### 1. AuthProvider Interface
**Location**: `server/controllers/authController.js`  
**Current**: Local JWT with bcrypt. Access token (15 min) + refresh token (7 days, httpOnly cookie, family rotation).  
**Extension point for AD/SSO/OIDC**:
- Replace `authController.login()` with your IdP's OIDC callback handler.
- The `User` model already contains all fields HRMS/AD would sync: `employeeId`, `name`, `email`, `department`, `designation`, `grade`, `managerId`.
- The `authorize()` middleware reads `req.user.roles` — roles must be provisioned on the User document regardless of auth provider.
- Stub location: add `server/services/ssoService.js` implementing `verifyIdToken(token) → UserProfile`.

### 2. HrmsSyncService Interface
**Location**: `server/services/hrmsSyncService.js` (Phase 1: CSV import)  
**Current**: Bulk CSV import via `POST /api/admin/users/bulk-import` (FR-AD-01) populates the same User document shape that a live HRMS feed would produce.  
**Extension point**:
- Replace CSV logic in `hrmsSyncService.js` with a scheduled pull from the HRMS API endpoint.
- Expected HRMS response fields: `{ employeeId, name, email, department, designation, grade, managerEmployeeId }`.
- The `node-cron` job already exists — swap the data source, not the job structure.

### 3. EmailService Interface
**Location**: `server/services/emailService.js`  
**Current**: Nodemailer + SMTP (configurable via `.env`). Mailtrap for dev, Exchange relay for prod.  
**Extension point**: Replace SMTP transport with Exchange Graph API, SendGrid, or AWS SES. The `send({ to, subject, html, text })` interface is stable.

---

## Phase 2 — Planned Integrations

### 4. ERP / Finance System Integration
**Purpose**: Validate cost savings claims against ERP General Ledger and cost center data (FRD §13).  
**Stub**: `Benefit.routedToFinanceAt` field and `benefitController.dispute()` route exist as routing hooks.  
**When implementing**: Add `server/services/erpService.js` with `validateCostSaving(glCode, amount) → boolean`.

### 5. Microsoft Teams / Collaboration Platform
**Purpose**: Push workflow notifications to Teams channels (FRD §13).  
**Stub**: `notificationService.trigger()` already accepts a channel list. Add `teams` to `NOTIFICATION_CHANNEL` enum and implement `server/services/teamsService.js` with the MS Graph webhook call.

### 6. Analytics Platform / BI Export
**Purpose**: Export aggregated idea and benefit datasets to Power BI or Tableau (FRD §13).  
**Stub**: All report endpoints (`/api/reports/:reportKey`) already return JSON + Excel/PDF. Add a `/api/reports/:reportKey/export?format=csv` route for BI ingestion without changing the aggregation pipeline.

---

## Data Residency Note
All data must remain within India (FRD §16.3). When deploying to cloud:
- MongoDB Atlas: select `ap-south-1` (Mumbai) region.
- S3 / file storage: use `ap-south-1` bucket.
- SMTP/email relay: confirm data residency with email provider.
