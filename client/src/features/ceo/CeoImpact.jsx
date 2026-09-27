/**
 * client/src/features/ceo/CeoImpact.jsx
 * Level 2–3 panels (§14, §16):
 *   - BusinessImpactPanel — Estimated (potential) vs Realized value, with the
 *     estimated/realized distinction always explicit (§25: never imply one
 *     equals the other).
 *   - ParticipationPanel  — contributor counts and rate with plain labels.
 */
import { BadgeIndianRupee, Users } from 'lucide-react'
import { SectionPanel, PanelSkeleton, EmptyState, formatINR, formatNum, formatPct, InfoTip } from './ceoUtils'

export function BusinessImpactPanel({ impact, definitions = {}, loading }) {
  const hasEstimates = (impact?.ideasWithEstimate ?? 0) > 0
  const rows = [
    {
      key: 'potential',
      label: 'Estimated (potential)',
      value: hasEstimates ? impact.potentialINR : null,
      definition: definitions.potentialValue,
      hint: 'Submitter estimates across ideas in period',
      color: 'var(--color-theme-accent-hover)',
    },
    {
      key: 'approved',
      label: 'Estimated — approved ideas',
      value: hasEstimates ? impact.approvedINR : null,
      definition: definitions.approvedValue,
      hint: 'Estimates on ideas that passed committee approval',
      color: 'var(--purple-hover)',
    },
    {
      key: 'realized',
      label: 'Realized (recorded benefits)',
      value: impact?.realizedINR ?? null,
      definition: definitions.realizedValue,
      hint: 'Cost savings + revenue increase actually recorded',
      color: 'var(--success)',
    },
  ]
  const maxVal = Math.max(1, ...rows.map((r) => r.value || 0))
  const noData = !impact || (impact.realizedINR === 0 && !hasEstimates && impact.benefitRecords === 0)

  return (
    <SectionPanel
      id="impact"
      title="Business Impact"
      icon={BadgeIndianRupee}
      hint={definitions.realizedValue}
      className="h-full"
    >
      {loading ? (
        <PanelSkeleton rows={3} />
      ) : noData ? (
        <EmptyState
          title="No value recorded yet."
          hint="Estimated values appear once submitters estimate business value on their ideas; realized values appear when benefits are recorded after implementation."
        />
      ) : (
        <>
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.key}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium text-theme-text flex items-center gap-1.5">
                    {row.label}
                    <InfoTip text={row.definition} label={row.label} />
                  </span>
                  <span className="text-sm font-bold text-theme-text tabular-nums">
                    {row.value === null ? '—' : formatINR(row.value)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-theme-surface overflow-hidden" aria-hidden="true">
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{
                      width: row.value ? `${(row.value / maxVal) * 100}%` : '0%',
                      background: row.color,
                      opacity: row.value ? 1 : 0.3,
                    }}
                  />
                </div>
                <p className="text-[11px] text-theme-text0 mt-0.5">{row.hint}</p>
              </div>
            ))}
          </div>

          {/* Endorsed vs pending realized value */}
          {impact.realizedINR > 0 && (
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-theme-border/50 text-[11px] text-theme-text0">
              <span title="Realized value endorsed by finance/committee">
                endorsed <b style={{ color: 'var(--success)' }} className="text-theme-text">{formatINR(impact.realizedEndorsedINR)}</b>
              </span>
              <span title="Realized value recorded but not yet endorsed">
                pending <b className="text-theme-text">{formatINR(impact.realizedPendingINR)}</b>
              </span>
              <span className="ml-auto">{impact.benefitRecords} benefit record{impact.benefitRecords === 1 ? '' : 's'}</span>
            </div>
          )}

          {/* Transparency notes (§14, §25) */}
          <p className="text-[11px] leading-relaxed text-theme-text0 mt-3 p-2.5 rounded-lg bg-theme-surface/60">
            {hasEstimates ? (
              <>
                <b className="text-theme-text">Estimated ≠ Realized.</b> Estimated values are submitter
                guesses for ideas in period ({impact.ideasWithEstimate} of them); realized values are
                recorded after implementation ({impact.ideasWithBenefit} idea
                {impact.ideasWithBenefit === 1 ? '' : 's'} with benefits).
              </>
            ) : (
              <>
                Estimated value has not been submitted on ideas in this period — only realized
                benefits are shown. <b className="text-theme-text">Nothing is estimated or inferred here.</b>
              </>
            )}
          </p>
        </>
      )}
    </SectionPanel>
  )
}

export function ParticipationPanel({ participation, definitions = {}, loading }) {
  const p = participation
  const rate = p?.participationRate

  return (
    <SectionPanel
      id="participation"
      title="Employee Participation"
      icon={Users}
      hint={definitions.participationRate}
      className="h-full"
    >
      {loading ? (
        <PanelSkeleton rows={3} />
      ) : !p || p.eligibleEmployees === 0 ? (
        <EmptyState title="No active employees found." hint="Participation appears once employees exist and submit ideas." />
      ) : (
        <>
          {/* Rate headline */}
          <div className="flex items-end gap-3 mb-4">
            <span className="text-3xl font-bold text-theme-text kpi-value">{formatPct(rate)}</span>
            <span className="text-xs text-theme-text0 mb-1">
              {formatNum(p.participants)} of {formatNum(p.eligibleEmployees)} employees shared an idea
            </span>
          </div>

          <div
            className="h-2 rounded-full bg-theme-surface overflow-hidden mb-4"
            role="progressbar"
            aria-valuenow={rate ?? undefined}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Participation rate: ${formatPct(rate)}`}
          >
            <div
              className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-700 ease-out"
              style={{ width: `${rate ?? 0}%` }}
            />
          </div>

          <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
            <div className="glass rounded-lg p-2.5">
              <dt className="text-[11px] uppercase tracking-wider text-theme-text0">First-time contributors</dt>
              <dd className="text-base font-bold text-theme-text mt-0.5">{formatNum(p.firstTimeContributors)}</dd>
              <p className="text-[11px] text-theme-text0">no ideas before this period</p>
            </div>
            <div className="glass rounded-lg p-2.5">
              <dt className="text-[11px] uppercase tracking-wider text-theme-text0">Repeat contributors</dt>
              <dd className="text-base font-bold text-theme-text mt-0.5">{formatNum(p.repeatContributors)}</dd>
              <p className="text-[11px] text-theme-text0">2+ ideas this period</p>
            </div>
            <div className="glass rounded-lg p-2.5">
              <dt className="text-[11px] uppercase tracking-wider text-theme-text0">Ideas per employee</dt>
              <dd className="text-base font-bold text-theme-text mt-0.5">{formatNum(p.ideasPerEmployee)}</dd>
            </div>
            <div className="glass rounded-lg p-2.5">
              <dt className="text-[11px] uppercase tracking-wider text-theme-text0 flex items-center gap-1">
                Active employees <InfoTip text="Users with isActive = true in IdeaHub." label="Eligible employees" />
              </dt>
              <dd className="text-base font-bold text-theme-text mt-0.5">{formatNum(p.eligibleEmployees)}</dd>
            </div>
          </dl>
        </>
      )}
    </SectionPanel>
  )
}
