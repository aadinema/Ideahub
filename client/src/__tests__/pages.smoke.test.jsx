/**
 * client/src/__tests__/pages.smoke.test.jsx
 * Render smoke tests for pages that previously crashed at module render time.
 *
 * Regression guard for the UI/UX audit Phase-1 findings:
 *   C1 — IdeaDetailPage called usePageTitle(idea?.title) before `const idea`
 *        existed → TDZ ReferenceError on every render.
 *   C2 — IdeaFormPage called usePageTitle(editId ? …) before `const editId`.
 *   C3 — AdminDashboardPage used <ErrorState> without importing it.
 *   C4 — GalleryPage never destructured isError/refetch, so its error branch
 *        was dead and the retry button threw.
 *
 * These tests assert only that the screen renders without throwing and that its
 * error branch is reachable. No business logic is exercised.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import authReducer from '../store/authSlice';

// Every API method returns a never-settling promise by default, so pages stay in
// their loading state and we never depend on the shape of backend payloads.
vi.mock('../api', async () => {
  const { vi } = await import('vitest');
  const pending = () => vi.fn(() => new Promise(() => {}));
  return {
    authAPI: { login: pending(), logout: pending() },
    ideasAPI: {
      getById: pending(), publish: pending(), create: pending(), autoSave: pending(),
      submit: pending(), duplicateCheck: pending(), myIdeas: pending(), list: pending(),
    },
    eventsAPI: {
      explore: pending(), getById: pending(), list: pending(), mine: pending(),
      facets: pending(), getLeaderboard: pending(), join: pending(),
      create: pending(), update: pending(), close: pending(), extend: pending(),
    },
    galleryAPI: { list: pending(), getTopContributors: pending(), unpublish: pending() },
    adminAPI: {
      getUsers: pending(), updateUser: pending(), deactivateUser: pending(), createUser: pending(),
      getTargets: pending(), upsertTarget: pending(), getCriteria: pending(), updateCriteria: pending(),
      getAnnouncements: pending(), createAnnouncement: pending(), updateAnnouncement: pending(),
      deleteAnnouncement: pending(), getAuditLogs: pending(),
    },
  };
});

import IdeaDetailPage from '../features/ideas/IdeaDetailPage';
import IdeaFormPage from '../features/ideas/IdeaFormPage';
import GalleryPage from '../features/gallery/GalleryPage';
import AdminDashboardPage from '../features/admin/AdminDashboardPage';

const authedState = {
  user: { _id: 'u1', name: 'Test User', email: 't@e.com', roles: ['admin'], department: 'IT' },
  accessToken: 'tok',
  isAuthenticated: true,
};

function renderPage(ui, { route = '/', path = '/' } = {}) {
  const store = configureStore({ reducer: { auth: authReducer }, preloadedState: { auth: authedState } });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Page render smoke tests (audit C1–C4)', () => {
  it('C1 — IdeaDetailPage renders without throwing', () => {
    const { container } = renderPage(<IdeaDetailPage />, { route: '/ideas/abc', path: '/ideas/:id' });
    // Loading state renders the page shell rather than crashing to the boundary.
    expect(container.querySelector('.page-enter')).toBeTruthy();
  });

  it('C2 — IdeaFormPage renders without throwing', () => {
    renderPage(<IdeaFormPage />, { route: '/ideas/new', path: '/ideas/new' });
    expect(screen.getByText(/Share Your Innovation Idea/i)).toBeInTheDocument();
  });

  it('C2 — IdeaFormPage renders in edit mode without throwing', () => {
    renderPage(<IdeaFormPage />, { route: '/ideas/abc/edit', path: '/ideas/:id/edit' });
    expect(screen.getByText(/Edit Your Idea/i)).toBeInTheDocument();
  });

  it('GalleryPage renders without throwing', () => {
    renderPage(<GalleryPage />, { route: '/gallery', path: '/gallery' });
    expect(screen.getByText(/Innovation Showcase/i)).toBeInTheDocument();
  });

  it('C3 — AdminDashboardPage error branch is reachable (ErrorState imported)', async () => {
    const { adminAPI } = await import('../api');
    adminAPI.getUsers.mockRejectedValueOnce(new Error('boom'));
    renderPage(<AdminDashboardPage />, { route: '/admin', path: '/admin' });
    expect(await screen.findByText(/Couldn't load users/i)).toBeInTheDocument();
  });

  it('C4 — GalleryPage error branch is reachable (isError/refetch destructured)', async () => {
    const { galleryAPI } = await import('../api');
    galleryAPI.list.mockRejectedValueOnce(new Error('boom'));
    renderPage(<GalleryPage />, { route: '/gallery', path: '/gallery' });
    expect(await screen.findByText(/Couldn't load the gallery/i)).toBeInTheDocument();
    // The retry affordance exists and does not throw when the query fails.
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
