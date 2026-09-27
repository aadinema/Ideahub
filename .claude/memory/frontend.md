# Frontend — IdeaHub (orientation only)

Last verified: 2026-09-27 (UI/UX audit Phase 5 — verification)
Previously: 2026-09-27
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

## Tests — client suite WIRED and passing (KI-003 FIXED 2026-09-27)
- `client/src/__tests__/auth.test.jsx` exists (vitest + @testing-library/react):
  protected routes, token-storage non-persistence, mutation error states,
  expired-token recovery, form validation, accessibility.
- `client/src/__tests__/pages.smoke.test.jsx` (added 2026-09-27, re-audit) — render
  smoke tests for the pages that had crashed at mount (KI-015/016/017). Guards the
  TDZ `usePageTitle` pattern and the missing-import/dead-error-branch classes.
- `client/src/__tests__/a11y.test.jsx` (added 2026-09-27, KI-014) — real axe-core
  checks on Login, Dashboard, IdeaList, Admin, EmptyState/ErrorState, Modal, Toast.
  Helper: `client/src/test/axe.js`. jsdom disables `color-contrast` (no paint) and
  `region`; all other rules run.
The earlier note that these tests never ran is **stale** — see KI-003. As of
2026-09-27: `client/package.json` has `test`/`test:watch`/`test:coverage` scripts,
`client/vitest.config.js` + `client/src/test/setup.js` exist, `jsdom` is installed,
and `cd client && npm test` → **26/26 passing** (13 auth + 6 smoke + 7 a11y).
`axe-core` is a **devDependency only** (verified absent from the prod bundle). CI gates it.

## Shared UI state layer (added 2026-09-27, UI/UX audit Phase 2; completed Phase 3)
- `components/ErrorState.jsx` / `EmptyState.jsx` / `Skeleton.jsx` / `Toast.jsx`;
  backing classes `.state*`, `.skeleton*`, `.range`, `.prose-idea-sm` in `index.css`.
  Every data view now uses loading = `.skeleton` primitive, error = `ErrorState`
  (+ retry), empty = `EmptyState` (+ guidance). No hand-rolled `animate-pulse`
  remains anywhere in `client/src`.
- Status *text* colors: use `text-success-text` / `text-warning-text` / `text-error-text`
  (AA-safe). The plain `text-success`/`text-warning`/`text-error` fail AA as body text
  and are for icons/fills only. See CHANGELOG 2026-09-27.

## Design system (2026-09-27, UI/UX audit Phase 2 foundation)
All defined in `client/src/index.css` (`:root` + `[data-theme="dark"]` + `@theme`).
- **Fonts:** platform UI stack (`system-ui, -apple-system, 'Segoe UI', Roboto, …`).
  No external fonts — the SPA must satisfy the server CSP (`font-src 'self'`,
  `style-src 'self'`). Do **not** re-add a Google Fonts link.
- **Color:** navy/indigo brand tokens; `--text-primary/secondary/muted`; status
  fills (`--success/warning/error/info/purple/pink/orange/emerald`) for fills/icons
  and matching `--*-text` for text. Role accents: `--role-*`.
- **Radius:** `--radius-sm` 8 / `--radius-md` 12 / `--radius-lg` 16 (controls / small
  cards / panels). **Elevation:** `--shadow-card` / `--shadow-pop` / `--shadow-modal`.
- **Motion:** `--transition-fast|base|slow`; one global `prefers-reduced-motion`
  rule disables decorative animation. `scroll-behavior: smooth` is gated too.
- **Skeletons:** use the `.skeleton` class (themed sweep), not
  `bg-theme-surface animate-pulse` (that is invisible on light surfaces). Primitives
  in `components/Skeleton.jsx`: `Skeleton`, `SkeletonList`, `SkeletonRows`
  (list/table rows).
- **Range inputs:** use the `.range` class (themed track + visible thumb).
- **Color alpha:** never concatenate hex alpha onto a token — `var(--error)15` is
  **invalid CSS**. Use `color-mix(in srgb, var(--error) 15%, transparent)`.
- **Prose previews:** `.prose-idea` for full content; `.prose-idea-sm` for truncated
  card previews (unlayered, so it wins over `.prose-idea`).
- **Tabs:** every `role="tablist"` implements the WAI-ARIA keyboard pattern
  (roving `tabIndex` + Arrow/Home/End). Implemented in AppLayout-adjacent pages:
  Admin, IdeaList, IdeaForm, Events.
- **Components:** `ErrorState` / `EmptyState` / `Skeleton` / `KpiCard` / `Modal` /
  `Toast` are the single shared set (no per-feature duplicates — `ceoUtils` delegates
  to the shared `ErrorState`/`EmptyState`, which take a `compact` prop for dense
  panels). `KpiTile`/`SectionPanel`/`PanelSkeleton`/`InfoTip` in `ceoUtils` remain
  CEO-specific atoms. Tables use `.table-base` + `.table-responsive`. Transient
  feedback uses `Toast` (presentational; no global provider yet).

## Page titles and motion
- `hooks/usePageTitle.js` is the only per-route title mechanism (no Helmet). 18 pages
  use it. EventDetail is static — its call precedes the query that defines `event`.
- Interactive transitions: `transition-all duration-200` is the convention. Chart/progress
  bar `duration-500|700` on `transition-[width]` is intentional.

## Verification status (2026-09-27, audit Phase 5)
- `npm run build` ✓ and `npm test` 19/19 ✓ in `client/` — this is the only check that
  can be run in the current sandbox.
- Server Jest and the Playwright smoke **cannot** run locally: the sandbox blocks local
  sockets (EPERM on `net.connect(27017)`) and child-process spawn, so MongoDB and both
  dev servers are unreachable. Both are gated in `.github/workflows/ci.yml`.
- **axe-core now runs in the client suite (2026-09-27).** `axe-core` is a devDependency;
  `client/src/__tests__/a11y.test.jsx` checks Login, Dashboard, IdeaList, Admin,
  EmptyState/ErrorState, Modal and Toast and asserts **zero violations** (it caught a
  real WCAG 4.1.2 `aria-prohibited-attr` on KpiCard). **Caveat:** it runs under jsdom,
  so `color-contrast` is disabled (no layout/paint) and `region` is disabled for
  component fragments. Colour contrast and full-page landmark checks still need
  Lighthouse / axe DevTools in a real browser — no Lighthouse score exists yet.
- All 36 genuinely unlabelled `<label>` elements are now paired with `htmlFor`/`id`. The
  remaining `<label>`s without `htmlFor` are all *wrapping* labels (the control is a
  child) or point at `RichTextEditor`, which takes its own `ariaLabel` — both are valid.
  In a new form, prefer the explicit `htmlFor`/`id` pair; the wrapping pattern is what
  produced the original gap.
- Never find JSX tag boundaries with `indexOf(">")` — `>` appears in JSX text and in
  comparisons. Use a regex or edit by hand. See the CHANGELOG's Phase 5 entry.

## Key libs
Axios (centralized client in `src/api/`), Tailwind CSS, Recharts (charts),
react-quill (`RichTextEditor`), Zod + react-hook-form, lucide-react (icons).
Versions in architecture.md.
