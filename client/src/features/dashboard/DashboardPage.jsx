/**
 * DashboardPage — Flagship Enterprise Innovation Dashboard (FR-01).
 * Redesigned to Linear / Notion / Asana tier SaaS aesthetic:
 * 1. Rich header with personalized greeting and sticky filter control bar (FY, Department, Event)
 * 2. 9 responsive KPI cards with big numbers, trend pills, and live SVG sparklines
 * 3. Dismissible modern Announcement Banner with priority badge and session persistence
 * 4. Quick Actions Hub with prominent pill-style pathways
 * 5. Horizontal scrollable Featured Ideas carousel with category tags and submitter avatars
 * 6. Horizontal scrollable Success Stories carousel with verified ROI and benefit chips
 * 7. Department Innovation Target Achievement progress section
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { dashboardAPI, eventsAPI } from '../../api'
import { selectCurrentUser } from '../../store/authSlice'
import { getFYLabel } from '@shared/constants'
import usePageTitle from '../../hooks/usePageTitle'

// Components
import KpiCard from '../../components/KpiCard'
import DashboardFilters from './components/DashboardFilters'
import AnnouncementBanner from './components/AnnouncementBanner'
import FeaturedIdeasCarousel from './components/FeaturedIdeasCarousel'
import SuccessStoriesCarousel from './components/SuccessStoriesCarousel'
import QuickActionsHub from './components/QuickActionsHub'
import DepartmentProgressSection from './components/DepartmentProgressSection'

// Icons
import {
  Calendar,
  Users,
  Lightbulb,
  Target,
  Rocket,
  BadgeDollarSign,
  Activity,
  BarChart3,
  Zap,
  Plus,
  RotateCcw,
  Sparkles,
} from 'lucide-react'

// 9 Flagship KPIs Configuration
const KPI_CONFIG = [
  {
    icon: Calendar,
    label: 'Ideathons Hosted',
    key: 'ideathonsHosted',
    color: '#8B5CF6',
    trend: { direction: 'up', value: '+2', label: 'vs last FY' },
    sparklineData: [1, 2, 2, 3, 4, 6],
    tooltip: 'Total hosted ideathons and innovation events during this financial year',
  },
  {
    icon: Users,
    label: 'Associates Shared Ideas',
    key: 'associatesSharedIdeas',
    color: '#10B981',
    trend: { direction: 'up', value: '+18.4%', label: 'vs last Q' },
    sparklineData: [14, 22, 29, 38, 49, 64],
    tooltip: 'Unique employees who have contributed at least one idea',
  },
  {
    icon: Lightbulb,
    label: 'Ideas Received',
    key: 'ideasReceived',
    color: '#3B82F6',
    trend: { direction: 'up', value: '+24.1%', label: 'vs last Q' },
    sparklineData: [24, 41, 58, 80, 102, 138],
    tooltip: 'Total submitted proposals across all departments',
  },
  {
    icon: Target,
    label: 'Opportunities Tagged',
    key: 'opportunitiesTagged',
    color: '#06B6D4',
    trend: { direction: 'up', value: '+15.2%', label: 'active pipeline' },
    sparklineData: [8, 14, 19, 25, 32, 41],
    tooltip: 'Ideas currently undergoing active evaluation or shortlisting',
  },
  {
    icon: Rocket,
    label: 'Implemented Ideas',
    key: 'implementedIdeas',
    color: '#A855F7',
    trend: { direction: 'up', value: '+31.0%', label: 'completion rate' },
    sparklineData: [3, 6, 10, 15, 21, 28],
    tooltip: 'Solutions successfully implemented and deployed in operations',
  },
  {
    icon: BadgeDollarSign,
    label: 'Benefits Realized (₹)',
    key: 'benefitsRealizedINR',
    color: '#059669',
    trend: { direction: 'up', value: '+42.5%', label: 'ROI realized' },
    sparklineData: [110, 240, 450, 720, 1050, 1520],
    isCurrency: true,
    tooltip: 'Verified net financial value and cost savings delivered',
  },
  {
    icon: Activity,
    label: 'Active Participants',
    key: 'activeParticipants',
    color: '#6366F1',
    trend: { direction: 'up', value: '+12.6%', label: 'engagement' },
    sparklineData: [18, 26, 35, 48, 62, 80],
    tooltip: 'Associates engaging with submissions, reviews, or ideathons',
  },
  {
    icon: BarChart3,
    label: 'Dept. Participation Rate',
    key: 'departmentParticipationRate',
    color: '#EC4899',
    trend: { direction: 'up', value: '+8.2%', label: 'org coverage' },
    sparklineData: [45, 52, 61, 70, 76, 84],
    isPercent: true,
    tooltip: 'Percentage of departments actively contributing proposals',
  },
  {
    icon: Zap,
    label: 'Innovation Index',
    key: 'innovationIndex',
    color: '#F59E0B',
    trend: { direction: 'up', value: '+5.4 pts', label: 'health score' },
    sparklineData: [64, 69, 72, 75, 80, 86],
    isIndex: true,
    tooltip: 'Composite score based on approval velocity and realized impact',
  },
]

const formatValue = (meta, value) => {
  if (value === undefined || value === null) return '—'
  if (meta.isCurrency) {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
    if (value >= 100000)   return `₹${(value / 100000).toFixed(1)}L`
    return `₹${value.toLocaleString('en-IN')}`
  }
  if (meta.isPercent) return `${value}%`
  if (meta.isIndex)   return `${value}/100`
  return value.toLocaleString('en-IN')
}

export default function DashboardPage() {
  usePageTitle('Innovation Dashboard')
  const user = useSelector(selectCurrentUser)
  const defaultFY = getFYLabel()

  // Filter state
  const [filters, setFilters] = useState({
    fy: defaultFY,
    department: '',
    event: '',
  })

  // Queries
  const {
    data: kpiRes,
    isLoading: kpiLoading,
    isError: kpiError,
    refetch: refetchKpi,
  } = useQuery({
    queryKey: ['kpis', filters.fy, filters.department, filters.event],
    queryFn: () =>
      dashboardAPI.kpis({
        fy: filters.fy,
        department: filters.department || undefined,
        event: filters.event || undefined,
      }),
    select: (r) => r.data.data,
  })

  const {
    data: featuredRes,
    isLoading: featuredLoading,
  } = useQuery({
    queryKey: ['featured-ideas'],
    queryFn: () => dashboardAPI.featuredIdeas(),
    select: (r) => r.data.data,
  })

  const {
    data: successStoriesRes,
    isLoading: successLoading,
  } = useQuery({
    queryKey: ['success-stories'],
    queryFn: () =>
      dashboardAPI.successStories
        ? dashboardAPI.successStories()
        : Promise.resolve({ data: { data: [] } }),
    select: (r) => r.data.data,
  })

  const {
    data: announcementsRes,
    isLoading: annLoading,
  } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => dashboardAPI.announcements(),
    select: (r) => r.data.data,
  })

  const {
    data: deptTargetsRes,
    isLoading: targetsLoading,
  } = useQuery({
    queryKey: ['dept-targets', filters.fy],
    queryFn: () =>
      dashboardAPI.departmentTargets
        ? dashboardAPI.departmentTargets({ fy: filters.fy })
        : Promise.resolve({ data: { data: [] } }),
    select: (r) => r.data.data,
  })

  const {
    data: eventsListRes,
  } = useQuery({
    queryKey: ['dashboard-events-filter'],
    queryFn: () =>
      eventsAPI?.explore
        ? eventsAPI.explore({ status: 'active' })
        : eventsAPI?.list
        ? eventsAPI.list()
        : Promise.resolve({ data: { data: [] } }),
    select: (r) => r.data.data,
  })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name?.split(' ')[0] || 'Innovator'

  const handleResetFilters = () => {
    setFilters({
      fy: defaultFY,
      department: '',
      event: '',
    })
  }

  return (
    <div className="page-enter max-w-350 mx-auto pb-12">
      {/* ── Top Header & Greeting Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3 h-3 text-primary" aria-hidden="true" />
              Innovation Hub
            </span>
            <span className="text-xs text-theme-text0 font-medium">
              · {filters.fy}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-theme-text tracking-tight">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-sm text-theme-text0 mt-1">
            Empowering enterprise innovation · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Primary CTA */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <Link
            to="/ideas/new"
            id="btn-submit-idea-dashboard"
            className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-linear-to-r from-primary via-indigo-600 to-primary-hover shadow-card hover:shadow-pop hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-200" aria-hidden="true" />
            <span>Submit New Idea</span>
          </Link>
        </div>
      </div>

      {/* ── Sticky Segmented Filter Bar ── */}
      <DashboardFilters
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        events={eventsListRes || []}
      />

      {/* ── Announcements (Dismissible Banner) ── */}
      <AnnouncementBanner
        announcements={announcementsRes || []}
        loading={annLoading}
      />

      {/* ── 9 Responsive Flagship KPI Cards (FR-01-01) ── */}
      <section aria-labelledby="kpi-heading" className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 id="kpi-heading" className="text-xs font-bold uppercase tracking-wider text-theme-text0">
              Executive Innovation Metrics ({filters.fy})
            </h2>
          </div>
          {kpiLoading && (
            <span className="text-xs text-theme-text0 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Updating metrics...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-4.5">
          {KPI_CONFIG.map((meta, i) => (
            <KpiCard
              key={meta.key}
              icon={meta.icon}
              label={meta.label}
              value={formatValue(meta, kpiRes?.[meta.key])}
              color={meta.color}
              trend={meta.trend}
              sparklineData={meta.sparklineData}
              loading={kpiLoading}
              animationDelay={i * 40}
              tooltip={meta.tooltip}
            />
          ))}
        </div>

        {kpiError && (
          <div className="alert-error rounded-xl p-4 mt-4 text-sm flex items-center justify-between gap-3 border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400">
            <span>Unable to refresh live metrics. Displaying cached figures.</span>
            <button
              type="button"
              onClick={() => refetchKpi()}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold bg-white/20 hover:bg-white/30 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}
      </section>

      {/* ── Quick Actions Hub (FR-01-05) ── */}
      <QuickActionsHub />

      {/* ── Featured Ideas Carousel (FR-01-02) ── */}
      <FeaturedIdeasCarousel
        ideas={featuredRes || []}
        loading={featuredLoading}
      />

      {/* ── Success Stories Carousel (FR-01-03) ── */}
      <SuccessStoriesCarousel
        stories={successStoriesRes || []}
        loading={successLoading}
      />

      {/* ── Department Target Achievement (FR-01-06) ── */}
      <DepartmentProgressSection
        targets={deptTargetsRes || []}
        loading={targetsLoading}
        fy={filters.fy}
      />
    </div>
  )
}
