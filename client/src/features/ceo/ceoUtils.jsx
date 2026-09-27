/**
 * client/src/features/ceo/ceoUtils.jsx
 * Shared formatting helpers, filter config, and small UI atoms for the
 * CEO dashboard. All formatting follows the existing IdeaHub conventions
 * (₹ abbreviation from DashboardPage, theme tokens from index.css).
 */
import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { IDEA_STATUS_GROUPS } from '@shared/constants'
import SharedEmptyState from '../../components/EmptyState'
import SharedErrorState from '../../components/ErrorState'

// ── Global filters (URL-driven, same approach as IdeaFormPage's eventId) ──
export const PERIOD_OPTIONS = [
  { value: '7d',   label: 'Last 7 Days' },
  { value: '30d',  label: 'Last 30 Days' },
  { value: '90d',  label: 'Last 90 Days' },
  { value: '180d', label: 'Last 6 Months' },
  { value: '365d', label: 'Last 1 Year' },
  { value: 'all',  label: 'All Time' },
]

// ── Formatting (mirrors DashboardPage.formatValue) ──
export const formatINR = (value) => {
  if (value === null || value === undefined) return '—'
  const n = Number(value)
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} L`
  if (n === 0)       return '₹0'
  return `₹${n.toLocaleString('en-IN')}`
}

export const formatPct = (v) => (v === null || v === undefined ? '—' : `${v}%`)
export const formatNum = (v) =>
  v === null || v === undefined ? '—' : Number(v).toLocaleString('en-IN')
export const formatDays = (v) => (v === null || v === undefined ? '—' : `${v} d`)

export const formatTime = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export const formatBucketLabel = (bucket, granularity) => {
  const d = new Date(`${String(bucket).slice(0, 10)}T00:00:00`)
  if (granularity === 'month') return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
  if (granularity === 'week')  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export const humanizeStatus = (status) =>
  (status || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

// ── Drill-down groups — statuses behind each KPI / stage click ──
// (Built from the shared source of truth so lists always match the metrics.)
export const DRILL_GROUPS = {
  total:      { title: 'All Ideas',            params: { status: IDEA_STATUS_GROUPS.NON_DRAFT.join(',') } },
  active:     { title: 'Active Ideas',         params: { status: IDEA_STATUS_GROUPS.ACTIVE.join(',') } },
  approved:   { title: 'Approved Ideas',       params: { status: IDEA_STATUS_GROUPS.APPROVED.join(',') } },
  implemented:{ title: 'Implemented Ideas',    params: { status: IDEA_STATUS_GROUPS.IMPLEMENTED.join(',') } },
}

// ── Reduced motion (§29) ──
export const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

// ── Health score display bands (display labels only — not part of the score) ──
// `color` is the AA-safe text token; `tint` is a pre-mixed background so the
// pill does not rely on hex-alpha string concatenation (which breaks on var()).
export const healthBand = (score) => {
  if (score === null || score === undefined)
    return { label: 'No data yet', color: 'var(--text-secondary)', tint: 'var(--primary-light)' }
  if (score >= 90)
    return { label: 'Exceptional', color: 'var(--success-text)', tint: 'color-mix(in srgb, var(--success-text) 15%, transparent)' }
  if (score >= 70)
    return { label: 'Healthy', color: 'var(--primary)', tint: 'var(--primary-light)' }
  if (score >= 50)
    return { label: 'Developing', color: 'var(--warning-text)', tint: 'color-mix(in srgb, var(--warning-text) 15%, transparent)' }
  return { label: 'Needs attention', color: 'var(--error-text)', tint: 'color-mix(in srgb, var(--error-text) 15%, transparent)' }
}

// ── UI atoms ──

/** Small info affordance carrying a "calculated as" definition (§20, §31). */
export function InfoTip({ text, label }) {
  if (!text) return null
  return (
    <span
      className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-theme-border text-theme-text0 hover:text-theme-accent hover:border-theme-accent/50 transition-colors cursor-help flex-shrink-0"
      title={text}
      aria-label={label ? `${label}: ${text}` : text}
      role="img"
    >
      <Info className="w-2.5 h-2.5" />
    </span>
  )
}

/** Compact KPI tile — metric, value, definition, optional drill-down. */
export function KpiTile({ icon: Icon, label, value, sub, color, definition, loading, onClick, delay = 0 }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-theme-text0 leading-tight">
          {label}
        </span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} aria-hidden="true" />
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-7 w-20 skeleton rounded" />
          <div className="h-3 w-24 skeleton rounded" />
        </div>
      ) : (
        <>
          <div className="text-[1.6rem] leading-none font-bold text-theme-text kpi-value" style={{ color }}>
            {value}
          </div>
          <div className="flex items-start justify-between gap-2">
            {sub ? (
              <p className="text-[11px] text-theme-text0 leading-snug">{sub}</p>
            ) : (
              <span />
            )}
            <InfoTip text={definition} label={label} />
          </div>
        </>
      )}
    </>
  )

  const cls =
    'glass rounded-xl p-4 flex flex-col gap-2.5 transition-all duration-200 ' +
    (onClick ? 'hover:border-theme-accent/40 cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-[var(--primary)]' : '')

  if (onClick) {
    return (
      <button
        type="button"
        className={cls + ' w-full'}
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease, border-color 0.2s' }}
        onClick={onClick}
        aria-label={`${label}: ${value}. Show underlying ideas`}
      >
        {body}
      </button>
    )
  }
  return (
    <div
      className={cls}
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.5s ease' }}
    >
      {body}
    </div>
  )
}

/** Standard dashboard panel: header (icon + title + optional action) + body. */
export function SectionPanel({ id, title, icon: Icon, hint, action, children, className = '' }) {
  return (
    <section aria-labelledby={`${id}-heading`} className={`glass rounded-2xl p-5 md:p-6 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 id={`${id}-heading`} className="text-heading text-sm md:text-base text-theme-text flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-theme-accent flex-shrink-0" aria-hidden="true" />}
          {title}
          {hint && <InfoTip text={hint} label={title} />}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/** Skeleton matching a panel's structure (premium loading state, §26). */
export function PanelSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 skeleton rounded w-2/3" />
            <div className="h-2.5 skeleton rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * CEO-panel Empty/Error states — thin delegations to the shared components
 * (compact variant) so the whole app renders one implementation. Keeps the
 * `{ title, hint }` / `{ message, onRetry }` signatures the CEO panels use.
 */
export function EmptyState({ title, hint }) {
  return <SharedEmptyState compact title={title} message={hint} />
}

export function ErrorState({ message = 'Unable to load this section.', onRetry }) {
  return <SharedErrorState compact title={message} onRetry={onRetry} />
}
