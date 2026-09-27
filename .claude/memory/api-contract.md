# API Contract — IdeaHub

Last verified: 2026-09-27
Generated from: `server/routes/*.js` + `server/controllers/*.js` (read directly).
Conventions/error-shape background: repo `API_CONTRACT.md`.
Legend for roles: EMP employee · SUP supervisor · DEPT dept_innovation_team ·
COMM innovation_committee · OWN implementation_owner · ADMIN · CEO.

## Conventions
- Base path: `/api`. **No `/api/v1`** yet (report §3 — versioning pending).
- Auth: Bearer JWT via `protect`. Public: `POST /api/auth/login`, `POST /api/auth/refresh`.
- `protect` = identity only; authorization is role (`authorize(...)`) and/or
  object-level (`authorizationService.canAccess*`).
- Success envelope: `{ success: true, data, ... }`. Errors via `errorHandler.js`:
  `{ success: false, message, requestId, errors? }`.
- Pagination: `?page=&limit=` (`paginationQuery`).
- Rate limits (`server.js` L150–L167): global 500/15 min on `/api`; auth 20/15 min
  failed-only on `/api/auth/login`.
- Validation: `express-validator` schemas (422 with field errors). Coverage varies by
  route — see report §3 (Phase 5 completes it).

## Auth — `/api/auth` (public except /me)
| Method | Path | Auth | Body / notes |
|---|---|---|---|
| POST | /login | public | `email`, `password` → accessToken+user; sets httpOnly refresh cookie |
| POST | /refresh | cookie | rotates refresh token; family-based reuse detection |
| POST | /logout | cookie | revokes refresh family, clears cookie |
| GET | /me | protect | current user |

## Ideas — `/api/ideas` (`router.use(protect)`)
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | /duplicate-check | any auth | title similarity check |
| GET | /my | any auth | own ideas |
| GET | / | any auth | role-filtered in controller; paginated |
| POST | / | EMP,SUP,DEPT,COMM,ADMIN | create (multipart attachments); **CEO excluded** |
| GET | /:id | any auth | role-aware visibility in controller |
| PATCH | /:id/draft | any auth | auto-save draft (controller: own draft) |
| POST | /:id/submit | any auth | submit draft/returned (controller: own) |
| POST | /:id/publish | ADMIN | publish to gallery |
| DELETE | /:id | any auth | own draft only (admin any) |

## Dashboard — `/api/dashboard` (`router.use(protect)`)
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | /kpis, /featured-ideas, /success-stories, /announcements, /department-targets | any auth | employee dashboard |
| GET | /ceo/overview, /ceo/trends, /ceo/pipeline, /ceo/insights | **CEO** (`authorize(ROLES.CEO)`) | aggregated; 5-min per-key cache |

## Supervisor — `/api/supervisor` (`authorize(SUP, ADMIN)`)
| Method | Path | Notes |
|---|---|---|
| GET | /queue | supervisor queue |
| POST | /ideas/:id/approve, /reject, /return | transitions own-team ideas |

## Evaluations — `/api/evaluations` (`authorize(DEPT, ADMIN)`)
| Method | Path | Notes |
|---|---|---|
| GET | /criteria | active criteria |
| POST | / | submit evaluation |
| GET | /idea/:ideaId | evaluations for idea |
| POST | /ideas/:id/shortlist, /reject-dept | dept decisions |

## Committee — `/api/committee` (`authorize(COMM, ADMIN)`)
| Method | Path | Notes |
|---|---|---|
| GET | /implementation-owners | eligible owners |
| GET | /ideas/:id/360-view | 360 view |
| POST | /ideas/:id/approve-publishing, /approve-implementation, /committee-reject, /defer | committee decisions (approve-implementation validates the owner — see A3) |

## Events — `/api/events` (protect at mount; admin sub-group `authorize(ADMIN)`)
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | /explore | any auth | published + targeted-restricted; **excludes drafts**; comma-separated `type`/`initiative`/`category` |
| GET | /mine | any auth | My Events |
| GET | /facets | any auth | distinct initiatives/categories |
| POST | /:id/join | any auth | idempotent; join-confirmation notification |
| GET | /:id/leaderboard | any auth | ideas ranked by avg evaluation |
| GET | /:id | any auth | 403 for drafts / out-of-dept restricted |
| GET | / | ADMIN | all incl. drafts |
| POST | / | ADMIN | create (FR-IE-01) |
| PATCH | /:id | ADMIN | update (FR-IE-01/02) |
| POST | /:id/extend | ADMIN | ≥20-char justification; notifies participants (FR-IE-07) |
| POST | /:id/close | ADMIN | close |

## Gallery — `/api/gallery` (protect at mount)
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | /, /top-contributors | any auth | published gallery |
| POST | /:id/unpublish | ADMIN | remove from gallery |

## Implementations — `/api/implementations` (protect at mount)
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | /my | any auth | own implementations (owner = caller) |
| GET | /ideas/:ideaId | any auth + **object check** | see Authz note A2 |
| POST | / | ADMIN, COMM | create; owner validated (see A3) |
| PATCH | /:id | any auth + controller check | owner or admin only |

> Committee `POST /api/committee/ideas/:id/approve-implementation` also assigns an
> owner and runs the **same** `validateImplementationOwner` rule before transitioning
> (see A3).

## Benefits — `/api/benefits` (protect at mount)
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | /ideas/:ideaId | any auth + **object check** | see Authz note A1 |
| POST | / | any auth + **object check** | multipart; owner/admin/committee (see A1) |
| PATCH | /:id/endorse | ADMIN, COMM | endorse/dispute |

## Reports — `/api/reports` (protect at mount)
| Method | Path | Role | Notes |
|---|---|---|---|
| GET | /dashboard, /department-targets, /sla-performance | ADMIN, COMM, DEPT | org-wide analytics |
| GET | /export | ADMIN, COMM | bulk export (in-memory per report §3) |

## Admin — `/api/admin` (`authorize(ADMIN)`), Notifications — `/api/notifications` (protect)
| Method | Path | Notes |
|---|---|---|
| GET/POST | /admin/users; PATCH /admin/users/:id, /:id/deactivate | user/role management (`adminUpdateUserSchema`) |
| GET/POST | /admin/categories, /criteria, /targets, /config, /holidays, /announcements | config; announcements PATCH/DELETE by id |
| GET | /admin/audit-logs | audit viewer |
| GET/PATCH | /notifications, /unread-count, /read-all, /:id/read | in-app notifications |

## Authorization re-verification (2026-09-27) — against report.md §3
**A1 — Benefit create/read object-level authz: RESOLVED.**
`createBenefit` calls `canAccessBenefit(user, null, idea, implementation, 'create')`
(owner/admin/committee) → 403 otherwise (`benefitController.js` ~L47–L57).
`getBenefitByIdea` calls `canAccessIdea(user, idea, 'read')` → 403 otherwise (~L146).
Also validates `implementation.ideaId === ideaId`. report.md's "no role/ownership check"
is **stale**.

**A2 — Implementation read-by-idea authz: RESOLVED.**
`getImplementationByIdea` calls `canAccessImplementation(user, implementation, idea, 'read')`
(admin, submitter→read, owner→read/write, committee→read/create) → 403 otherwise
(`implementationController.js` ~L140). `authorizationService.canAccessImplementation`
also unwraps populated `ownerId` (L90) so owners are not wrongly denied (bug fixed this
cycle). report.md's "returns to any authenticated caller" is **stale**.

**A3 — createImplementation trusted ownerId: RESOLVED (KI-005, 2026-09-27).**
`createImplementation` (route gated `authorize(ADMIN, COMM)`) and
`committeeController.approveImplementation` both now call
`authorizationService.validateImplementationOwner`, which enforces **exists (404),
active (400), and role eligibility — `ROLES.IMPLEMENTATION_OWNER` or ADMIN (400)**
(rule A, dept-agnostic). Department matching was dropped to align with the
dept-agnostic committee owner directory. Committee approval validates **before**
transitioning, so a bad owner id returns 404 instead of a 500.
Owner picker (`getImplementationOwners`) was already role-filtered; the UI now
soft-defaults to same-department owners with an opt-in to show all.

Policy helper: `server/services/authorizationService.js` (`canAccessIdea`,
`canAccessImplementation`, `canAccessBenefit`, `validateImplementationOwner`,
`throwIfNotAuthorized`) — one shared layer, not per-controller inline checks.

## Uploads note
`/uploads` static route exists but is **auth-gated**: `app.use('/uploads', protect,
express.static(uploadDir))` (`server.js` L226). report.md's "not clearly mounted" is stale.
