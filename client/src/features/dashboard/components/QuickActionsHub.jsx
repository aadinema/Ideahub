/**
 * QuickActionsHub — Prominent pill-style action cluster for the Home Dashboard.
 * Replaces plain links with rich, interactive action buttons designed to motivate participation.
 */
import { Link } from 'react-router-dom'
import { Plus, Lightbulb, Compass, Calendar, Trophy, Sparkles, ArrowUpRight } from 'lucide-react'

const ACTIONS = [
  {
    to: '/ideas/new',
    id: 'btn-submit-idea-quickaction',
    label: 'Submit New Idea',
    caption: 'Share a process or tech innovation',
    icon: Plus,
    isPrimary: true,
    badge: 'Fast track',
  },
  {
    to: '/ideas',
    id: 'qa-track-ideas',
    label: 'Track My Ideas',
    caption: 'Review approval stages & status',
    icon: Lightbulb,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  {
    to: '/events',
    id: 'qa-join-ideathon',
    label: 'Explore Ideathons',
    caption: 'Join ongoing hackathons & challenges',
    icon: Trophy,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  },
  {
    to: '/gallery',
    id: 'qa-innovation-gallery',
    label: 'Innovation Gallery',
    caption: 'Browse published org solutions',
    icon: Sparkles,
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  },
]

export default function QuickActionsHub() {
  return (
    <section aria-labelledby="quick-actions-heading" className="mb-8">
      <div className="flex items-center justify-between mb-3.5">
        <h2 id="quick-actions-heading" className="text-xs font-bold uppercase tracking-wider text-theme-text0 flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          Quick Actions & Pathways
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {ACTIONS.map((item) => {
          const Icon = item.icon

          if (item.isPrimary) {
            return (
              <Link
                key={item.id}
                to={item.to}
                id={item.id}
                className="group relative overflow-hidden rounded-xl p-4 sm:p-4.5 bg-linear-to-r from-primary to-indigo-600 text-white shadow-card hover:shadow-pop hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
              >
                {/* Glow accent */}
                <div
                  className="pointer-events-none absolute -right-6 -bottom-6 w-24 h-24 bg-white/15 rounded-full blur-xl group-hover:scale-125 transition-transform duration-300"
                  aria-hidden="true"
                />

                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-2xs group-hover:rotate-6 transition-transform">
                    <Icon className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/25">
                    {item.badge}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1 text-sm font-bold text-white group-hover:translate-x-0.5 transition-transform">
                    <span>{item.label}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-80" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-white/80 mt-0.5 line-clamp-1">
                    {item.caption}
                  </p>
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={item.id}
              to={item.to}
              id={item.id}
              className="card-premium group p-4 sm:p-4.5 rounded-xl border border-theme-border/60 bg-surface/90 backdrop-blur-md hover:-translate-y-1 hover:shadow-pop flex flex-col justify-between transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shadow-2xs group-hover:scale-105 transition-transform ${item.color}`}>
                  <Icon className="w-4.5 h-4.5" aria-hidden="true" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-theme-text0 group-hover:text-theme-text group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100" aria-hidden="true" />
              </div>

              <div>
                <span className="text-sm font-bold text-theme-text group-hover:text-primary transition-colors block">
                  {item.label}
                </span>
                <p className="text-xs text-theme-text0 mt-0.5 line-clamp-1">
                  {item.caption}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
