# Environment & Configuration — IdeaHub

Last verified: 2026-09-27
Rule: names/purpose only — **never** real values. Written from `server/.env` key names,
`server/.env.example`, and `process.env.*` reads in code.

## Env files
| File | Status | Notes |
|---|---|---|
| `server/.env` | EXISTS (dev only, gitignored) | live values; **not tracked by git** |
| `server/.env.example` | EXISTS | placeholders; report Phase 2 item 3 ("create") already done |
| `client/.env` | EXISTS (untracked, gitignored) | `VITE_API_PORT` only |
| `.gitignore` | covers `.env`, `.env.local`, `.env.*.local`, `.env.development`, `client/.env` | `server/.gitignore` also covers `.env` |
| `.env.development` (root) | **DELETED 2026-09-27** | was duplicate + never loaded by Vite |

`server/.env` holds (keys only): CLIENT_ORIGIN, JWT_ACCESS_EXPIRES_IN, JWT_ACCESS_SECRET,
JWT_REFRESH_EXPIRES_DAYS, MONGODB_URI, NODE_ENV, PORT.

## Server variables (name · read at · required?)
| Name | Read at | Purpose | Required |
|---|---|---|---|
| NODE_ENV | server.js, errorHandler, authController, securityHeaders | mode | optional (default 'development') |
| PORT | server.js L245 (validated at startup) | HTTP port | optional (**default 5000**); invalid → exits 1 |
| MONGODB_URI | config/db.js L12 (also getImpl.js, jest.setup.js) | DB connection | optional by code (default `mongodb://localhost:27017/ideahub`) — required in practice |
| JWT_ACCESS_SECRET | middleware/auth.js L35, L110; authController | sign/verify access JWT | **no startup assertion found** (fails at runtime if missing) |
| ~~JWT_REFRESH_SECRET~~ | **REMOVED 2026-09-27** | was never read by code | deleted from `.env`, `.env.example`, `ci.yml` (×3), `TEST_GUIDE.md` (×2) — refresh tokens are opaque SHA-256-hashed random bytes, not JWTs |
| JWT_ACCESS_EXPIRES_IN | authController L32 | access TTL | optional (default '15m') |
| JWT_REFRESH_EXPIRES_DAYS | authController L50 | refresh TTL | optional (default 7) |
| CLIENT_ORIGIN | server.js L131 | CORS origin | **required in production** — `throw` if unset (L132); dev default `http://localhost:5173` |
| STORAGE_PROVIDER | server.js L16/L75/L221; middleware/upload.js; storageService.js | 'local' or 's3' | optional; anything ≠ 's3' → local |
| LOCAL_UPLOAD_DIR | server.js L82/L224; upload.js L25 | local upload path | optional (default './uploads') |
| S3_REGION | upload.js L43; storageService.js | S3 region | required **only** if s3 (but see gap) |
| S3_BUCKET | upload.js L47 | S3 bucket | required **only** if s3 |
| SERVER_BASE_URL | storageService.js L29 | base URL for local attachment links | optional (default `http://localhost:5000`) |
| LOG_LEVEL | utils/logger.js L9 | Winston level | optional (default 'info') |
| SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS | emailService.js | SMTP for email notifications | required if email enabled (UNVERIFIED defaults) |
| EMAIL_FROM / EMAIL_FROM_NAME | emailService.js | sender identity | optional |
| SEED_DEFAULT_PASSWORD | seed/seedUsers.js | demo user password | seed-only (default in code) |

## Client variables
- `VITE_API_PORT` (in `client/.env`) — **now read by `vite.config.js`** (2026-09-27) as
  the dev proxy target; falls back to `server/.env PORT`, then 5000.
- Vite `envDir` defaults to `client/` → only `client/.env` is loaded. (The root
  `.env.development` was deleted 2026-09-27; it was a never-loaded duplicate.)
- No other `VITE_*` vars. Only `import.meta.env.DEV` is read (`LoginPage.jsx` L75) —
  Vite built-in, not configured.
- API base URL is derived in `client/src/api/axios.js`, not env-driven (UNVERIFIED exact line).

## Env files & git tracking (verified 2026-09-27)
| File | Tracked? | Contents |
|---|---|---|
| `server/.env` | **no** (not in history either) | live secrets: MONGODB_URI, JWT_ACCESS_SECRET, PORT, etc. |
| `server/.env.example` | yes | placeholders only |
| `client/.env` | no (gitignored 2026-09-27) | only `VITE_API_PORT` |
`.gitignore` covers `.env`, `.env.local`, `.env.*.local`, **and (added 2026-09-27)**
`.env.development` + `client/.env`.

## Config files (non-env)
- `server/config/db.js` — Mongoose connect (serverSelectionTimeoutMS 5000, socketTimeoutMS 45000).
- `client/vite.config.js` — alias `@shared/constants` → `client/src/constants.js`; dev
  server port 5173.
- `server/jest.setup.js` — rewrites `MONGODB_URI` → isolated `ideahub_test` (tests never touch dev DB).

## ✅ Port mismatch — RESOLVED (2026-09-27)
Before: a hard-coded Vite proxy (5001) vs a server default (5000) vs an unused
`VITE_API_PORT`. Now:

| Location | Value |
|---|---|
| `server/server.js` L245 | `process.env.PORT \|\| 5000`, validated (invalid → exit 1) |
| `client/vite.config.js` | reads `VITE_API_PORT` (client/.env) → falls back to server PORT → 5000 |
| `server/services/storageService.js` L29 (SERVER_BASE_URL default) | 5000 (still independent — not part of this fix) |
| `DEPLOYMENT.md` | still states **no backend port** (only Vite 5173) |
| `TEST_GUIDE.md` | updated to say `client/.env` / `VITE_API_PORT` |

Verified 2026-09-27: resolved Vite proxy = `http://localhost:5001`; a temp
`VITE_API_PORT=9999` produced the startup warning; `PORT=abc` and `PORT=70000` exit 1;
`PORT=6000` reaches "Server running on port 6000".

**Report nuance (kept):** report.md said "DEPLOYMENT.md documents port 5000" — reality is
DEPLOYMENT.md documents **no backend port at all**. The mismatch was real; that specific
report statement was imprecise.

**Residual (not this fix):** `storageService.js` `SERVER_BASE_URL` default is still a
hard-coded `:5000` — see known-issues.md.

## Gaps discovered
- `multer-s3` and `@aws-sdk/client-s3` are **required in code** (`upload.js` L41,
  `storageService.js` L57) but **NOT declared in `server/package.json`** → `STORAGE_PROVIDER=s3`
  crashes at require time. Startup var-check exists (`server.js` L16–L23) but does not
  check dependencies. (report §3 confirmed — known-issues.md KI-007)
- `.env.example` omits `S3_REGION`, `S3_BUCKET`, and `SERVER_BASE_URL` even though code reads them.
