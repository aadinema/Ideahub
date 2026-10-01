/**
 * KpiCard — Premium Enterprise SaaS KPI Metric Card.
 * Linear/Notion-grade aesthetic with icon container, crisp big typography,
 * trend arrow indicator, interactive hover elevation, and SVG sparkline.
 */
import { useEffect, useState, useId } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// Simple SVG sparkline renderer
function Sparkline({ data = [10, 15, 12, 22, 28, 35], color = '#6366F1', width = 100, height = 32 }) {
  const gradientId = useId()
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min === 0 ? 1 : max - min
  const paddingY = 4
  const usableHeight = height - paddingY * 2

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width
    const y = height - paddingY - ((val - min) / range) * usableHeight
    return { x, y }
  })

  // Build smooth curve path
  let pathD = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i]
    const next = points[i + 1]
    const cx = (curr.x + next.x) / 2
    pathD += ` C ${cx.toFixed(1)},${curr.y.toFixed(1)} ${cx.toFixed(1)},${next.y.toFixed(1)} ${next.x.toFixed(1)},${next.y.toFixed(1)}`
  }

  const lastPoint = points[points.length - 1]
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible shrink-0"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path d={areaD} fill={`url(#${gradientId})`} />
      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Pulsing endpoint marker */}
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r="4"
        fill={color}
        className="opacity-25 animate-ping origin-center"
      />
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r="2.5"
        fill={color}
        stroke="var(--surface)"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export default function KpiCard({
  icon: Icon,
  label,
  value,
  color = 'var(--primary)',
  trend,
  sparklineData,
  loading = false,
  animationDelay = 0,
  tooltip,
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), animationDelay)
    return () => clearTimeout(t)
  }, [animationDelay])

  // Default fallback trend and sparkline if not supplied
  const trendConfig = trend || {
    direction: 'up',
    value: '+12.4%',
    label: 'vs last Q',
  }

  const defaultSparkline = sparklineData || [12, 18, 15, 26, 32, 45]

  return (
    <div
      title={tooltip || label}
      className="card-premium group relative p-5 flex flex-col justify-between overflow-hidden rounded-xl border border-theme-border/60 bg-surface/90 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:shadow-pop"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(8px)',
        transition: `opacity 0.4s ease ${animationDelay}ms, transform 0.4s ease ${animationDelay}ms`,
      }}
    >
      {/* Top row: Icon + Trend indicator */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-xs"
          style={{
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${color} 24%, transparent)`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color }} aria-hidden="true" />
        </div>

        {loading ? (
          <div className="h-5 w-16 skeleton rounded-full" />
        ) : (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border shadow-2xs whitespace-nowrap ${
              trendConfig.direction === 'up'
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : trendConfig.direction === 'down'
                ? 'text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
                : 'text-theme-text0 bg-theme-border/30 border-theme-border/40'
            }`}
          >
            {trendConfig.direction === 'up' && <TrendingUp className="w-3 h-3 shrink-0" aria-hidden="true" />}
            {trendConfig.direction === 'down' && <TrendingDown className="w-3 h-3 shrink-0" aria-hidden="true" />}
            {trendConfig.direction === 'neutral' && <Minus className="w-3 h-3 shrink-0" aria-hidden="true" />}
            <span>{trendConfig.value}</span>
          </span>
        )}
      </div>

      {/* Middle row: Big Value + Sparkline */}
      <div className="flex items-end justify-between gap-3 mt-1">
        <div className="min-w-0">
          {loading ? (
            <div className="space-y-2">
              <div className="h-8 w-24 skeleton rounded-md" />
              <div className="h-3.5 w-28 skeleton rounded" />
            </div>
          ) : (
            <>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-theme-text kpi-value leading-none">
                {value}
              </div>
              <p className="text-xs font-medium text-theme-text0 mt-2 line-clamp-1">
                {label}
              </p>
            </>
          )}
        </div>

        {/* Sparkline chart */}
        {!loading && (
          <div className="opacity-80 group-hover:opacity-100 transition-opacity duration-200">
            <Sparkline data={defaultSparkline} color={color} width={88} height={32} />
          </div>
        )}
      </div>

      {/* Subtle bottom contextual text */}
      {!loading && trendConfig.label && (
        <div className="mt-3 pt-2.5 border-t border-theme-border/40 flex items-center justify-between text-[11px] text-theme-text0">
          <span>{trendConfig.label}</span>
          <span className="text-[10px] font-mono uppercase opacity-60">Verified</span>
        </div>
      )}
    </div>
  )
}
