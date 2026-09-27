import { useState, useRef } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ideasAPI } from '../../api'
import IdeaStatusBadge from '../../components/IdeaStatusBadge'
import usePageTitle from '../../hooks/usePageTitle';
import { SkeletonList } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { Plus, Lightbulb, ChevronRight, Calendar } from 'lucide-react'

const STATUSES = [
  { value: '', label: 'All' },
  { value: 'draft',                        label: 'Drafts' },
  { value: 'submitted',                    label: 'Submitted' },
  { value: 'under_supervisor_review',      label: 'Supervisor Review' },
  { value: 'supervisor_approved',          label: 'Approved' },
  { value: 'returned',                     label: 'Returned' },
  { value: 'under_department_evaluation',  label: 'Dept. Eval' },
  { value: 'shortlisted',                  label: 'Shortlisted' },
  { value: 'published',                    label: 'Published' },
  { value: 'implementation_in_progress',   label: 'In Progress' },
  { value: 'implementation_completed',     label: 'Completed' },
]

export default function IdeaListPage() {
  usePageTitle("My Ideas");
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage]                 = useState(1)
  const tabRefs = useRef([])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-ideas', statusFilter, page],
    queryFn: () => ideasAPI.myIdeas({ status: statusFilter, page, limit: 20 }),
    select: (r) => r.data,
    placeholderData: keepPreviousData,
  })

  const ideas      = data?.data || []
  const pagination = data?.pagination

  // Roving tabindex + arrow keys, per the WAI-ARIA tabs pattern.
  const onTabKeyDown = (e, idx) => {
    const last = STATUSES.length - 1
    let next = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = idx === last ? 0 : idx + 1
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = idx === 0 ? last : idx - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    if (next === null) return
    e.preventDefault()
    setStatusFilter(STATUSES[next].value)
    setPage(1)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="page-enter max-w-[1100px] mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="min-w-0">
          <h1 className="text-display text-3xl text-theme-text mb-1">My Ideas</h1>
          <p className="text-theme-text/80 text-sm">Track and manage all your idea submissions</p>
        </div>
        <Link to="/ideas/new" id="btn-submit-idea-list" className="btn btn-primary w-full sm:w-auto flex-shrink-0">
          <Plus className="w-4 h-4" />
          Submit New Idea
        </Link>
      </div>

      {/* ── Status filter tabs ── */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1" role="tablist" aria-label="Filter ideas by status">
        {STATUSES.map(({ value, label }, i) => (
          <button
            key={value}
            ref={(el) => { tabRefs.current[i] = el; }}
            role="tab"
            id={`tab-status-${value || "all"}`}
            aria-controls="ideas-tabpanel"
            aria-selected={statusFilter === value}
            tabIndex={statusFilter === value ? 0 : -1}
            onKeyDown={(e) => onTabKeyDown(e, i)}
            onClick={() => { setStatusFilter(value); setPage(1) }}
            className={`btn btn-sm flex-shrink-0 transition-all duration-200 ${
              statusFilter === value
                ? 'btn-primary'
                : 'btn-secondary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Ideas list ── */}
      <div id="ideas-tabpanel" role="tabpanel" aria-labelledby={`tab-status-${statusFilter || "all"}`}>
      {isLoading ? (
        <SkeletonList count={5} />
      ) : isError ? (
        <ErrorState
          title="Couldn't load your ideas"
          message="The list didn't load. Check your connection and try again."
          onRetry={() => refetch()}
          className="glass rounded-xl"
        />
      ) : ideas.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No ideas yet"
          message="Share your first idea and start driving innovation in your organization."
          className="glass rounded-xl"
          action={
            <Link to="/ideas/new" id="btn-first-idea" className="btn btn-primary">
              <Plus className="w-4 h-4" aria-hidden="true" /> Submit Your First Idea
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {ideas.map((idea) => (
            <Link
              key={idea._id}
              to={`/ideas/${idea._id}`}
              className="glass glass-hover rounded-xl p-5 flex items-start justify-between gap-4 group block"
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h2 className="text-base font-semibold text-theme-text group-hover:text-theme-accent transition-colors line-clamp-1">
                      {idea.title}
                    </h2>
                    <IdeaStatusBadge status={idea.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-theme-text0 flex-wrap">
                    <span>{idea.ideaId || 'Draft'}</span>
                    <span>·</span>
                    <span>{idea.category}</span>
                    <span>·</span>
                    <span>{idea.department}</span>
                    {idea.linkedEventId && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-theme-accent">
                          <Calendar className="w-3 h-3" />
                          {idea.linkedEventId.eventName}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-theme-text/60 mt-1">
                    Last updated: {new Date(idea.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-theme-text/60 group-hover:text-theme-accent transition-colors flex-shrink-0 mt-3" />
            </Link>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination && pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6" aria-label="Pagination">
          <p className="text-sm text-theme-text0">
            Showing {((page - 1) * pagination.limit) + 1}–{Math.min(page * pagination.limit, pagination.total)} of {pagination.total} ideas
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              id="btn-ideas-prev"
              className="btn btn-secondary btn-sm"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              id="btn-ideas-next"
              className="btn btn-secondary btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
