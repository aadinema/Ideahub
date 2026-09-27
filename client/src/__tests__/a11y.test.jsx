/**
 * client/src/__tests__/a11y.test.jsx
 * Real accessibility checks (axe-core) for the key screens and shared components.
 *
 * This is the project's first automated a11y gate (KI-014). It runs the actual
 * axe engine, not a hand-written scan. Color-contrast is disabled because jsdom
 * cannot compute it; that rule remains a manual/Lighthouse check.
 *
 * Each test renders a screen and asserts zero axe violations. A failure prints a
 * readable list of violations so the regression is actionable.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import authReducer from '../store/authSlice';
import { axeViolations, formatViolations } from '../test/axe';

vi.mock('../api', async () => {
  const { vi } = await import('vitest');
  const pending = () => vi.fn(() => new Promise(() => {}));
  return {
    authAPI: { login: pending(), logout: pending() },
    ideasAPI: {
      getById: pending(), publish: pending(), create: pending(), autoSave: pending(),
      submit: pending(), duplicateCheck: pending(), myIdeas: pending(), list: pending(),
    },
    dashboardAPI: { kpis: pending(), featuredIdeas: pending(), announcements: pending() },
    galleryAPI: { list: pending(), getTopContributors: pending(), unpublish: pending() },
    adminAPI: {
      getUsers: pending(), updateUser: pending(), deactivateUser: pending(), createUser: pending(),
      getTargets: pending(), upsertTarget: pending(), getCriteria: pending(), updateCriteria: pending(),
      getAnnouncements: pending(), createAnnouncement: pending(), updateAnnouncement: pending(),
      deleteAnnouncement: pending(), getAuditLogs: pending(),
    },
    eventsAPI: { explore: pending(), getById: pending(), list: pending(), mine: pending(), facets: pending(), getLeaderboard: pending(), join: pending() },
  };
});

import LoginPage from '../features/auth/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import AdminDashboardPage from '../features/admin/AdminDashboardPage';
import IdeaListPage from '../features/ideas/IdeaListPage';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import Toast from '../components/Toast';
import Modal from '../components/Modal';

const authedState = {
  user: { _id: 'u1', name: 'Test User', email: 't@e.com', roles: ['admin'], department: 'IT' },
  accessToken: 'tok',
  isAuthenticated: true,
};

function renderPage(ui, { route = '/', path = '/', authed = false } = {}) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: authed ? authedState : { user: null, accessToken: null, isAuthenticated: false } },
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={path} element={ui} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

async function expectNoViolations(container) {
  const violations = await axeViolations(container);
  expect(violations, formatViolations(violations)).toEqual([]);
}

beforeEach(() => vi.clearAllMocks());

describe('Accessibility (axe-core)', () => {
  it('Login screen has no axe violations', async () => {
    const { container } = renderPage(<LoginPage />, { route: '/login', path: '/login' });
    await expectNoViolations(container);
  });

  it('Dashboard has no axe violations', async () => {
    const { container } = renderPage(<DashboardPage />, { route: '/dashboard', path: '/dashboard', authed: true });
    await expectNoViolations(container);
  });

  it('Idea list has no axe violations', async () => {
    const { container } = renderPage(<IdeaListPage />, { route: '/ideas', path: '/ideas', authed: true });
    await expectNoViolations(container);
  });

  it('Admin control center has no axe violations', async () => {
    const { container } = renderPage(<AdminDashboardPage />, { route: '/admin', path: '/admin', authed: true });
    await expectNoViolations(container);
  });

  it('EmptyState / ErrorState are accessible', async () => {
    const { container } = render(
      <>
        <EmptyState title="Nothing yet" message="Add one." />
        <ErrorState title="Failed" message="Try later." onRetry={() => {}} />
      </>
    );
    await expectNoViolations(container);
  });

  it('Modal has no axe violations when open', async () => {
    const { container } = render(
      <Modal open onClose={() => {}} title="Example dialog" description="Context">
        <p>Body</p>
      </Modal>
    );
    await expectNoViolations(container);
  });

  it('Toast has no axe violations', async () => {
    const { container } = render(<Toast tone="error" message="Export failed." onClose={() => {}} />);
    await expectNoViolations(container);
  });
});
