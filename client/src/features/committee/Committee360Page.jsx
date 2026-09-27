import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { committeeAPI } from '../../api';
import IdeaStatusBadge from '../../components/IdeaStatusBadge';
import Modal from '../../components/Modal';
import RichText from '../../components/RichText';
import { ArrowLeft, CheckCircle2, Play, AlertCircle, Clock, FileText, XCircle, Undo2, Award, Download } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';

const ACTION_TITLES = {
  publish: 'Approve for Publishing',
  implement: 'Approve for Implementation',
  reject: 'Reject Idea',
  defer: 'Defer / Return',
};

export default function Committee360Page() {
  usePageTitle("Idea 360° View");
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionType, setActionType] = useState(null); // 'publish', 'implement', 'reject', 'defer'
  const [comment, setComment] = useState('');
  const [implementationOwnerId, setImplementationOwnerId] = useState('');
  const [showAllOwnerDepartments, setShowAllOwnerDepartments] = useState(false);
  const [error, setError] = useState('');

  const { data: viewData, isLoading, isError, refetch } = useQuery({
    queryKey: ['committee360', id],
    queryFn: () => committeeAPI.get360View(id).then(r => r.data.data),
  });

  // Load the implementation-owner directory only when that modal is open.
  const { data: owners = [] } = useQuery({
    queryKey: ['implementationOwners'],
    queryFn: () => committeeAPI.getImplementationOwners().then(r => r.data.data),
    enabled: actionType === 'implement',
  });

  const mutation = useMutation({
    mutationFn: () => {
      if (actionType === 'publish') return committeeAPI.approvePublishing(id, { comment });
      if (actionType === 'implement') return committeeAPI.approveImplementation(id, { comment, implementationOwnerId });
      if (actionType === 'reject') return committeeAPI.reject(id, { comment });
      if (actionType === 'defer') return committeeAPI.defer(id, { comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['committeeQueue'] });
      navigate('/committee/queue');
    },
    onError: (err) => setError(err.response?.data?.message || 'An error occurred.'),
  });

  const handleAction = (type) => {
    setActionType(type);
    setComment('');
    setImplementationOwnerId('');
    setError('');
  };

  const closeModal = () => {
    setActionType(null);
    setComment('');
    setImplementationOwnerId('');
    setError('');
  };

  const submitAction = (e) => {
    e.preventDefault();
    if ((actionType === 'reject' || actionType === 'defer') && comment.trim().length < 20) {
      setError('Reason must be at least 20 characters.');
      return;
    }
    if (actionType === 'implement' && !implementationOwnerId) {
      setError('You must select an Implementation Owner.');
      return;
    }
    mutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="page-enter max-w-[1200px] mx-auto pb-12 space-y-6" aria-busy="true" aria-label="Loading idea view">
        <div className="h-4 w-28 skeleton rounded" />
        <div className="h-8 w-2/3 skeleton rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="glass rounded-2xl p-6 space-y-3">
                <div className="h-3 w-28 skeleton rounded" />
                <div className="h-3 w-full skeleton rounded" />
                <div className="h-3 w-5/6 skeleton rounded" />
              </div>
            ))}
          </div>
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="glass rounded-2xl p-5 space-y-3">
                <div className="h-3 w-20 skeleton rounded" />
                <div className="h-3 w-3/4 skeleton rounded" />
                <div className="h-3 w-1/2 skeleton rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page-enter max-w-[1200px] mx-auto">
        <ErrorState title="Couldn't load this idea" message="The 360° view didn't load. Check your connection and try again." onRetry={() => refetch()} />
      </div>
    );
  }

  if (!viewData?.idea) {
    return <div className="page-enter max-w-[1200px] mx-auto text-center py-20 text-error-text">Idea not found.</div>;
  }

  const { idea, evaluations = [], averageScore } = viewData;

  // Owner picker: default to same-department owners (soft nudge), with an opt-in to
  // show all eligible owners. Not a hard constraint — if no same-department owner
  // exists, all are shown, so cross-department assignment is never blocked.
  const sameDeptOwners = owners.filter(
    (o) => o.department && idea.department && o.department === idea.department
  );
  const otherDeptOwners = owners.filter((o) => !sameDeptOwners.includes(o));
  const visibleOwners =
    showAllOwnerDepartments || sameDeptOwners.length === 0 ? owners : sameDeptOwners;

  return (
    <div className="page-enter max-w-[1200px] mx-auto pb-12">
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>
          <button onClick={() => navigate(-1)} className="text-sm text-theme-text0 hover:text-theme-accent flex items-center gap-1 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Queue
          </button>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-semibold text-theme-text0 uppercase tracking-wider">{idea.ideaId}</span>
            <IdeaStatusBadge status={idea.status} />
          </div>
          <h1 className="text-display text-3xl text-theme-text mb-2">{idea.title}</h1>
          <p className="text-sm text-theme-text0">
            Submitted by <strong className="text-theme-text">{idea.submittedBy?.name}</strong> · {idea.department}
          </p>
        </div>

        {/* ── Committee Action Bar ── */}
        <div className="flex flex-wrap gap-2 p-4 glass rounded-2xl">
          <button onClick={() => handleAction('publish')} className="btn btn-secondary !bg-success-light !text-success-text hover:!bg-success/20 !border-success/20">
            <CheckCircle2 className="w-4 h-4" /> Publish
          </button>
          <button onClick={() => handleAction('implement')} className="btn btn-secondary !bg-info-light !text-info-text hover:!bg-info-light !border-info/20">
            <Play className="w-4 h-4" /> Implement
          </button>
          <button onClick={() => handleAction('reject')} className="btn btn-secondary !bg-error-light !text-error-text hover:!bg-error/20 !border-error/20">
            <XCircle className="w-4 h-4" /> Reject
          </button>
          <button onClick={() => handleAction('defer')} className="btn btn-secondary !bg-theme-accent/10 !text-theme-accent hover:!bg-theme-accent/10 !border-theme-accent/20">
            <Undo2 className="w-4 h-4" /> Defer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main Idea Content ── */}
        <div className="lg:col-span-2 space-y-6">
          <section className="glass rounded-2xl p-6">
            <h3 className="text-label mb-4">Problem Statement</h3>
            <RichText html={idea.problemStatement} />
          </section>

          {idea.proposedSolution && (
            <section className="glass rounded-2xl p-6">
              <h3 className="text-label mb-4">Proposed Solution</h3>
              <RichText html={idea.proposedSolution} />
            </section>
          )}

          {idea.expectedOutcome && (
            <section className="glass rounded-2xl p-6">
              <h3 className="text-label mb-4">Expected Outcome</h3>
              <RichText html={idea.expectedOutcome} />
            </section>
          )}

          {/* Evaluations Section */}
          <section className="glass rounded-2xl p-6 border border-theme-accent/20 bg-theme-accent/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Award className="w-32 h-32 text-theme-accent" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="text-xl font-bold text-theme-text">Evaluator Feedback</h3>
                {averageScore != null && (
                  <div className="px-3 py-1 bg-success/15 text-success-text rounded-lg font-bold">
                    Avg Score: {averageScore} / 10.0
                  </div>
                )}
              </div>

              {evaluations.length === 0 ? (
                <EmptyState
                  icon={Award}
                  title="No evaluations yet"
                  message="Evaluator feedback will appear here once scores are submitted."
                />
              ) : (
                <div className="space-y-4">
                  {evaluations.map(ev => (
                    <div key={ev._id} className="p-4 rounded-xl bg-theme-surface/60 border border-theme-border/50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-theme-text">{ev.evaluatorId?.name}</p>
                          <p className="text-xs text-theme-text0">{ev.evaluatorId?.department}</p>
                          {ev.decision && (
                            <span className="inline-block mt-1 text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-theme-accent/10 text-theme-accent">
                              {ev.decision}
                            </span>
                          )}
                        </div>
                        <div className="text-lg font-bold text-theme-accent">{(ev.weightedTotal ?? 0).toFixed(2)}</div>
                      </div>
                      <div className="text-xs text-theme-text0 space-y-1 mb-3">
                        {ev.scores?.map(s => (
                          <div key={s.criterion} className="flex justify-between">
                            <span>{s.criterion}</span>
                            <span className="text-theme-text font-medium">{s.score}/10</span>
                          </div>
                        ))}
                      </div>
                      {ev.comments && (
                        <p className="text-sm text-theme-text0 italic p-2 bg-theme-surface/60 rounded-lg">"{ev.comments}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
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
              <div>
                <dt className="text-theme-text0 mb-1">Expected Benefits</dt>
                <dd className="flex flex-wrap gap-1">
                  {idea.benefitTypes?.map((b) => (
                    <span key={b} className="px-2 py-1 rounded-md bg-theme-accent/10 text-theme-accent text-[11px] uppercase tracking-wider">
                      {b.replace(/_/g, ' ')}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </section>

          {/* Attachments */}
          {idea.attachments?.length > 0 && (
            <section className="glass rounded-2xl p-5">
              <h3 className="text-label mb-3">Attachments ({idea.attachments.length})</h3>
              <div className="space-y-2">
                {idea.attachments.map((att, idx) => (
                  <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 p-2 rounded-lg bg-theme-surface/60 hover:bg-theme-border/50 transition-colors group">
                    <span className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-theme-text0 flex-shrink-0" aria-hidden="true" />
                      <span className="text-xs text-theme-text truncate">{att.fileName}</span>
                    </span>
                    <Download className="w-3 h-3 text-theme-text0 group-hover:text-theme-accent flex-shrink-0" aria-hidden="true" />
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
                  <p className="text-xs font-semibold text-theme-text capitalize">{hist.status.replace(/_/g, ' ')}</p>
                  <p className="text-[11px] text-theme-text0 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {new Date(hist.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                  <p className="text-[11px] text-theme-text0 mt-0.5">By: {hist.actor?.name || 'System'}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ── Action Modal ── */}
      <Modal
        open={!!actionType}
        onClose={closeModal}
        title={actionType ? ACTION_TITLES[actionType] : ''}
        description={<>Finalizing decision for <strong className="text-theme-text">{idea.title}</strong>.</>}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-light border border-error/20 text-theme-text text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submitAction} className="space-y-4">
          {actionType === 'implement' && (
            <div>
              <label htmlFor="impl-owner" className="text-label block mb-2">Implementation Owner <span className="text-error-text">*</span></label>
              <select
                id="impl-owner"
                className="input-base"
                value={implementationOwnerId}
                onChange={(e) => setImplementationOwnerId(e.target.value)}
                required
              >
                <option value="">Select an owner…</option>
                {visibleOwners.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.name}{o.department ? ` — ${o.department}` : ''}
                  </option>
                ))}
              </select>
              {otherDeptOwners.length > 0 && (
                <label className="flex items-center gap-2 mt-2 text-xs text-theme-text0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAllOwnerDepartments}
                    onChange={(e) => setShowAllOwnerDepartments(e.target.checked)}
                  />
                  Show owners from other departments ({otherDeptOwners.length})
                </label>
              )}
              {owners.length === 0 && (
                <p className="text-xs text-theme-text0 mt-1">No users hold the implementation-owner role yet. Assign one in Admin first.</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="committee-comment" className="text-label block mb-2">
              Comment / Rationale {(actionType === 'reject' || actionType === 'defer') && <span className="text-error-text">* (min 20 chars)</span>}
            </label>
            <textarea
              id="committee-comment"
              className="input-base resize-y"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Official committee rationale..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-theme-border/50">
            <button type="button" onClick={closeModal} className="btn btn-ghost" disabled={mutation.isPending}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Processing...' : 'Confirm Decision'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
