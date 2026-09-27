/**
 * client/src/features/ceo/CeoDepartments.jsx
 * Department performance (§11) — comparison, not a leaderboard (§12).
 * Desktop: table with inline bars. Mobile: stacked cards (§21).
 * Clicking a row drills into that department's ideas.
 */
import { Building2, ArrowUpRight } from 'lucide-react'
import { SectionPanel, PanelSkeleton, EmptyState, formatINR, formatPct, formatNum, InfoTip } from './ceoUtils'

const Cell = ({ children, className = '' }) => (
  <td className={`px-3 py-3 text-sm ${className}`}>{children}</td>
)

export default function CeoDepartments({ departments = [], definitions = {}, loading, selectedDept, onDrill }) {
  const maxIdeas = Math.max(1, ...departments.map((d) => d.ideas))

  const drill = (d) =>
    onDrill?.({
      title: d.department,
      note: `${d.ideas} ideas · ${formatINR(d.realizedINR)} realized value`,
      params: { department: d.department, status: undefined, limit: 50 },
    })

  return (
    <SectionPanel
      id="departments"
      title="Department Performance"
      icon={Building2}
      hint={definitions.departments}
      className="h-full"
    >
      {loading ? (
        <PanelSkeleton rows={4} />
      ) : departments.length === 0 ? (
        <EmptyState title="No departments have ideas in this period." />
      ) : (
        <>
          {/* ── Desktop: table ── */}
          <div className="hidden md:block overflow-x-auto -mx-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-theme-text0 border-b border-theme-border/60">
                  <th className="px-3 pb-2 font-semibold">Department</th>
                  <th className="px-3 pb-2 font-semibold">Ideas</th>
                  <th className="px-3 pb-2 font-semibold" title="Distinct submitters ÷ active employees">Participation</th>
                  <th className="px-3 pb-2 font-semibold">Approved</th>
                  <th className="px-3 pb-2 font-semibold">Implemented</th>
                  <th className="px-3 pb-2 font-semibold text-right">Realized Value</th>
                  <th className="px-3 pb-2" />
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => {
                  const isSel = selectedDept && d.department === selectedDept
                  return (
                    <tr
                      key={d.department}
                      onClick={() => drill(d)}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') drill(d) }}
                      className={`border-b border-theme-border/40 last:border-0 cursor-pointer transition-colors
                                  hover:bg-theme-surface/60 focus-visible:outline-2 focus-visible:outline-[var(--primary)]
                                  ${isSel ? 'bg-theme-accent/5' : ''}`}
                      aria-label={`${d.department}: ${d.ideas} ideas. Show ideas.`}
                    >
                      <Cell className="font-medium text-theme-text max-w-[180px]">
                        <span className="flex items-center gap-2">
                          <span className="truncate">{d.department}</span>
                          {isSel && <span className="text-[9px] uppercase font-bold text-theme-accent">filter</span>}
                        </span>
                        {d.employees === 0 && (
                          <span className="block text-[10px] text-amber-500/90 mt-0.5" title="No active users are assigned to this department name — participation cannot be computed.">
                            no employees matched
                          </span>
                        )}
                      </Cell>
                      <Cell>
                        <span className="flex items-center gap-2">
                          <span className="font-semibold text-theme-text tabular-nums w-6">{d.ideas}</span>
                          <span className="h-1.5 rounded-full bg-theme-surface overflow-hidden w-20" aria-hidden="true">
                            <span className="block h-full rounded-full bg-[var(--primary)]" style={{ width: `${(d.ideas / maxIdeas) * 100}%` }} />
                          </span>
                        </span>
                      </Cell>
                      <Cell className="tabular-nums">
                        {formatPct(d.participationRate)}
                        <span className="text-[10px] text-theme-text0 ml-1">{formatNum(d.participants)}/{formatNum(d.employees)}</span>
                      </Cell>
                      <Cell className="tabular-nums">
                        {formatNum(d.approved)}<span className="text-[10px] text-theme-text0 ml-1">{formatPct(d.approvalRate)}</span>
                      </Cell>
                      <Cell className="tabular-nums">
                        {formatNum(d.implemented)}<span className="text-[10px] text-theme-text0 ml-1">{formatPct(d.implementationRate)}</span>
                      </Cell>
                      <Cell className="text-right tabular-nums font-medium text-theme-text">{formatINR(d.realizedINR)}</Cell>
                      <Cell className="text-right">
                        <ArrowUpRight className="w-3.5 h-3.5 text-theme-text0 inline opacity-0 group-hover:opacity-100" aria-hidden="true" />
                      </Cell>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile: stacked cards ── */}
          <div className="md:hidden space-y-2.5">
            {departments.map((d) => (
              <button
                key={d.department}
                type="button"
                onClick={() => drill(d)}
                className={`w-full text-left glass rounded-xl p-3.5 border transition-colors
                            ${selectedDept === d.department ? 'border-theme-accent/50' : 'border-theme-border/40'}`}
                aria-label={`${d.department}: ${d.ideas} ideas. Show ideas.`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-theme-text truncate">{d.department}</span>
                  <span className="text-lg font-bold text-theme-text tabular-nums">{d.ideas}</span>
                </div>
                <div className="h-1.5 rounded-full bg-theme-surface overflow-hidden mt-2 mb-2.5" aria-hidden="true">
                  <span className="block h-full rounded-full bg-[var(--primary)]" style={{ width: `${(d.ideas / maxIdeas) * 100}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-theme-text0">
                  <span>Participation: <b className="text-theme-text">{formatPct(d.participationRate)}</b></span>
                  <span>Approved: <b className="text-theme-text">{formatNum(d.approved)}</b></span>
                  <span>Implemented: <b className="text-theme-text">{formatNum(d.implemented)}</b></span>
                  <span>Realized: <b className="text-theme-text">{formatINR(d.realizedINR)}</b></span>
                </div>
              </button>
            ))}
          </div>

          <p className="text-[11px] text-theme-text0 mt-3 flex items-center gap-1.5">
            <InfoTip text={definitions.departments} label="Department metrics" />
            Values reflect ideas created in the selected period · select a row to drill down
          </p>
        </>
      )}
    </SectionPanel>
  )
}
