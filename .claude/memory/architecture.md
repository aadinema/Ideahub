# Architecture — IdeaHub (orientation only)

Last verified: 2026-09-27
Scope note: high-level orientation. For full structural detail (all routes, models,
file relationships, communities), query graphify: `graphify explain "<node>"`,
`graphify path "A" "B"`, or read `graphify-out/GRAPH_REPORT.md`.

## What it is
Employee idea-management platform ("Ideathon"): idea submission → supervisor →
department evaluation → committee → implementation → benefits, plus events,
gallery, reports, and a CEO dashboard. React/Vite SPA + Express/Mongoose REST API.
Source: `IDEAHUB_IMPROVEMENT_REPORT.md` §1; `IdeaHub_Ideathon_FRD.md`.

## Stack (versions verified in package.json, 2026-09-27)
Client (`client/package.json`): React 18.3.1, Vite 8.2.1, React Router 6.30.4,
Redux Toolkit 2.12.0 + react-redux 9.3.0, TanStack Query 5.101.4, Zustand 5.0.14
(UNVERIFIED: report says Zustand appears unused — confirm in frontend.md),
Axios 1.19.0, Tailwind 4.3.3, Recharts 3.10.1, react-quill 2.0.0, Zod 4.4.3,
react-hook-form 7.85.0.
Server (`server/package.json`): Express 5.2.1, Mongoose 9.9.1, jsonwebtoken 9.0.3,
bcryptjs 3.0.3, Helmet 8.3.0, cors 2.8.6, express-rate-limit 8.6.2, multer 2.2.0,
Winston 3.19.0, node-cron 4.6.0, nodemailer 9.0.5, ExcelJS 4.4.0, PDFKit 0.19.1.
DB: MongoDB (dev via Atlas or local; see env-and-config.md).

## Repo layout (one line each)
- `client/`   — Vite SPA (`src/App.jsx` routes, `src/features/<domain>/`, `src/api/`, `src/store/`).
- `server/`   — Express API (`routes/`, `controllers/`, `models/`, `services/`, `middleware/`, `jobs/`, `seed/`).
- `shared/`   — canonical constants (`constants.js`, CommonJS).
- `e2e/`      — Playwright tests.
- `graphify-out/` — generated knowledge graph (do not hand-edit).
- `.github/workflows/ci.yml` — CI pipeline (EXISTS as of 2026-09-27, despite
  `IDEAHUB_IMPROVEMENT_REPORT.md` saying none; see CHANGELOG).

## Frontend ↔ backend data flow
Browser → `client/src/api/index.js` + `client/src/api/axios.js` (Axios) → `/api/*`
→ Express routers (mounted in `server/server.js` L206–L218) → controllers → Mongoose
models → MongoDB.
Auth: short-lived JWT access token sent as `Authorization: Bearer`; refresh token in
an httpOnly cookie (rotate + reuse-detect in `server/controllers/authController.js`).
Client state: Redux holds auth/session (`client/src/store/authSlice.js`); TanStack
Query holds server state. (Query defaults: UNVERIFIED — confirm in frontend.md.)

## Shared constants — TWO mirrored files (important)
- `shared/constants.js` — canonical, consumed by the server via CommonJS `exports.X`.
- `client/src/constants.js` — ESM `export`, consumed by the client. Vite alias maps
  `@shared/constants` → `client/src/constants.js` (`client/vite.config.js` L14).
- They are NOT byte-identical (different export mechanism) but must stay in sync;
  diverging values cause client/server drift. Verified 2026-09-27.

## Deployment topology
- Dev: Vite on :5173 with `/api` proxied to `http://localhost:5001`
  (`client/vite.config.js` L19–L27, hard-coded).
- Server: `server/server.js` L245 `PORT = process.env.PORT || 5000`.
- Prod: `NODE_ENV=production node server/server.js`; `client/dist/` served by
  nginx or Express static (`DEPLOYMENT.md`).
- Current runtime model: a single Node process that also runs in-process cron jobs
  (`server/jobs/*`, started from `server/server.js`) and an in-memory dashboard
  cache (`server/controllers/dashboardController.js`).

## Structural caveats (detail tracked in known-issues.md)
- Dev port mismatch: Vite proxy → 5001 vs server default 5000 vs DEPLOYMENT.md 5000.
- `DEPLOYMENT.md` §Horizontal Scaling claims a stateless API, but in-process jobs +
  process-local cache block true multi-instance scaling (report §3, §5).
