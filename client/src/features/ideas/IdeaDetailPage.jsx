/**
 * IdeaDetailPage — FR-02 (View)
 * Displays idea details, status history, attachments, and action buttons based on user role.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ideasAPI } from '../../api'
import useRole from '../../hooks/useRole'
import IdeaStatusBadge from '../../components/IdeaStatusBadge'
import RichText from '../../components/RichText'
import {
  Calendar, ArrowLeft, Download, FileText, CheckCircle2,
  Clock, AlertCircle, Edit, Play
} from 'lucide-react'

export default function IdeaDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasRole, isSupervisor } = useRole()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['idea', id],
    queryFn: () => ideasAPI.getById(id),
    select: (r) => r.data.data,
  })

  const publishMutation = useMutation({
    mutationFn: () => ideasAPI.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea', id] })
      queryClient.invalidateQueries({ queryKey: ['gallery'] })
    },
  })

  if (isLoading) {
    return (
      <div className="page-enter max-w-[900px] mx-auto space-y-4">
        <div className="h-8 w-1/3 bg-theme-surface rounded animate-pulse mb-8" />
        <div className="glass rounded-xl p-8 h-[400px] animate-pulse bg-theme-surface/50" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="page-enter max-w-[900px] mx-auto text-center py-20">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-theme-text mb-2">Idea Not Found</h2>
        <p className="text-theme-text/80 mb-6">This idea doesn't exist or you don't have access to view it.</p>
        <button onClick={() => navigate('/ideas')} className="btn btn-secondary">
          <ArrowLeft className="w-4 h-4" /> Back to Ideas
        </button>
      </div>
    )
  }

  const idea = data
  const isDraft = idea.status === 'draft'

  return (
    <div className="page-enter max-w-[900px] mx-auto pb-12">
      {/* ── Header ── */}
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="text-sm text-theme-text/80 hover:text-theme-accent flex items-center gap-1 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-semibold text-theme-text0 uppercase tracking-wider">
                {idea.ideaId || 'Draft'}
              </span>
              <IdeaStatusBadge status={idea.status} />
            </div>
            <h1 className="text-display text-3xl text-theme-text mb-2">{idea.title}</h1>
            <p className="text-sm text-theme-text/80 flex items-center gap-2">
              <span>Submitted by <strong className="text-theme-text/80">{idea.submittedBy?.name}</strong></span>
              <span>·</span>
              <span>{idea.department}</span>
              <span>·</span>
              <span>{new Date(idea.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {isDraft && (
              <Link to={`/ideas/${idea._id}/edit`} className="btn btn-primary">
                <Edit className="w-4 h-4" /> Edit Draft
              </Link>
            )}
            {idea.status === 'under_supervisor_review' && isSupervisor && (
              <Link to={`/supervisor/queue`} className="btn btn-primary">
                <CheckCircle2 className="w-4 h-4" /> Review Idea
              </Link>
            )}
            {idea.status === 'approved_for_publishing' && hasRole('admin') && (
              <button
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
                className="btn btn-primary"
              >
                <Play className="w-4 h-4" /> {publishMutation.isPending ? 'Publishing…' : 'Publish'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main Content ── */}
        <div className="lg:col-span-2 space-y-6">
          <section className="glass rounded-2xl p-6">
            <h3 className="text-label mb-4">Problem Statement</h3>
            <RichText html={idea.problemStatement} />
          </section>

          {idea.currentChallenges && (
            <section className="glass rounded-2xl p-6">
              <h3 className="text-label mb-4">Current Challenges</h3>
              <RichText html={idea.currentChallenges} />
            </section>
          )}

          {idea.proposedSolution && (
            <section className="glass rounded-2xl p-6">
              <h3 className="text-label mb-4">Proposed Solution</h3>
              <RichText html={idea.proposedSolution} />
            </section>
          )}

          {idea.innovationDescription && (
            <section className="glass rounded-2xl p-6">
              <h3 className="text-label mb-4">Innovation</h3>
              <RichText html={idea.innovationDescription} />
            </section>
          )}

          {idea.expectedOutcome && (
            <section className="glass rounded-2xl p-6">
              <h3 className="text-label mb-4">Expected Outcome</h3>
              <RichText html={idea.expectedOutcome} />
            </section>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">
          {/* Details */}
          <section className="glass rounded-2xl p-5">
            <h3 className="text-label mb-4">Details</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-theme-text0 mb-0.5">Category</dt>
                <dd className="text-theme-text">{idea.category}</dd>
              </div>
              {idea.ideaType && (
                <div>
                  <dt className="text-theme-text0 mb-0.5">Type</dt>
                  <dd className="text-theme-text capitalize">{idea.ideaType}</dd>
                </div>
              )}
              {idea.initiative && (
                <div>
                  <dt className="text-theme-text0 mb-0.5">Initiative</dt>
                  <dd className="text-theme-text">{idea.initiative}</dd>
                </div>
              )}
              {idea.linkedEventId && (
                <div>
                  <dt className="text-theme-text0 mb-0.5">Ideathon</dt>
                  <dd className="text-theme-accent flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {idea.linkedEventId.eventName}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-theme-text0 mb-1">Expected Benefits</dt>
                <dd className="flex flex-wrap gap-1">
                  {idea.benefitTypes?.map((b) => (
                    <span key={b} className="px-2 py-1 rounded-md bg-theme-accent/10 text-theme-accent text-[10px] uppercase tracking-wider">
                      {b.replace(/_/g, ' ')}
                    </span>
                  ))}
                </dd>
              </div>
              {idea.keywords?.length > 0 && (
                <div>
                  <dt className="text-theme-text0 mb-1">Keywords</dt>
                  <dd className="text-theme-text/80 text-xs">
                    {idea.keywords.join(', ')}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Attachments */}
          {idea.attachments?.length > 0 && (
            <section className="glass rounded-2xl p-5">
              <h3 className="text-label mb-3">Attachments ({idea.attachments.length})</h3>
              <div className="space-y-2">
                {idea.attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-theme-surface/50 hover:bg-theme-border/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-theme-text0 group-hover:text-theme-accent flex-shrink-0" />
                      <span className="text-xs text-theme-text/80 truncate">{att.fileName}</span>
                    </div>
                    <Download className="w-3 h-3 text-theme-text0 group-hover:text-theme-accent flex-shrink-0" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Timeline / Status History */}
          <section className="glass rounded-2xl p-5">
            <h3 className="text-label mb-4">History</h3>
            <div className="space-y-4">
              {idea.statusHistory?.slice().reverse().map((hist, idx) => (
                <div key={idx} className="relative pl-4 border-l-2 border-theme-border/50 last:border-transparent">
                  <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-theme-accent" />
                  <p className="text-xs font-semibold text-theme-text capitalize">
                    {hist.status.replace(/_/g, ' ')}
                  </p>
                  <p className="text-[10px] text-theme-text0 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {new Date(hist.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                  <p className="text-[10px] text-theme-text/80 mt-0.5">
                    By: {hist.actor?.name || 'System'}
                  </p>
                  {hist.comment && (
                    <p className="text-xs text-theme-text/80 mt-1 p-2 bg-theme-surface/50 rounded-lg italic">
                      "{hist.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
