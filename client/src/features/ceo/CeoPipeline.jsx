/**
 * client/src/features/ceo/CeoPipeline.jsx
 * Workflow funnel + bottleneck callouts (§10).
 * - Funnel: ideas that ever reached each stage → conversion, waiting queue,
 *   average dwell (business days). Click a stage → drill-down of its queue.
 * - Bottlenecks: server flags stages breaching SLA (or at ≥66% of it) using
 *   real statusHistory timestamps — no guessed urgency.
 */
import { GitMerge, ChevronRight, AlertTriangle, Timer, Undo2, XCircle } from 'lucide-react'
import { SectionPanel, PanelSkeleton, EmptyState, formatDays, formatPct, InfoTip } from './ceoUtils'

export default function CeoPipeline({ pipeline, definitions = {}, loading, onDrill }) {
  const stages = pipeline?.stages || []
  const bottlenecks = (pipeline?.bottlenecks || []).filter((b) => b.isBottleneck)
  const counters = pipeline?.counters

  return (
    <SectionPanel
      id="pipeline"
      title="Innovation Pipeline"
      icon={GitMerge}
      hint={definitions.everReached}
      className="h-full"
    >
      {loading ? (
        <PanelSkeleton rows={5} />
      ) : stages.length === 0 ? (
        <EmptyState title="No pipeline activity yet." />
      ) : (
        <>
          {/* ── Bottleneck callouts (top of section — most decision-critical) ── */}
          {bottlenecks.length > 0 && (
            <div className="space-y-2.5 mb-5" role="alert" aria-label="Pipeline bottlenecks">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-theme-text0 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                Bottlenecks — action required
              </p>
              {bottlenecks.map((b) => {
                const severity = b.breachedCount > 0 ? 'error' : 'warning'
                const color = severity === 'error' ? 'var(--error)' : 'var(--warning)'
                return (
                  <div
                    key={b.key}
                    className="rounded-xl border p-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5"
                    style={{ borderColor: `${color}40`, background: `${color}0A` }}
                  >
                    <span className="text-sm font-semibold text-theme-text flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color }} aria-hidden="true" />
                      {b.label}
                    </span>
                    <span className="text-xs text-theme-text0">
                      {b.waitingCount} waiting · avg {formatDays(b.avgWaitDays)}
                      {' vs '}<span className="font-semibold text-theme-text">{b.slaDays}-day SLA</span>
                    </span>
                    {b.breachedCount > 0 && (
                      <span className="text-xs font-semibold" style={{ color }}>
                        {b.breachedCount} breached
                      </span>
                    )}
                    {b.oldest && (
                      <span className="text-xs text-theme-text0 truncate max-w-[240px]" title={`Oldest: ${b.oldest.title}`}>
                        oldest: {b.oldest.title} · {b.oldest.days}d
                      </span>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm ml-auto"
                      onClick={() =>
                        onDrill?.({
                          title: `Waiting in ${b.label}`,
                          note: `SLA ${b.slaDays} business days · ${b.breachedCount} breached`,
                          params: { status: (b.waitingStatuses || []).join(','), limit: 50 },
                        })
                      }
                    >
                      View {b.waitingCount} {b.waitingCount === 1 ? 'idea' : 'ideas'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Funnel (horizontal on ≥md, vertical stack below) ── */}
          <div className="flex flex-col md:flex-row md:items-stretch gap-2 md:gap-1.5">
            {stages.map((stage, idx) => (
              <div key={stage.key} className="flex md:flex-1 md:items-stretch items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onDrill?.({
                      title: `${stage.label} — current queue`,
                      note: `${stage.waitingNow} waiting · avg wait ${formatDays(stage.avgWaitDays)}`,
                      params: { status: (stage.current || []).join(','), limit: 50 },
                    })
                  }
                  disabled={stage.waitingNow === 0}
                  className="flex-1 min-w-0 rounded-xl border border-theme-border/60 p-3 text-left transition-all
                             enabled:hover:border-theme-accent/50 enabled:hover:bg-theme-surface/50
                             enabled:cursor-pointer disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-[var(--primary)]"
                  aria-label={`${stage.label}: ${stage.everReached} ideas ever reached, ${stage.waitingNow} waiting now. Show waiting ideas.`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-theme-text0 truncate">
                    {stage.label}
                  </p>
                  <p className="text-xl font-bold text-theme-text mt-1 kpi-value">{stage.everReached}</p>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1.5 text-[10px] text-theme-text0">
                    {stage.conversionPct !== null && (
                      <span title={definitions.conversionPct}>{formatPct(stage.conversionPct)} conv</span>
                    )}
                    <span title={definitions.avgWaitDays} className="flex items-center gap-0.5">
                      <Timer className="w-2.5 h-2.5" aria-hidden="true" />
                      {stage.waitingNow} wait · {formatDays(stage.avgWaitDays)}
                    </span>
                  </div>
                  {stage.recentMovements7d > 0 && (
                    <p className="text-[10px] text-theme-accent mt-1 font-medium">
                      +{stage.recentMovements7d} in last 7 days
                    </p>
                  )}
                </button>
                {idx < stages.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-theme-text0 flex-shrink-0 hidden md:block self-center" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>

          {/* ── Side counters + dwell detail ── */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-4 pt-4 border-t border-theme-border/50 text-xs text-theme-text0">
            <span className="flex items-center gap-1.5">
              <GitMerge className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="font-semibold text-theme-text">{counters?.inPipeline ?? '—'}</span> ideas in workflow
            </span>
            <span className="flex items-center gap-1.5" title="Returned to the employee for revision — waits on employee action">
              <Undo2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="font-semibold text-theme-text">{counters?.returnedToEmployee ?? '—'}</span> returned to employees
            </span>
            <span className="flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="font-semibold text-theme-text">{counters?.rejectedTerminal ?? '—'}</span> rejected (terminal)
            </span>
            <span className="ml-auto flex items-center gap-1.5">
              <InfoTip text={definitions.avgDwellDays} label="Average dwell" />
              avg dwell = business days in stage before the next workflow event
            </span>
          </div>
        </>
      )}
    </SectionPanel>
  )
}
