# ASSUMPTIONS.md

This file documents every decision made where the FRD or Master Prompt was ambiguous.
Updated continuously as new assumptions are discovered. Every assumption has a status.

---

## AUTH-001: Financial Year Start
**Status**: ✅ Confirmed by user  
**Decision**: Financial Year starts April 1 (India standard). FY label format: `FY2026-27`.  
**Impact**: `getFYLabel()` and `getFYDateRange()` in `shared/constants.js`; KPI filters; DepartmentTarget.financialYear field.

---

## AUTH-002: Business Day SLA Calculation
**Status**: ✅ Confirmed by user  
**Decision**: Business days = Mon–Fri, excluding public holidays in HolidayCalendar collection.  
HolidayCalendar ships empty (no holidays). Admin adds holidays via Admin → Master Data without redeploy.  
**Impact**: `slaService.js` business-day calculation; SLA cron jobs.

---

## AUTH-003: Innovation Committee Voting → Action Flow
**Status**: ✅ Confirmed by user  
**Decision**:  
- Majority approval → commit page shows: **Approve for Publishing**, **Approve for Implementation**, **Defer**  
- Majority rejection → commit page shows only: **Reject**  
Default quorum: `majority` (>50% of active committee members).  
Configurable via Admin → Workflow Config: `quorumType [majority | fixed_count]` + `quorumValue`.  
**Impact**: Committee review screen, voting aggregation service, SystemConfig.defaultQuorum.

---

## AUTH-004: MongoDB Deployment Target
**Status**: ✅ Acknowledged as infra decision  
**Decision**: Code is deployment-agnostic. `.env.example` documents all three variants (local Docker, Atlas, on-prem replica set). No connection string is hard-coded.  
Atlas recommended for production (500 concurrent users, 7-year retention). Final target is an infra/IT decision above application scope.  
**Impact**: DEPLOYMENT.md; MONGODB_URI env var.

---

## AUTH-005: Refresh Token Reuse Detection
**Status**: ✅ Implemented  
**Decision**: Family-based reuse detection. If a revoked refresh token is presented again, the entire token family is invalidated (all sessions in that chain terminated). Prevents silent token theft.  
**Impact**: RefreshToken model, authController.refresh().

---

## AUTH-006: ideaId Concurrency Safety
**Status**: ✅ Implemented  
**Decision**: Counter collection with atomic `findOneAndUpdate({ $inc: { seq: 1 } }, { new: true, upsert: true })`. Never use `count() + 1`.  
**Impact**: Counter model; Idea.js pre-save hook.

---

## AUTH-007: SMTP / Email for Development
**Status**: ✅ Assumption (pending SMTP credentials from client)  
**Decision**: Nodemailer + Mailtrap for development. Production: Exchange relay or SMTP endpoint via .env swap. `EmailService` is a swappable interface.  
**Impact**: emailService.js; .env.example SMTP vars.

---

## AUTH-008: SSO / Active Directory Integration
**Status**: ✅ Deferred to Phase 2 (per FRD §1.2 Out of Scope)  
**Decision**: Phase 1 uses local JWT. `AuthProvider` is a documented interface. User model fields already include all fields needed by HRMS/AD sync. Extension point documented in INTEGRATIONS.md.  
**Impact**: authController.js; INTEGRATIONS.md.

---

## AUTH-009: File Storage for Attachments
**Status**: ✅ Assumption  
**Decision**: Dev uses local disk (Multer disk storage). Prod uses S3-compatible via `StorageProvider` abstraction. Configured via `STORAGE_PROVIDER` env var. Never use local disk in production.  
**Impact**: middleware/upload.js; StorageProvider service; .env.example.

---

## AUTH-010: Minimum Evaluation Scores Before Shortlisting
**Status**: ✅ Per FRD FR-04-03  
**Decision**: Minimum 2 evaluator scores required before a Dept Innovation Team member can shortlist an idea. Enforced in workflowService.js.  
**Impact**: workflowService.js; evaluationController.js.

---

## TODO: Confirm with FRD
- [ ] FR-05-04 (SHOULD HAVE): Voting module quorum rule for edge case — what happens if the committee has an even number of members and vote is tied? (Assumed: defer action available as tiebreaker)
- [ ] FR-06-02: "Top Contributors leaderboard auto-updates monthly" — does monthly mean 1st of each month, or rolling 30 days? (Assumed: calendar month reset on 1st)
- [ ] FR-AD-08 (SHOULD HAVE): Announcement "schedule" — does this mean a future publish date/time, or just an expiry date? (Assumed: `expiryDate` only; immediate publish on create)
