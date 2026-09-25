# E2E Testing Guide

This directory contains Playwright end-to-end tests for the IdeaHub application.

## Quick Start

```bash
# Install dependencies
npm ci

# Run all E2E tests
npm run test

# Run only smoke tests (marked with @smoke tag)
npm run test:smoke

# Run tests in headed mode (see browser)
npm run test:headed

# Debug mode (step through tests)
npm run test:debug

# View test report
npm run test:report
```

## Test Organization

Tests are organized by workflow:

- **auth/** — Authentication flows: login, logout, password reset, token refresh
- **dashboard/** — Dashboard widget rendering, filters, data refresh
- **ideas/** — Idea submission, editing, status transitions, list filtering
- **supervisor/** — Supervisor review and task management
- **evaluator/** — Evaluator scoring and feedback
- **committee/** — Committee workflows and approvals
- **ideathons/** — Event creation and ideathon management
- **fixtures/** — Shared test data and user credentials

## Test Fixtures

User credentials for manual testing are defined in `fixtures/auth.fixture.js`:

- **Employee**: `employee@ideahub.local` / password in fixture
- **Supervisor**: `supervisor@ideahub.local` / password in fixture
- **Evaluator**: `evaluator@ideahub.local` / password in fixture
- **Committee**: `committee@ideahub.local` / password in fixture
- **Admin**: `admin@ideahub.local` / password in fixture

**Important:** Database state is isolated per test. Do not rely on data created in one test to persist into another test, as each test may reset or use a fresh database.

## Environment Setup

### Prerequisites

- Node.js 18+
- MongoDB running locally or via Atlas
- Backend server running on `http://localhost:5000`
- Frontend dev server running on `http://localhost:5173` (optional; tests also connect directly to backend)

### Configuration

Edit `playwright.config.js` to adjust:

- `baseURL` — Where tests connect (default: `http://localhost:5173`)
- `timeout` — Max time per test (default: 30s)
- `retries` — Failed test retry count (default: 2 in CI, 0 locally)
- `workers` — Parallel test processes (default: 4)

### Running Tests Locally

1. **Start MongoDB**
   ```bash
   mongosh
   # (or your MongoDB service)
   ```

2. **Start the backend**
   ```bash
   cd ../server
   npm run dev
   ```

3. **Start the frontend** (optional; tests can hit backend directly)
   ```bash
   cd ../client
   npm run dev
   ```

4. **Seed test data** (optional)
   ```bash
   cd ../server
   npm run seed
   ```

5. **Run tests**
   ```bash
   cd ../e2e
   npm run test
   ```

## Smoke Tests

A subset of tests are tagged with `@smoke` for critical-path validation:

```bash
npm run test:smoke
```

These are designed to run quickly (< 2 minutes) and cover:
- User login / logout
- Creating an idea
- Supervisor review and approval
- Viewing dashboard

Use smoke tests as a quick sanity check in CI and before committing changes.

## CI Integration

The CI workflow (`.github/workflows/ci.yml`) runs:

1. Client unit tests (Vitest)
2. Server unit tests (Jest)
3. E2E smoke tests against isolated MongoDB

All three must pass for a PR to merge.

## Debugging Failed Tests

### View the Report

```bash
npm run test:report
```

This opens an interactive HTML report showing:
- Screenshots at failure point
- Video recording of the test run
- Step-by-step trace with network/console logs

### Debug Mode

```bash
npm run test:debug
```

This launches the Playwright Inspector, where you can:
- Step through test code
- Inspect DOM and network requests
- Modify and re-run selectors

### Headed Mode

```bash
npm run test:headed
```

Runs tests in a visible browser so you can watch interactions as they happen.

### Common Issues

| Issue | Solution |
|-------|----------|
| "Target closed" or connection errors | Ensure backend is running on port 5000 and MongoDB is available |
| "Selector not found" | The test depends on specific element IDs/classes; verify frontend HTML hasn't changed |
| Flaky auth tests | Clear cookies/localStorage and ensure test data is fresh |
| Database conflicts | If running multiple test processes, ensure each test cleans up its own records |

## Writing New Tests

1. **Create a test file** in the appropriate subdirectory (e.g., `ideas/create-idea.spec.js`)
2. **Use shared fixtures** from `fixtures/auth.fixture.js` for user logins
3. **Tag critical paths** with `@smoke` if the test covers a key workflow
4. **Clean up test data** in `afterAll()` hooks to avoid cross-test pollution
5. **Use page object patterns** for complex workflows (see existing tests for examples)

## Known Issues

- Some tests expect seeded data; ensure `npm run seed` is run before first test execution
- Browser context isolation may cause state leakage if tests modify global objects
- File uploads in tests use fixed paths; update as needed for your test environment

## Next Steps

- [ ] Add accessibility checks to smoke tests (axe-core plugin)
- [ ] Parameterize baseURL and credentials from environment variables
- [ ] Add visual regression tests for key UI pages
- [ ] Set up test result reporting dashboard
