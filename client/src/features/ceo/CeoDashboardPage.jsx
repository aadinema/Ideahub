/**
 * client/src/features/ceo/CeoDashboardPage.jsx
 * CEO / C-Suite Executive Dashboard — "Innovation Command Center" (CEO-01).
 *
 * Hierarchy (§32): decision-support over data density —
 *   L1 KPIs → L2 health + trend → L3 pipeline/departments/impact →
 *   L4 attention + strategic + participation + activity.
 *
 * Data: 4 aggregated endpoints (§22 performance), real IdeaHub data only.
 * Filters: `period` + `department` live in the URL (shareable, back-button
 * friendly). Every list-shaped metric drills into underlying ideas (§19).
 * Backend authorization: authorize(ROLES.CEO) on every endpoint — a direct
 * URL visit without the role gets a clean access-denied panel (§24).
 * Mobile: source order = desktop; explicit `order-*` classes implement the
 * executive mobile priority (KPIs → alerts → pipeline → strategic → trend →
 * details, §21).
 */
import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '../../store/authSlice'
import { ceoAPI } from '../../api'
import { ROLES, IDEA_STATUS_GROUPS } from '@shared/constants'
import {
  Lightbulb, Activity, CheckCircle2, Rocket, Percent, IndianRupee,
  RefreshCw, ShieldAlert, CalendarDays,
} from 'lucide-react'
import {
  PERIOD_OPTIONS, KpiTile, SectionPanel, ErrorState, formatINR, formatPct, formatNum,
  formatTime, formatDays,
} from './ceoUtils'
import CeoHealthScore from './CeoHealthScore'
import CeoTrendChart from './CeoTrendChart'
import CeoPipeline from './CeoPipeline'
import CeoDepartments from './CeoDepartments'
import CeoDrillDown from './CeoDrillDown'
import { AttentionPanel, StrategicPanel, ActivityPanel } from './CeoInsights'
import usePageTitle from '../../hooks/usePageTitle';
import { BusinessImpactPanel, ParticipationPanel } from './CeoImpact'

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const is403 = (err) => err?.response?.status === 403 || err?.status === 403

export default function CeoDashboardPage() {
  usePageTitle('CEO Dashboard');
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useSelector(selectCurrentUser)
  const [drillQuery, setDrillQuery] = useState(null)

  const period = searchParams.get('period') || '90d'
  const department = searchParams.get('department') || ''

  const drill = useCallback((query) => setDrillQuery(query), [])
  const closeDrill = useCallback(() => setDrillQuery(null), [])

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value && value !== 'all') next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
  }

  // ── 4 aggregated queries (§22 — no per-card requests) ──
  const overviewQ = useQuery({
    queryKey: ['ceo-overview', period, department],
    queryFn: () => ceoAPI.overview({ period, department: department || undefined }),
    select: (r) => r.data.data,
    staleTime: 60_000,
  })
  const trendQ = useQuery({
    queryKey: ['ceo-trends', period, department],
    queryFn: () => ceoAPI.trends({ range: period, department: department || undefined }),
    select: (r) => r.data.data,
    staleTime: 60_000,
  })
  const pipelineQ = useQuery({
    queryKey: ['ceo-pipeline'],
    queryFn: () => ceoAPI.pipeline(),
    select: (r) => r.data.data,
    staleTime: 60_000,
  })
  const insightsQ = useQuery({
    queryKey: ['ceo-insights'],
    queryFn: () => ceoAPI.insights(),
    select: (r) => r.data.data,
    staleTime: 60_000,
  })

  const queries = [overviewQ, trendQ, pipelineQ, insightsQ]
  const refreshAll = () => queries.forEach((q) => q.refetch())

  // ── Access denied (§24) — backend returned 403 for a non-CEO token ──
  const denied = queries.some((q) => q.isError && is403(q.error))
  if (denied) {
    return (
      <div className="page-enter max-w-[560px] mx-auto mt-16 text-center">
        <div className="glass rounded-2xl p-8">
          <ShieldAlert className="w-10 h-10 text-warning mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-heading text-lg text-theme-text">Executive access required</h1>
          <p className="text-sm text-theme-text0 mt-2 leading-relaxed">
            The CEO Dashboard is restricted to the C-Suite role on the server.
            Ask an administrator to grant the <code className="px-1.5 py-0.5 rounded bg-theme-surface text-xs">ceo</code>{' '}
            role to your account.
          </p>
        </div>
      </div>
    )
  }

  const overview = overviewQ.data
  const kpis = overview?.kpis
  const defs = overview?.definitions || {}
  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label || 'Selected period'
  const anyLoading = queries.some((q) => q.isLoading)
  const lastUpdated = [overview, trendQ.data, pipelineQ.data, insightsQ.data]
    .map((d) => d?.generatedAt)
    .filter(Boolean)
    .sort()
    .pop()

  const firstName = (user?.name || 'there').split(' ')[0]
  const deptOptions = [
    ...new Set((trendQ.data?.departments || []).map((d) => d.department).concat(department ? [department] : [])),
  ]

  // Drill-down launcher (§19)

  return (
    <div className="page-enter max-w-[1400px] mx-auto flex flex-col gap-6 pb-10">
      {/* ── Executive header ── */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 order-1 md:order-none">
        <div>
          <p className="text-label text-theme-accent">Innovation Command Center</p>
          <h1 className="text-display text-theme-text mt-1">
            {greeting()}, {firstName}
          </h1>
          <p className="text-sm text-theme-text0 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-medium text-theme-text">
              {user?.name} · {user?.designation || 'Chief Executive Officer'}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--primary)', background: 'var(--primary-light)' }} role="status">
              {ROLES.CEO}
            </span>
          </p>
        </div>

        {/* Global filters (URL-driven) */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="ceo-period" className="text-label block mb-1.5">Period</label>
            <select
              id="ceo-period"
              className="input-base !w-auto !text-sm"
              value={period}
              onChange={(e) => setParam('period', e.target.value)}
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ceo-department" className="text-label block mb-1.5">Department</label>
            <select
              id="ceo-department"
              className="input-base !w-auto !text-sm"
              value={department}
              onChange={(e) => setParam('department', e.target.value)}
              disabled={trendQ.isLoading}
            >
              <option value="">All departments</option>
              {deptOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* ── L1: Executive KPIs (drill-down tiles) ── */}
      <div
        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 order-2 md:order-none"
        role="group"
        aria-label="Executive KPIs"
      >
        <KpiTile
          icon={Lightbulb} label="Total Ideas" color="var(--primary)" delay={0}
          loading={overviewQ.isLoading}
          value={formatNum(kpis?.totalIdeas)}
          sub={`${periodLabel} · non-draft`}
          definition={defs.totalIdeas}
          onClick={() => drill({ title: 'All Ideas', note: `${periodLabel}${department ? ` · ${department}` : ''}`, params: { status: undefined, limit: 50, department: department || undefined } })}
        />
        <KpiTile
          icon={Activity} label="Active Ideas" color="var(--info-text)" delay={50}
          loading={overviewQ.isLoading}
          value={formatNum(kpis?.activeIdeas)}
          sub="currently in workflow"
          definition={defs.activeIdeas}
          onClick={() => drill({ title: 'Active Ideas', note: 'Currently moving through the workflow', params: { status: IDEA_STATUS_GROUPS.ACTIVE.join(','), limit: 50, department: department || undefined } })}
        />
        <KpiTile
          icon={CheckCircle2} label="Approved" color="var(--purple-text)" delay={100}
          loading={overviewQ.isLoading}
          value={formatNum(kpis?.approvedIdeas)}
          sub={`${formatPct(kpis?.approvalRate)} of ideas approved`}
          definition={defs.approvalRate}
          onClick={() => drill({ title: 'Approved Ideas', note: 'At or past committee approval', params: { status: IDEA_STATUS_GROUPS.APPROVED.join(','), limit: 50, department: department || undefined } })}
        />
        <KpiTile
          icon={Rocket} label="Implemented" color="var(--warning-text)" delay={150}
          loading={overviewQ.isLoading}
          value={formatNum(kpis?.implementedIdeas)}
          sub={`of ${formatNum(kpis?.approvedIdeas)} approved`}
          definition={defs.implementedIdeas}
          onClick={() => drill({ title: 'Implemented Ideas', note: 'Implementation completed or beyond', params: { status: IDEA_STATUS_GROUPS.IMPLEMENTED.join(','), limit: 50, department: department || undefined } })}
        />
        <KpiTile
          icon={Percent} label="Implementation Rate" color="var(--primary)" delay={200}
          loading={overviewQ.isLoading}
          value={formatPct(kpis?.implementationRate)}
          sub="implemented ÷ approved"
          definition={defs.implementationRate}
          onClick={() => drill({ title: 'Approved Ideas (rate basis)', note: 'Implementation rate is computed over this cohort', params: { status: IDEA_STATUS_GROUPS.APPROVED.join(','), limit: 50, department: department || undefined } })}
        />
        <KpiTile
          icon={IndianRupee} label="Realized Value" color="var(--success-text)" delay={250}
          loading={overviewQ.isLoading}
          value={formatINR(overview?.businessImpact?.realizedINR)}
          sub={
            overview?.businessImpact?.ideasWithEstimate
              ? `est. ${formatINR(overview.businessImpact.potentialINR)} potential · see Business Impact`
              : 'recorded benefits only'
          }
          definition={defs.realizedValue}
          onClick={() => drill({ title: 'Ideas with Realized Value', note: 'Ideas at implementation completion or beyond', params: { status: IDEA_STATUS_GROUPS.IMPLEMENTED.join(','), limit: 50, department: department || undefined } })}
        />
      </div>

      {/* ── L2: Health + Trend ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 order-6 md:order-none">
        <div className="xl:col-span-1">
          {overviewQ.isError ? (
            <SectionPanel id="health-err" title="Innovation Health">
              <ErrorState message="Unable to load the health score." onRetry={overviewQ.refetch} />
            </SectionPanel>
          ) : (
            <CeoHealthScore health={overview?.health} definitions={defs} loading={overviewQ.isLoading} />
          )}
        </div>
        <div className="xl:col-span-2">
          {trendQ.isError ? (
            <SectionPanel id="trend-err" title="Innovation Trend">
              <ErrorState message="Unable to load the trend." onRetry={trendQ.refetch} />
            </SectionPanel>
          ) : (
            <CeoTrendChart trend={trendQ.data} definitions={trendQ.data?.definitions} loading={trendQ.isLoading} onDrill={drill} />
          )}
        </div>
      </div>

      {/* ── L3a: Pipeline ── */}
      <div className="order-4 md:order-none">
        {pipelineQ.isError ? (
          <SectionPanel id="pipeline-err" title="Innovation Pipeline">
            <ErrorState message="Unable to load the pipeline." onRetry={pipelineQ.refetch} />
          </SectionPanel>
        ) : (
          <CeoPipeline pipeline={pipelineQ.data} definitions={pipelineQ.data?.definitions} loading={pipelineQ.isLoading} onDrill={drill} />
        )}
      </div>

      {/* ── L3b: Departments + Business Impact ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 order-7 md:order-none">
        <div className="xl:col-span-2">
          {trendQ.isError ? (
            <SectionPanel id="dept-err" title="Department Performance">
              <ErrorState message="Unable to load department performance." onRetry={trendQ.refetch} />
            </SectionPanel>
          ) : (
            <CeoDepartments
              departments={trendQ.data?.departments || []}
              definitions={trendQ.data?.definitions}
              loading={trendQ.isLoading}
              selectedDept={department}
              onDrill={drill}
            />
          )}
        </div>
        <div className="xl:col-span-1">
          {overviewQ.isError ? (
            <SectionPanel id="impact-err" title="Business Impact">
              <ErrorState message="Unable to load business impact." onRetry={overviewQ.refetch} />
            </SectionPanel>
          ) : (
            <BusinessImpactPanel impact={overview?.businessImpact} definitions={defs} loading={overviewQ.isLoading} />
          )}
        </div>
      </div>

      {/* ── L4a: Strategic + Participation ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 order-5 md:order-none">
        <div className="xl:col-span-2">
          {insightsQ.isError ? (
            <SectionPanel id="strategic-err" title="Strategic Ideas">
              <ErrorState message="Unable to load strategic ideas." onRetry={insightsQ.refetch} />
            </SectionPanel>
          ) : (
            <StrategicPanel insights={insightsQ.data} definitions={insightsQ.data?.definitions} loading={insightsQ.isLoading} />
          )}
        </div>
        <div className="xl:col-span-1">
          {overviewQ.isError ? (
            <SectionPanel id="part-err" title="Employee Participation">
              <ErrorState message="Unable to load participation." onRetry={overviewQ.refetch} />
            </SectionPanel>
          ) : (
            <ParticipationPanel participation={overview?.participation} definitions={defs} loading={overviewQ.isLoading} />
          )}
        </div>
      </div>

      {/* ── L3/L4b: Attention + Activity ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 order-3 md:order-none">
        <div className="xl:col-span-2">
          {insightsQ.isError ? (
            <SectionPanel id="attention-err" title="Requires Executive Attention">
              <ErrorState message="Unable to load attention items." onRetry={insightsQ.refetch} />
            </SectionPanel>
          ) : (
            <AttentionPanel insights={insightsQ.data} definitions={insightsQ.data?.definitions} loading={insightsQ.isLoading} onDrill={drill} />
          )}
        </div>
        <div className="xl:col-span-1">
          {insightsQ.isError ? (
            <SectionPanel id="activity-err" title="Recent Activity">
              <ErrorState message="Unable to load activity." onRetry={insightsQ.refetch} />
            </SectionPanel>
          ) : (
            <ActivityPanel insights={insightsQ.data} definitions={insightsQ.data?.definitions} loading={insightsQ.isLoading} />
          )}
        </div>
      </div>

      {/* ── Footer: freshness (§30) ── */}
      <footer className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-theme-border/50 order-8 md:order-none">
        <p className="text-[11px] text-theme-text0" aria-live="polite">
          Last updated {formatTime(lastUpdated)} · data refreshes every 5 minutes
          {overview?.kpis?.avgProcessingDays != null && (
            <>
              {' · '}avg processing time <b className="text-theme-text">{formatDays(overview.kpis.avgProcessingDays)}</b> (business days)
            </>
          )}
        </p>
        <button
          type="button"
          onClick={refreshAll}
          className="btn btn-secondary btn-sm"
          disabled={anyLoading}
          aria-label="Refresh dashboard data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${anyLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </button>
      </footer>

      {/* ── Drill-down drawer ── */}
      <CeoDrillDown query={drillQuery} onClose={closeDrill} />
    </div>
  )
}
