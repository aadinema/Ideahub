/** KPI metric card with icon, animated value, and loading skeleton */
import { useEffect, useState } from 'react'

export default function KpiCard({ icon: Icon, label, value, color, loading, animationDelay = 0 }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), animationDelay)
    return () => clearTimeout(t)
  }, [animationDelay])

  return (
    <div
      className="glass rounded-xl p-4 flex flex-col gap-3 transition-all duration-300 hover:border-white/10"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(8px)', transition: `opacity 0.5s ease ${animationDelay}ms, transform 0.5s ease ${animationDelay}ms` }}
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-7 w-20 bg-theme-surface animate-pulse rounded" />
          <div className="h-3 w-24 bg-theme-surface animate-pulse rounded" />
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold text-theme-text kpi-value" style={{ color }}>
            {value}
          </div>
          <p className="text-xs text-theme-text0 leading-tight">{label}</p>
        </>
      )}
    </div>
  )
}
