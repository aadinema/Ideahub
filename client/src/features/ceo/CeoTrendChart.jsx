/**
 * client/src/features/ceo/CeoTrendChart.jsx
 * Innovation trend over time — submitted / approved / implemented milestones
 * (§9). Uses the existing Recharts stack with theme design tokens so it works
 * in light and dark mode. Animation is disabled for reduced-motion users (§29).
 */
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { SectionPanel, PanelSkeleton, EmptyState, formatBucketLabel, usePrefersReducedMotion } from './ceoUtils'

// Theme-token tooltip (unlike ReportsPage's legacy hardcoded cream, this
// follows --surface/--border/--text tokens → correct in light & dark mode).
const TOOLTIP_STYLE = {
  backgroundColor: 'var(--surface)',
  borderColor: 'var(--border)',
  borderRadius: '12px',
  fontSize: '12px',
  color: 'var(--text-primary)',
}

const SERIES = [
  { key: 'submitted',  label: 'Submitted',  color: 'var(--color-theme-accent-hover)' },
  { key: 'approved',   label: 'Approved',   color: 'var(--success)' },
  { key: 'implemented', label: 'Implemented', color: 'var(--warning)' },
]

const ChartTooltip = ({ active, payload, label, granularity }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={TOOLTIP_STYLE} className="shadow-lg border px-3 py-2">
      <p className="font-semibold mb-1">{formatBucketLabel(label, granularity)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color || p.stroke }} />
          <span className="opacity-70">{p.name}:</span>
          <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function CeoTrendChart({ trend, definitions = {}, loading, onDrill }) {
  const reducedMotion = usePrefersReducedMotion()
  const series = trend?.series || []
  const sums = SERIES.reduce(
    (acc, s) => ({ ...acc, [s.key]: series.reduce((a, b) => a + (b[s.key] || 0), 0) }),
    {}
  )
  const hasData = sums.submitted + sums.approved + sums.implemented > 0

  const granularity = trend?.granularity || 'day'

  return (
    <SectionPanel
      id="trend"
      title="Innovation Trend"
      icon={TrendingUp}
      hint={definitions.series}
      className="h-full"
      action={
        <div className="hidden sm:flex items-center gap-3" aria-hidden="true">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-[11px] text-theme-text0">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label} <span className="font-semibold text-theme-text">{sums[s.key]}</span>
            </span>
          ))}
        </div>
      }
    >
      {loading ? (
        <PanelSkeleton rows={4} />
      ) : !hasData ? (
        <EmptyState
          title="No milestones recorded in this period."
          hint="Ideas move through the workflow over time — widen the period filter to see earlier activity."
        />
      ) : (
        <>
          {/* Mobile legend (desktop legend lives in the header) */}
          <div className="flex sm:hidden items-center gap-3 mb-3" aria-hidden="true">
            {SERIES.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5 text-[11px] text-theme-text0">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
                {s.label} <span className="font-semibold text-theme-text">{sums[s.key]}</span>
              </span>
            ))}
          </div>

          <div className="h-[260px] md:h-[300px]" role="img"
            aria-label={`Trend chart: ${sums.submitted} submitted, ${sums.approved} approved, ${sums.implemented} implemented milestones in the selected period.`}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSubmitted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="bucket"
                  tickFormatter={(b) => formatBucketLabel(b, granularity)}
                  stroke="var(--text-muted)"
                  fontSize={11}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip
                  content={<ChartTooltip granularity={granularity} />}
                  cursor={{ stroke: 'var(--border)', strokeDasharray: '3 3' }}
                />
                <Area
                  type="monotone"
                  dataKey="submitted"
                  name="Submitted"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#gradSubmitted)"
                  isAnimationActive={!reducedMotion}
                />
                <Line
                  type="monotone"
                  dataKey="approved"
                  name="Approved"
                  stroke="var(--success)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={!reducedMotion}
                />
                <Line
                  type="monotone"
                  dataKey="implemented"
                  name="Implemented"
                  stroke="var(--warning)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={!reducedMotion}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-theme-text0 mt-3">
            Milestone dates come from each idea's workflow history · granularity: {granularity}
            {onDrill && (
              <>
                {' · '}
                <button
                  type="button"
                  onClick={() => onDrill({ title: 'Ideas in this period', params: { limit: 50 } })}
                  className="underline hover:text-theme-accent transition-colors"
                >
                  browse ideas
                </button>
              </>
            )}
          </p>
        </>
      )}
    </SectionPanel>
  )
}
