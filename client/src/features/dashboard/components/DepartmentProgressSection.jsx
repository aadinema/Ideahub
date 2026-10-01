/**
 * DepartmentProgressSection — Visualizing Department Target Achievement (FR-01-06).
 * Presents department innovation target progress with sleek progress bars,
 * achievement percentages, and friendly competitive tracking.
 */
import { Building2, Target, Award, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DepartmentProgressSection({ targets = [], loading = false, fy }) {
  if (loading) {
    return (
      <div className="mb-8 p-5 rounded-xl border border-theme-border/60 bg-surface space-y-4">
        <div className="h-5 w-48 skeleton rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg border border-theme-border/40 space-y-2">
              <div className="h-4 w-28 skeleton rounded" />
              <div className="h-2 w-full skeleton rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!targets.length) {
    return null
  }

  // Sort by highest achievement percentage
  const sortedTargets = [...targets].sort((a, b) => (b.percentage || 0) - (a.percentage || 0)).slice(0, 6)

  return (
    <section aria-labelledby="dept-progress-heading" className="mb-8">
      <div className="card-premium p-5 sm:p-6 rounded-xl border border-theme-border/70 bg-surface/90 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="dept-progress-heading" className="text-base font-bold text-theme-text">
                Department Innovation Target Progress
              </h2>
              <p className="text-xs text-theme-text0">
                FY tracking for innovation target goals across operating units
              </p>
            </div>
          </div>

          <Link
            to="/reports"
            className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 self-start sm:self-center transition-colors"
          >
            <span>Full Analytics Report</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTargets.map((t, idx) => {
            const pct = Math.min(Math.round(t.percentage || 0), 100)
            const isCompleted = pct >= 100
            const isClose = pct >= 75

            return (
              <div
                key={`${t.department}-${t.targetType || idx}`}
                className="p-3.5 rounded-lg border border-theme-border/50 bg-background/50 hover:bg-background/80 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {idx === 0 && <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />}
                    <span className="text-xs font-bold text-theme-text truncate">
                      {t.department}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                      isCompleted
                        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15'
                        : isClose
                        ? 'text-primary bg-primary/15'
                        : 'text-theme-text0 bg-theme-border/40'
                    }`}
                  >
                    {t.actual || 0} / {t.targetValue || 0} ({pct}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  className="h-2 w-full bg-theme-border/60 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label={`${t.department} target achievement`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCompleted
                        ? 'bg-emerald-500'
                        : isClose
                        ? 'bg-linear-to-r from-primary to-indigo-500'
                        : 'bg-primary/70'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
