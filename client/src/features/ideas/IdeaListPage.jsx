import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ideasAPI } from '../../api'
import IdeaStatusBadge from '../../components/IdeaStatusBadge'
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
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage]                 = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-ideas', statusFilter, page],
    queryFn: () => ideasAPI.myIdeas({ status: statusFilter, page, limit: 20 }),
    select: (r) => r.data,
    placeholderData: keepPreviousData,
  })

  const ideas      = data?.data || []
  const pagination = data?.pagination

  return (
    <div className="page-enter max-w-[1100px] mx-auto">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-display text-3xl text-theme-text mb-1">My Ideas</h1>
          <p className="text-theme-text/80 text-sm">Track and manage all your idea submissions</p>
        </div>
        <Link to="/ideas/new" id="btn-submit-idea-list" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Submit New Idea
        </Link>
      </div>

      {/* ── Status filter tabs ── */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1" role="tablist" aria-label="Filter ideas by status">
        {STATUSES.map(({ value, label }) => (
          <button
            key={value}
            role="tab"
            aria-selected={statusFilter === value}
            onClick={() => { setStatusFilter(value); setPage(1) }}
            className={`btn btn-sm flex-shrink-0 transition-all ${
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
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 animate-pulse">
              <div className="h-5 w-2/3 bg-theme-surface rounded mb-3" />
              <div className="h-3 w-1/3 bg-theme-surface rounded" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="glass rounded-xl p-10 text-center text-rose-600">
          Failed to load ideas. Please refresh the page.
        </div>
      ) : ideas.length === 0 ? (
        <div className="glass rounded-xl p-16 flex flex-col items-center gap-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-theme-accent/10 flex items-center justify-center">
            <Lightbulb className="w-8 h-8 text-theme-accent" />
          </div>
          <div>
            <h3 className="text-heading text-lg text-theme-text mb-1">No ideas yet</h3>
            <p className="text-theme-text/80 text-sm max-w-xs">
              Share your first idea and start driving innovation in your organization.
            </p>
          </div>
          <Link to="/ideas/new" id="btn-first-idea" className="btn btn-primary">
            <Plus className="w-4 h-4" /> Submit Your First Idea
          </Link>
        </div>
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
        <div className="flex items-center justify-between mt-6" aria-label="Pagination">
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
  )
}
