/**
 * Dashboard Page — FR-01 complete.
 * 9 KPI cards + Featured Ideas + Announcements + Quick Actions + Department Targets
 */
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { dashboardAPI } from '../../api'
import { selectCurrentUser } from '../../store/authSlice'
import { getFYLabel } from '@shared/constants'
import KpiCard from '../../components/KpiCard'
import IdeaStatusBadge from '../../components/IdeaStatusBadge'
import RichText from '../../components/RichText'
import EmptyState from '../../components/EmptyState'
import ErrorState from '../../components/ErrorState'
import usePageTitle from '../../hooks/usePageTitle';
import {
  Lightbulb, TrendingUp, Users, Target, Rocket, BadgeDollarSign,
  Activity, BarChart3, Zap, Calendar, ArrowRight, Megaphone, Plus,
} from 'lucide-react'

const KPI_ICONS = [
  { icon: Calendar,        label: 'Ideathons Hosted',           key: 'ideathonsHosted',           color: 'var(--purple-text)' },
  { icon: Users,           label: 'Associates Shared Ideas',    key: 'associatesSharedIdeas',      color: 'var(--emerald-text)' },
  { icon: Lightbulb,       label: 'Ideas Received',             key: 'ideasReceived',              color: 'var(--warning-text)' },
  { icon: Target,          label: 'Opportunities Tagged',       key: 'opportunitiesTagged',        color: 'var(--info-text)' },
  { icon: Rocket,          label: 'Implemented Ideas',          key: 'implementedIdeas',           color: 'var(--orange-text)' },
  { icon: BadgeDollarSign, label: 'Benefits Realized (₹)',      key: 'benefitsRealizedINR',        color: 'var(--success-text)', isCurrency: true },
  { icon: Activity,        label: 'Active Participants',        key: 'activeParticipants',         color: 'var(--primary)' },
  { icon: BarChart3,       label: 'Dept. Participation Rate',   key: 'departmentParticipationRate', color: 'var(--pink-text)', isPercent: true },
  { icon: Zap,             label: 'Innovation Index',           key: 'innovationIndex',             color: 'var(--warning-text)', isIndex: true },
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
  usePageTitle('Dashboard');
  const user = useSelector(selectCurrentUser)
  const fy   = getFYLabel()

  const { data: kpiRes, isLoading: kpiLoading, isError: kpiError, refetch: refetchKpi } = useQuery({
    queryKey: ['kpis', fy],
    queryFn: () => dashboardAPI.kpis({ fy }),
    select: (r) => r.data.data,
  })

  const { data: featuredRes, isLoading: featuredLoading, isError: featuredError, refetch: refetchFeatured } = useQuery({
    queryKey: ['featured-ideas'],
    queryFn: () => dashboardAPI.featuredIdeas(),
    select: (r) => r.data.data,
  })

  const { data: announcementsRes, isLoading: annLoading, isError: annError, refetch: refetchAnn } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => dashboardAPI.announcements(),
    select: (r) => r.data.data,
  })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="page-enter max-w-[1400px] mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-display text-2xl sm:text-3xl text-theme-text mb-1">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-theme-text/80 text-sm">
            Innovation Dashboard · {fy} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link
          to="/ideas/new"
          id="btn-submit-idea-dashboard"
          className="btn btn-primary self-start"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Submit New Idea
        </Link>
      </div>

      {/* ── 9 KPI Cards (FR-01-01) ── */}
      <section aria-labelledby="kpi-heading" className="mb-8">
        <h2 id="kpi-heading" className="text-label mb-4">Innovation Metrics · {fy}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          {KPI_ICONS.map((meta, i) => (
            <KpiCard
              key={meta.key}
              icon={meta.icon}
              label={meta.label}
              value={formatValue(meta, kpiRes?.[meta.key])}
              color={meta.color}
              loading={kpiLoading}
              animationDelay={i * 80}
            />
          ))}
        </div>
        {kpiError && (
          <div className="alert-error rounded-xl px-4 py-3 mt-4 text-sm flex items-center justify-between gap-3">
            <span>Metrics couldn't be loaded. The figures below may be inaccurate.</span>
            <button type="button" className="btn btn-ghost btn-sm shrink-0" onClick={() => refetchKpi()}>Retry</button>
          </div>
        )}
      </section>

      {/* ── Two-column: Featured Ideas + Announcements ── */}
      <div className="grid xl:grid-cols-3 gap-6 mb-8">
        {/* Featured Ideas (FR-01-02) */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-heading text-base text-theme-text flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-theme-accent" aria-hidden="true" />
              Featured Ideas
            </h2>
            <Link to="/gallery" className="text-xs text-theme-text/80 hover:text-theme-accent flex items-center gap-1 transition-colors">
              View Gallery <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
          <div className="space-y-3">
            {featuredLoading ? (
              <div className="space-y-3" aria-hidden="true">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="glass rounded-xl p-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg skeleton" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-2/3 skeleton rounded" />
                      <div className="h-3 w-1/3 skeleton rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : featuredError ? (
              <ErrorState title="Couldn't load featured ideas" message="Please try again." onRetry={() => refetchFeatured()} className="glass rounded-xl" />
            ) : featuredRes?.length ? featuredRes.slice(0, 4).map((idea) => (
              <Link
                key={idea._id}
                to={`/ideas/${idea._id}`}
                className="glass glass-hover rounded-xl p-4 flex items-start gap-4 group block transition-all duration-200"
              >
                <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-theme-text group-hover:text-theme-accent transition-colors line-clamp-1">
                      {idea.title}
                    </h3>
                    <IdeaStatusBadge status={idea.status} />
                  </div>
                  <p className="text-xs text-theme-text0 mt-1">
                    {idea.submittedBy?.name} · {idea.department} · {idea.ideaId}
                  </p>
                </div>
              </Link>
            )) : (
              <EmptyState
                icon={Lightbulb}
                title="No featured ideas yet"
                message="Ideas approved for publishing will appear here."
                className="glass rounded-xl"
              />
            )}
          </div>
        </div>

        {/* Announcements (FR-01-04) */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-heading text-base text-theme-text flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-theme-accent" aria-hidden="true" />
              Announcements
            </h2>
          </div>
          <div className="space-y-3">
            {annLoading ? (
              <div className="space-y-3" aria-hidden="true">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="glass rounded-xl p-4 space-y-2">
                    <div className="h-4 w-1/2 skeleton rounded" />
                    <div className="h-3 w-full skeleton rounded" />
                    <div className="h-3 w-3/4 skeleton rounded" />
                  </div>
                ))}
              </div>
            ) : annError ? (
              <ErrorState title="Couldn't load announcements" message="Please try again." onRetry={() => refetchAnn()} className="glass rounded-xl" />
            ) : announcementsRes?.length ? announcementsRes.slice(0, 5).map((a) => (
              <div key={a._id} className="glass rounded-xl p-4">
                <h3 className="text-sm font-semibold text-theme-text mb-1 line-clamp-1">{a.title}</h3>
                <div className="text-xs text-theme-text/80 line-clamp-3">
                  <RichText html={a.richTextBody} className="prose-idea-sm" />
                </div>
                <p className="text-xs text-theme-text0 mt-2">
                  Expires: {new Date(a.expiryDate).toLocaleDateString('en-IN')}
                </p>
              </div>
            )) : (
              <EmptyState
                icon={Megaphone}
                title="No active announcements"
                message="New announcements from your administrators will appear here."
                className="glass rounded-xl"
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Actions (FR-01-05) ── */}
      <section aria-labelledby="quick-actions-heading" className="mb-8">
        <h2 id="quick-actions-heading" className="text-label mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/ideas/new',   icon: Plus,        label: 'Submit New Idea',     id: 'qa-submit' },
            { to: '/ideas',       icon: Lightbulb,   label: 'Track My Ideas',      id: 'qa-track'  },
            { to: '/events',      icon: Calendar,    label: 'Explore Ideathons',   id: 'qa-events' },
            { to: '/gallery',     icon: TrendingUp,  label: 'View Gallery',        id: 'qa-gallery' },
          ].map(({ to, icon: Icon, label, id }) => (
            <Link
              key={id}
              to={to}
              id={id}
              className="glass glass-hover cursor-pointer rounded-xl p-5 flex flex-col items-center gap-3 text-center transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-theme-accent/10 flex items-center justify-center transition-colors">
                <Icon className="w-5 h-5 text-theme-accent" aria-hidden="true" />
              </div>
              <span className="text-sm font-semibold text-theme-text/80 group-hover:text-theme-text transition-colors">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
