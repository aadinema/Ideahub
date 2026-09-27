/**
 * client/src/features/ceo/CeoDrillDown.jsx
 * Right-side drawer showing the ideas behind a clicked metric (§19).
 * Opens with query = { title, params, note? }; fetches the org-wide idea
 * list (CEO has server-side read access to all ideas).
 *
 * A11y: role=dialog, Escape closes, backdrop click closes, focus moves to
 * the close button on open, focus returns handled by caller's state.
 */
import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { X, Lightbulb, ArrowRight } from 'lucide-react'
import { ideasAPI } from '../../api'
import IdeaStatusBadge from '../../components/IdeaStatusBadge'
import { PanelSkeleton, EmptyState, ErrorState } from './ceoUtils'

export default function CeoDrillDown({ query, onClose }) {
  const closeRef = useRef(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['ceo-drilldown', query],
    queryFn: () => ideasAPI.list({ ...query?.params, limit: 50, page: 1 }),
    select: (r) => r.data,
    enabled: !!query,
  })

  // Escape closes (§18 a11y parity with the profile switcher)
  useEffect(() => {
    if (!query) return undefined
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    closeRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [query, onClose])

  if (!query) return null

  const ideas = data?.data || []
  const total = data?.pagination?.total ?? ideas.length

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drilldown-title"
        className="relative w-full max-w-[480px] h-full flex flex-col border-l border-theme-border/60 shadow-2xl page-enter"
        style={{ background: 'var(--surface)' }}
      >
        <header className="flex items-start justify-between gap-3 p-5 border-b border-theme-border/50">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-theme-text0">
              Drill-down · {total} {total === 1 ? 'idea' : 'ideas'}
            </p>
            <h2 id="drilldown-title" className="text-heading text-base text-theme-text mt-0.5">
              {query.title}
            </h2>
            {query.note && <p className="text-xs text-theme-text0 mt-1">{query.note}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close drill-down"
            className="p-1.5 rounded-lg btn-ghost text-theme-text0 hover:text-theme-text"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <PanelSkeleton rows={6} />
          ) : isError ? (
            <ErrorState message="Unable to load ideas." onRetry={refetch} />
          ) : ideas.length === 0 ? (
            <EmptyState
              title="No ideas match this filter."
              hint="This metric currently has no underlying ideas — the number you clicked reflects other filters or a different time window."
            />
          ) : (
            ideas.map((idea) => (
              <Link
                key={idea._id}
                to={`/ideas/${idea._id}`}
                onClick={onClose}
                className="block glass glass-hover rounded-xl p-3.5 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-theme-text group-hover:text-theme-accent transition-colors line-clamp-2">
                    {idea.title}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-theme-text0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" aria-hidden="true" />
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <IdeaStatusBadge status={idea.status} />
                  <span className="text-[11px] text-theme-text0">
                    {idea.department} · {idea.submittedBy?.name || '—'} · {idea.ideaId}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        <footer className="p-4 border-t border-theme-border/50 text-[11px] text-theme-text0 flex items-center gap-1.5">
          <Lightbulb className="w-3 h-3" aria-hidden="true" />
          Showing up to 50 ideas · counts update every 5 minutes
        </footer>
      </aside>
    </div>
  )
}
