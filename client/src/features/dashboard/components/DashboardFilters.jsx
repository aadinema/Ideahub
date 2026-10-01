/**
 * DashboardFilters — Sticky filter & context control bar for Home Dashboard.
 * Supports Financial Year, Department, and Event filters with quick reset.
 */
import { Calendar, Building2, Trophy, RotateCcw, Filter } from 'lucide-react'

const DEPARTMENTS = [
  'Engineering',
  'Sales',
  'Marketing',
  'Operations',
  'Finance',
  'HR',
]

export default function DashboardFilters({
  filters,
  onChange,
  onReset,
  availableFYs = ['FY2026-27', 'FY2025-26', 'FY2024-25'],
  events = [],
}) {
  const activeCount =
    (filters.department ? 1 : 0) +
    (filters.event ? 1 : 0) +
    (filters.fy && filters.fy !== availableFYs[0] ? 1 : 0)

  return (
    <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-8 bg-surface/85 backdrop-blur-xl border-y border-theme-border/60 transition-all duration-200">
      <div className="max-w-350 mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Filter dropdown cluster */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-theme-text0 uppercase tracking-wider mr-1">
            <Filter className="w-3.5 h-3.5 text-theme-accent" aria-hidden="true" />
            <span className="hidden sm:inline">Filters</span>
          </div>

          {/* FY selector */}
          <div className="relative">
            <label htmlFor="filter-fy" className="sr-only">Financial Year</label>
            <div className="flex items-center bg-surface border border-theme-border rounded-lg px-2.5 py-1.5 shadow-2xs hover:border-theme-border/80 focus-within:ring-2 focus-within:ring-primary/20">
              <Calendar className="w-3.5 h-3.5 text-theme-accent shrink-0 mr-1.5" aria-hidden="true" />
              <select
                id="filter-fy"
                value={filters.fy}
                onChange={(e) => onChange({ ...filters, fy: e.target.value })}
                className="bg-transparent text-xs font-medium text-theme-text border-none focus:outline-none pr-6 cursor-pointer"
              >
                {availableFYs.map((fy) => (
                  <option key={fy} value={fy} className="bg-surface text-theme-text">
                    {fy}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Department selector */}
          <div className="relative">
            <label htmlFor="filter-dept" className="sr-only">Department</label>
            <div className="flex items-center bg-surface border border-theme-border rounded-lg px-2.5 py-1.5 shadow-2xs hover:border-theme-border/80 focus-within:ring-2 focus-within:ring-primary/20">
              <Building2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mr-1.5" aria-hidden="true" />
              <select
                id="filter-dept"
                value={filters.department || ''}
                onChange={(e) => onChange({ ...filters, department: e.target.value })}
                className="bg-transparent text-xs font-medium text-theme-text border-none focus:outline-none pr-6 cursor-pointer"
              >
                <option value="" className="bg-surface text-theme-text">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept} className="bg-surface text-theme-text">
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Event selector */}
          <div className="relative">
            <label htmlFor="filter-event" className="sr-only">Ideathon Event</label>
            <div className="flex items-center bg-surface border border-theme-border rounded-lg px-2.5 py-1.5 shadow-2xs hover:border-theme-border/80 focus-within:ring-2 focus-within:ring-primary/20">
              <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0 mr-1.5" aria-hidden="true" />
              <select
                id="filter-event"
                value={filters.event || ''}
                onChange={(e) => onChange({ ...filters, event: e.target.value })}
                className="bg-transparent text-xs font-medium text-theme-text border-none focus:outline-none pr-6 cursor-pointer max-w-40 truncate"
              >
                <option value="" className="bg-surface text-theme-text">All Events</option>
                {events?.map((ev) => (
                  <option key={ev._id} value={ev._id} className="bg-surface text-theme-text">
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right: Active counter & Reset button */}
        {activeCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
              {activeCount} active {activeCount === 1 ? 'filter' : 'filters'}
            </span>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 text-xs font-medium text-theme-text0 hover:text-theme-text px-2 py-1 rounded-md hover:bg-theme-border/40 transition-colors"
            >
              <RotateCcw className="w-3 h-3" aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
