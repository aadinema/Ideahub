# Frontend — IdeaHub (orientation only)

Last verified: 2026-09-27
Scope note: high-level orientation. For full structure query graphify; for endpoints
see api-contract.md. Does not re-list what graphify tracks.

## Shape
React 18 SPA on Vite 8, React Router 6. Entry `client/src/main.jsx` → `App.jsx`.
Folders: `src/features/<domain>/`, `src/components/`, `src/layouts/`, `src/api/`,
`src/store/`, `src/hooks/`, `src/utils/`.

## Routes (`client/src/App.jsx`)
- Public: `/login` (wrapped in `PublicRoute`).
- Protected (under `AppLayout`, wrapped in `ProtectedRoute`): `/dashboard`, `/ceo`,
  `/ideas`, `/ideas/new`, `/ideas/:id`, `/ideas/:id/edit`, `/supervisor/queue`,
  `/evaluations/queue`, `/evaluations/:id/score`, `/committee/queue`,
  `/committee/ideas/:id`, `/events`, `/events/:id`, `/gallery`,
  `/implementations/my`, `/benefits/record/:ideaId/:implementationId`, `/reports`, `/admin`.
- Fallback `*` → NotFoundPage.
- All page imports are **eager** (no `React.lazy`/`Suspense`) — code-splitting
  opportunity, report §2 / Phase 6.

## State management — VERIFIED 2026-09-27
- **Redux Toolkit** — only the `auth` slice (`src/store/index.js`): holds `user`,
  `accessToken`, `isAuthenticated`.
- **TanStack Query** — all server state. Defaults (`src/main.jsx` L9–L17):
  `staleTime` 5 min, `retry` 1, `refetchOnWindowFocus` false.
- **Zustand** — installed in `client/package.json` (`^5.0.14`) but **not imported
  anywhere in `client/src/`** (`grep -rn zustand src/` → 0 matches).
  → report.md's "appears unused" is **CONFIRMED: unused**. Remove or justify (Phase 6).

## Auth / token handling — report.md §3: VERIFIED FIXED 2026-09-27
- Access token: **in-memory only** — `authSlice.js` sets `accessToken: null` with
  explicit "never persisted" comments; `updateToken` updates memory only.
- localStorage holds only non-sensitive `user` (`ideahub_user` key).
- Refresh token: httpOnly cookie — `httpOnly: true`, `secure` when
  `NODE_ENV==='production'`, `sameSite: 'strict'`, path-scoped to `/api/auth/refresh`
  (`server/controllers/authController.js` L66–L74). Silent refresh on 401 with a
  request queue (`src/api/axios.js` L33–L74).
- → report.md's "access token stored in localStorage" finding is stale-resolved.
  See known-issues.md KI-002. Residual: confirm CSP coverage (Phase 4).

## Tests — report.md claim is STALE (see known-issues.md KI-003)
- `client/src/__tests__/auth.test.jsx` exists (vitest + @testing-library/react):
  protected routes, token-storage non-persistence, mutation error states,
  expired-token recovery, form validation, accessibility.
- ⚠️ But `client/package.json` has **no `test` script** and there is no vitest config
  → these tests never run. CI's step uses `npm run test --if-present`, silently
  skipping them. Logged as KI-003 (OPEN — false-confidence risk).

## Key libs
Axios (centralized client in `src/api/`), Tailwind CSS, Recharts (charts),
react-quill (`RichTextEditor`), Zod + react-hook-form, lucide-react (icons).
Versions in architecture.md.
