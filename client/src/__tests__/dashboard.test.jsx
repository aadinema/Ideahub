import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import authReducer from '../store/authSlice'
import DashboardPage from '../features/dashboard/DashboardPage'
import KpiCard from '../components/KpiCard'
import AnnouncementBanner from '../features/dashboard/components/AnnouncementBanner'
import DashboardFilters from '../features/dashboard/components/DashboardFilters'
import { Lightbulb } from 'lucide-react'

// Mock api
vi.mock('../api', () => ({
  dashboardAPI: {
    kpis: vi.fn(() =>
      Promise.resolve({
        data: {
          success: true,
          data: {
            ideathonsHosted: 5,
            associatesSharedIdeas: 42,
            ideasReceived: 120,
            opportunitiesTagged: 25,
            implementedIdeas: 18,
            benefitsRealizedINR: 1500000,
            activeParticipants: 76,
            departmentParticipationRate: 85,
            innovationIndex: 78,
          },
        },
      })
    ),
    featuredIdeas: vi.fn(() =>
      Promise.resolve({
        data: {
          success: true,
          data: [
            {
              _id: 'idea-1',
              ideaId: 'IDEA-2026-001',
              title: 'Automated Invoice Matching Engine',
              category: 'Automation',
              department: 'Finance',
              status: 'published',
              submittedBy: { name: 'Priya Sharma', department: 'Finance' },
            },
          ],
        },
      })
    ),
    successStories: vi.fn(() =>
      Promise.resolve({
        data: {
          success: true,
          data: [
            {
              _id: 'story-1',
              title: 'Paperless Claims Processing System',
              department: 'Operations',
              status: 'benefits_recorded',
              submittedBy: { name: 'Rahul Verma', department: 'Operations' },
              benefit: {
                netAnnualSavingsINR: 2400000,
                operationalDescription: 'Reduced turnaround time by 65%.',
              },
            },
          ],
        },
      })
    ),
    announcements: vi.fn(() =>
      Promise.resolve({
        data: {
          success: true,
          data: [
            {
              _id: 'ann-1',
              title: 'Annual Q3 Innovation Challenge Now Live',
              richTextBody: '<p>Submit your ideas by October 15th to win prizes.</p>',
              priority: 'High Priority',
              expiryDate: new Date(Date.now() + 86400000 * 10).toISOString(),
            },
          ],
        },
      })
    ),
    departmentTargets: vi.fn(() =>
      Promise.resolve({
        data: {
          success: true,
          data: [
            { department: 'Engineering', actual: 45, targetValue: 50, percentage: 90 },
            { department: 'Sales', actual: 20, targetValue: 30, percentage: 66.7 },
          ],
        },
      })
    ),
  },
  eventsAPI: {
    explore: vi.fn(() =>
      Promise.resolve({
        data: {
          success: true,
          data: [{ _id: 'ev-1', title: 'Q3 Hackathon 2026' }],
        },
      })
    ),
    list: vi.fn(() =>
      Promise.resolve({
        data: {
          success: true,
          data: [],
        },
      })
    ),
  },
}))

function renderWithProviders(ui) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: { _id: 'u1', name: 'Aaditya Nema', email: 'aaditya@ideahub.local', roles: ['employee'] },
        accessToken: 'tok',
        isAuthenticated: true,
      },
    },
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    </Provider>
  )
}

describe('Home Dashboard & Redesigned Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('renders KpiCard with trend arrow, value, and sparkline', () => {
    const { container } = render(
      <KpiCard
        icon={Lightbulb}
        label="Ideas Received"
        value="120"
        color="#3B82F6"
        trend={{ direction: 'up', value: '+24%', label: 'vs last Q' }}
        sparklineData={[10, 20, 15, 30, 45]}
      />
    )
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText('Ideas Received')).toBeInTheDocument()
    expect(screen.getByText('+24%')).toBeInTheDocument()
    expect(screen.getByText('vs last Q')).toBeInTheDocument()
    // SVG sparkline exists
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders AnnouncementBanner and allows dismissal', () => {
    const announcements = [
      {
        _id: 'a1',
        title: 'Q3 Innovation Sprint Live',
        richTextBody: 'Submit your proposals',
        priority: 'Urgent',
        expiryDate: new Date(Date.now() + 86400000).toISOString(),
      },
    ]

    render(<AnnouncementBanner announcements={announcements} />)
    expect(screen.getByText('Q3 Innovation Sprint Live')).toBeInTheDocument()
    expect(screen.getByText('Urgent')).toBeInTheDocument()

    // Dismiss announcement
    const dismissBtn = screen.getByLabelText('Dismiss announcement')
    fireEvent.click(dismissBtn)

    // Should be dismissed from view
    expect(screen.queryByText('Q3 Innovation Sprint Live')).toBeNull()
  })

  it('renders DashboardFilters and handles changes and reset', () => {
    const onChange = vi.fn()
    const onReset = vi.fn()
    const filters = { fy: 'FY2026-27', department: 'Engineering', event: '' }

    render(
      <DashboardFilters
        filters={filters}
        onChange={onChange}
        onReset={onReset}
        events={[{ _id: 'e1', title: 'AI Hackathon' }]}
      />
    )

    expect(screen.getByText('1 active filter')).toBeInTheDocument()
    const resetBtn = screen.getByText('Reset')
    fireEvent.click(resetBtn)
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('renders full DashboardPage with greeting, KPI metrics, quick actions, and carousels', async () => {
    renderWithProviders(<DashboardPage />)

    // Greeting
    expect(screen.getByText(/Aaditya/i)).toBeInTheDocument()
    // Submit Idea CTA (header + quick actions)
    expect(screen.getAllByText(/Submit New Idea/i).length).toBeGreaterThanOrEqual(1)
    // Quick actions heading
    expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument()

    // Async KPIs loaded
    expect(await screen.findByText('120')).toBeInTheDocument()
    expect(await screen.findByText('Automated Invoice Matching Engine')).toBeInTheDocument()
    expect(await screen.findByText('Paperless Claims Processing System')).toBeInTheDocument()
  })
})
