/**
 * client/src/features/ceo/CeoInsights.jsx
 * Level 3–4 executive panels (§12–13):
 *   - AttentionPanel  — "Requires Executive Attention" (real rule-based items)
 *   - StrategicPanel  — "Strategic & High-Impact Ideas" (value/score signals)
 *   - ActivityPanel   — recent strategic activity from the audit trail
 * Every item links to the idea; nothing here is inferred or fabricated.
 */
import { AlertOctagon, Flame, Bookmark, Activity as ActivityIcon, ArrowUpRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import IdeaStatusBadge from '../../components/IdeaStatusBadge'
import {
  SectionPanel, PanelSkeleton, EmptyState, formatINR, formatDays, InfoTip, humanizeStatus,
} from './ceoUtils'

const SEVERITY = {
  high:   { color: 'var(--error)',   Icon: AlertOctagon },
  medium: { color: 'var(--warning)', Icon: Flame },
}

const ACTION_LABELS = {
  status_change: 'moved status',
  approve: 'approved',
  reject: 'rejected',
  publish: 'published',
  create: 'submitted',
  admin_override: 'admin override',
}

// ── 1. Requires Executive Attention ──────────────────────────────────────────
export function AttentionPanel({ insights, definitions = {}, loading, onDrill }) {
  const items = insights?.attention || []
  const countByType = items.reduce((acc, i) => ({ ...acc, [i.type]: (acc[i.type] || 0) + 1 }), {})

  return (
    <SectionPanel
      id="attention"
      title="Requires Executive Attention"
      icon={AlertOctagon}
      hint={definitions.attention}
      className="h-full"
      action={
        items.length > 0 && (
          <span className="text-[11px] font-semibold px-2 py-1 rounded-md bg-[var(--error)]/10 text-[var(--error)]">
            {items.length} item{items.length === 1 ? '' : 's'}
          </span>
        )
      }
    >
      {loading ? (
        <PanelSkeleton rows={4} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nothing needs your attention right now."
          hint="No SLA breaches, overdue implementations, or stalled approvals exist in the workflow today."
        />
      ) : (
        <ul className="space-y-2.5" aria-label="Attention items">
          {items.map((item, i) => {
            const sev = SEVERITY[item.severity] || SEVERITY.medium
            const Icon = sev.Icon
            return (
              <li key={`${item.ideaId}-${item.type}-${i}`}>
                <div
                  className="rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4"
                  style={{ borderColor: `${sev.color}35`, background: `${sev.color}08` }}
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: sev.color }} aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-theme-text leading-snug">{item.title}</p>
                      <p className="text-xs text-theme-text0 leading-snug mt-0.5">{item.whyItMatters}</p>
                      <p className="text-[11px] text-theme-text0 mt-1 truncate">
                        {item.ideaTitle} · {item.department}
                        {item.owner ? ` · owner: ${item.owner}` : ''}
                        {item.stage ? ` · stage: ${item.stage}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 sm:justify-end">
                    <span
                      className="text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded"
                      style={{ color: sev.color, background: `${sev.color}15` }}
                      title="Age in business days"
                    >
                      {formatDays(item.ageDays)}
                    </span>
                    <Link
                      to={`/ideas/${item.ideaId}`}
                      className="btn btn-secondary btn-sm"
                      aria-label={`View idea: ${item.ideaTitle}`}
                    >
                      View Idea <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {countByType.sla_breach > 0 && (
        <p className="text-[11px] text-theme-text0 mt-3">
          {countByType.sla_breach} SLA breach{countByType.sla_breach === 1 ? '' : 'es'} ·{' '}
          {countByType.implementation_overdue || 0} overdue ·{' '}
          {countByType.awaiting_implementation || 0} awaiting start
        </p>
      )}
    </SectionPanel>
  )
}

// ── 2. Strategic & High-Impact Ideas ────────────────────────────────────────
const SIGNAL_META = {
  realized_value:     { label: 'Realized value', color: 'var(--success)' },
  estimated_value:    { label: 'Est. value',     color: '#818CF8' },
  strong_evaluation:  { label: 'High eval score', color: '#a78bfa' },
  featured:           { label: 'Featured',       color: 'var(--warning)' },
  approved:           { label: 'Approved',       color: '#3b82f6' },
}

export function StrategicPanel({ insights, definitions = {}, loading }) {
  const ideas = insights?.strategic || []

  return (
    <SectionPanel
      id="strategic"
      title="Strategic & High-Impact Ideas"
      icon={Sparkles}
      hint={definitions.strategic}
      className="h-full"
    >
      {loading ? (
        <PanelSkeleton rows={5} />
      ) : ideas.length === 0 ? (
        <EmptyState
          title="No ideas carry an executive signal yet."
          hint="Ideas appear here once they have realized or estimated value, a high evaluator score (≥7/10), a featured flag, or committee approval."
        />
      ) : (
        <ul className="space-y-2">
          {ideas.map((idea) => (
            <li key={idea.ideaId}>
              <Link
                to={`/ideas/${idea.ideaId}`}
                className="block glass glass-hover rounded-xl p-3.5 group"
                aria-label={`Open idea: ${idea.title}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-theme-text group-hover:text-theme-accent transition-colors line-clamp-2">
                    {idea.title}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-theme-text0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" aria-hidden="true" />
                </div>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <IdeaStatusBadge status={idea.status} />
                  <span className="text-[11px] text-theme-text0">
                    {idea.department} · {idea.owner || '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 mt-2.5 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {idea.signals.map((s) => {
                      const meta = SIGNAL_META[s]
                      if (!meta) return null
                      return (
                        <span
                          key={s}
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ color: meta.color, background: `${meta.color}15` }}
                        >
                          {meta.label}
                        </span>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] tabular-nums ml-auto">
                    {idea.estimatedINR != null && (
                      <span className="text-theme-text0" title="Submitter's estimate (not realized)">
                        est <b className="text-theme-text">{formatINR(idea.estimatedINR)}</b>
                      </span>
                    )}
                    {idea.realizedINR > 0 && (
                      <span className="text-theme-text0" title="Realized value recorded in benefits">
                        <b style={{ color: 'var(--success)' }}>{formatINR(idea.realizedINR)}</b> realized
                      </span>
                    )}
                    {idea.avgScore != null && (
                      <span className="text-theme-text0" title={`Average evaluator score across ${idea.evaluators} evaluation(s), out of 10`}>
                        <b className="text-theme-text">{idea.avgScore}</b>/10
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionPanel>
  )
}

// ── 3. Recent Strategic Activity ─────────────────────────────────────────────
const timeAgo = (iso) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function ActivityPanel({ insights, definitions = {}, loading }) {
  const items = insights?.activity || []

  return (
    <SectionPanel
      id="activity"
      title="Recent Activity"
      icon={ActivityIcon}
      hint={definitions.activity}
      className="h-full"
    >
      {loading ? (
        <PanelSkeleton rows={5} />
      ) : items.length === 0 ? (
        <EmptyState title="No recent idea activity." hint="Workflow events on ideas will appear here as they happen." />
      ) : (
        <ol className="relative space-y-4 pl-4" aria-label="Recent idea activity">
          <span className="absolute left-[3px] top-1 bottom-1 w-px bg-theme-border/60" aria-hidden="true" />
          {items.map((item, i) => (
            <li key={`${item.ideaId}-${item.timestamp}-${i}`} className="relative">
              <span
                className="absolute -left-4 top-1.5 w-1.5 h-1.5 rounded-full bg-theme-accent"
                aria-hidden="true"
              />
              <p className="text-xs text-theme-text leading-snug">
                <b className="font-semibold">{item.actor}</b>{' '}
                {ACTION_LABELS[item.action] || item.action}
                {item.newStatus && (
                  <>
                    {' to '}
                    <b className="font-semibold">{humanizeStatus(item.newStatus)}</b>
                  </>
                )}
              </p>
              <Link
                to={`/ideas/${item.ideaId}`}
                className="text-[11px] text-theme-text0 hover:text-theme-accent transition-colors line-clamp-1 inline-block max-w-full"
              >
                {item.ideaTitle} <span className="opacity-70">({item.humanId})</span>
              </Link>
              <span className="text-[10px] text-theme-text0 block mt-0.5" title={new Date(item.timestamp).toLocaleString('en-IN')}>
                {timeAgo(item.timestamp)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </SectionPanel>
  )
}
