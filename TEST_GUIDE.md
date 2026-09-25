# IdeaHub Test & CI Guide

This document explains how to run tests locally and understand the CI pipeline.

## Local Test Execution

### Prerequisites

- Node.js 18+
- MongoDB 7+ running (locally or via Atlas)
- All dependencies installed: `npm ci && cd client && npm ci && cd ../server && npm ci && cd ../e2e && npm ci`

### Setup Local Environment

1. **Configure environment variables**
   ```bash
   # Server
   cd server
   cp .env.example .env
   # Edit .env with your MongoDB URI, JWT secrets, etc.
   
   # Client
   cd ../client
   # No .env needed for local development; Vite uses VITE_API_PORT from .env.development
   ```

2. **Seed database** (optional but recommended)
   ```bash
   cd server
   npm run seed
   ```

3. **Start MongoDB**
   ```bash
   # Option 1: Local MongoDB service
   brew services start mongodb-community
   
   # Option 2: Docker
   docker run -d -p 27017:27017 mongo:7
   
   # Option 3: Atlas (configure MONGODB_URI in .env)
   ```

### Run Tests Locally

#### Client Unit Tests

```bash
cd client
npm run test
```

Runs React component tests with Vitest + React Testing Library.

**Coverage:**
- Protected routes and authentication state
- Token storage and refresh logic
- Mutation error handling and form validation
- Accessibility semantics

#### Server Unit & API Tests

```bash
cd server
npm run test
```

Runs Express route and controller tests with Jest + Supertest.

**Coverage:**
- Authorization (object-level access control)
- Authentication (refresh rotation, reuse detection, logout)
- Model validation and persistence
- API error handling

**Environment variables for test mode:**
```bash
NODE_ENV=test \
MONGODB_URI=mongodb://localhost:27017/ideahub-test \
JWT_ACCESS_SECRET=test-secret-key \
JWT_REFRESH_SECRET=test-secret-key \
npm run test
```

#### E2E Tests

```bash
cd server && npm run dev &  # Start backend on port 5000
cd ../client && npm run dev &  # Start frontend on port 5173
cd ../e2e
npm run test
```

Or run only smoke tests (fast):
```bash
npm run test:smoke
```

**Other E2E commands:**
- `npm run test:headed` — See browser during test execution
- `npm run test:debug` — Step through code with Playwright Inspector
- `npm run test:report` — View interactive HTML report of last run

### Run All Tests Together

```bash
# From project root
npm run test:all
```

Or manually:

```bash
# Client
cd client && npm run test && cd ..

# Server
cd server && npm run test && cd ..

# E2E (requires backend/frontend running)
cd server && npm run dev &
cd ../client && npm run dev &
cd ../e2e && npm run test:smoke
```

## CI Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push to `main`/`develop` and pull request.

### Stages

1. **Dependency Installation** — `npm ci` with lockfile enforcement
2. **Client Lint & Build** — Code style check, Vite production build
3. **Client Unit Tests** — Vitest runner
4. **Server Lint & Build** — Code style check, syntax validation
5. **Server Unit Tests** — Jest with test database
6. **Dependency Audit** — npm audit for known vulnerabilities
7. **Secret Scanning** — Gitleaks detects secrets in code/history
8. **E2E Smoke Tests** — Playwright critical-path tests
9. **Security Scanning** — OWASP Dependency Check, CodeQL
10. **Report Upload** — E2E screenshots/videos retained 30 days

### What Stops a Merge

- ❌ Client build failure
- ❌ Client test failure
- ❌ Server test failure
- ❌ Secret scanning detection
- ⚠️ Dependency audit warning (non-blocking)
- ⚠️ CodeQL findings (informational)

### Viewing CI Results

1. **In GitHub:** Go to PR → "Checks" tab → click workflow for details
2. **Locally:** Run `npm run test:all` to replicate CI locally
3. **Artifacts:** E2E reports uploaded; available for 30 days in "Artifacts" section

## Test Coverage Targets

| Component | Target | Status |
|-----------|--------|--------|
| Client unit tests | 60%+ | In progress |
| Server unit tests | 70%+ | In progress |
| Critical E2E paths | 100% smoke coverage | In progress |
| Authorization | 100% (negative + positive cases) | ✅ Implemented |

Run coverage reports:

```bash
# Client
cd client && npm run test:coverage

# Server
cd server && npm run test -- --coverage
```

## Troubleshooting

### Tests Fail Locally But Pass in CI (or vice versa)

1. **Check Node/npm versions:** `node --version && npm --version` (should match `.nvmrc` or workflow)
2. **Clear caches:** `rm -rf node_modules package-lock.json && npm ci`
3. **Check MongoDB:** `mongosh --eval "db.adminCommand('ping')"`
4. **Verify env vars:** Compare `.env` with `.env.example`

### Database Already in Use

```bash
# Kill stuck MongoDB
lsof -ti:27017 | xargs kill -9

# Or use Docker
docker stop ideahub-mongo && docker rm ideahub-mongo
```

### Port Conflicts

```bash
# Find process on port
lsof -ti:5000  # Backend
lsof -ti:5173  # Frontend
lsof -ti:27017 # MongoDB

# Kill if needed
kill -9 <PID>
```

### Flaky E2E Tests

- Increase timeouts in `e2e/playwright.config.js` → `timeout`
- Use `waitForNavigation()` and explicit waits in tests
- Check database seeding is complete before running
- Isolate tests to run sequentially vs. parallel

## CI Secrets & Credentials

**Never commit credentials to the repository.** The CI workflow uses GitHub Secrets for:

- `MONGODB_URI` — Test database connection string
- `JWT_ACCESS_SECRET` — Signing key (test value)
- `JWT_REFRESH_SECRET` — Refresh signing key (test value)
- AWS credentials (if uploading test artifacts)

To set up secrets in GitHub:

1. Go to Repository → Settings → Secrets and Variables → Actions
2. Create new repository secret for each sensitive value
3. Reference in workflow as `${{ secrets.SECRET_NAME }}`

## Next Steps

- [ ] Increase unit test coverage to 70%+ for server, 60%+ for client
- [ ] Add integration tests for cross-domain workflows (idea submission → implementation → benefit)
- [ ] Add visual regression tests using Percy or Chromatic
- [ ] Set up continuous code quality scanning (SonarQube, Codacy)
- [ ] Create performance benchmarks for API response times
- [ ] Document rollback and incident response procedures

## Support

For test failures or setup issues:

1. Check the [E2E Testing Guide](./e2e/README.md)
2. Review workflow logs in GitHub Actions
3. Run tests locally with debug output: `DEBUG=* npm run test`
4. File an issue with: OS, Node version, MongoDB version, error logs
