/**
 * client/src/features/ceo/CeoHealthScore.jsx
 * Executive Innovation Health — composite score with its 5 documented
 * dimensions (§8). The formula and weights are sent by the server
 * (`definitions`), so tooltips always show the real calculation.
 */
import { Activity } from 'lucide-react'
import { SectionPanel, PanelSkeleton, EmptyState, InfoTip, healthBand } from './ceoUtils'

const DIMENSION_LABELS = {
  generation:     'Idea Generation',
  participation:  'Participation',
  evaluation:     'Evaluation Efficiency',
  implementation: 'Implementation',
  impact:         'Business Impact',
}

const DIMENSION_HINT_KEYS = {
  generation:     'healthGeneration',
  participation:  'healthParticipation',
  evaluation:     'healthEvaluation',
  implementation: 'healthImplementation',
  impact:         'healthImpact',
}

export default function CeoHealthScore({ health, definitions = {}, loading }) {
  const score = health?.score
  const band = healthBand(score)

  return (
    <SectionPanel
      id="health"
      title="Innovation Health"
      icon={Activity}
      hint={definitions.innovationHealth}
      className="h-full"
    >
      {loading ? (
        <PanelSkeleton rows={5} />
      ) : score === null || score === undefined ? (
        <EmptyState
          title="Not enough data to compute a health score."
          hint="The score appears once ideas start moving through the workflow with measurable participation, evaluation, and implementation activity."
        />
      ) : (
        <>
          {/* Score */}
          <div className="flex items-end gap-3 mb-5">
            <span className="text-4xl font-bold text-theme-text kpi-value" style={{ color: band.color }}>
              {score}
            </span>
            <span className="text-sm text-theme-text0 mb-1">/ 100</span>
            <span
              className="ml-auto text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md"
              style={{ color: band.color, background: band.tint }}
            >
              {band.label}
            </span>
          </div>

          {/* Dimensions */}
          <div className="space-y-3.5" role="list" aria-label="Health score dimensions">
            {health.dimensions?.map((dim) => {
              const label = DIMENSION_LABELS[dim.key] || dim.key
              const hint = definitions[DIMENSION_HINT_KEYS[dim.key]]
              const hasValue = dim.value !== null && dim.value !== undefined
              return (
                <div key={dim.key} role="listitem">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-theme-text flex items-center gap-1.5">
                      {label}
                      <InfoTip text={hint} label={label} />
                    </span>
                    <span className="text-xs font-semibold text-theme-text">
                      {hasValue ? dim.value : '—'}
                      <span className="text-theme-text0 font-normal ml-1.5" title={`Weight ${Math.round(dim.weight * 100)}% in the composite score`}>
                        {Math.round(dim.weight * 100)}% wt
                      </span>
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full bg-theme-surface overflow-hidden"
                    role="progressbar"
                    aria-valuenow={hasValue ? dim.value : undefined}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${label}: ${hasValue ? dim.value : 'no data'}`}
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-700 ease-out"
                      style={{
                        width: hasValue ? `${dim.value}%` : '0%',
                        background: 'var(--primary)',
                        opacity: hasValue ? 1 : 0,
                      }}
                    />
                  </div>
                  {!hasValue && (
                    <p className="text-[11px] text-theme-text0 mt-0.5">No data for this dimension yet</p>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </SectionPanel>
  )
}
