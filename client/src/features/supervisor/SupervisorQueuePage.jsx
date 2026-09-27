import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supervisorAPI } from '../../api';
import Modal from '../../components/Modal';
import { Lightbulb, CheckCircle2, XCircle, ArrowLeftCircle, AlertCircle, Clock } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import usePageTitle from '../../hooks/usePageTitle';
import { SkeletonList } from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';

export default function SupervisorQueuePage() {
  usePageTitle("Supervisor Queue");
  const queryClient = useQueryClient();
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve', 'reject', 'return'
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const { data: queue = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['supervisorQueue'],
    queryFn: () => supervisorAPI.getQueue().then(r => r.data.data),
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      if (actionType === 'approve') return supervisorAPI.approve(selectedIdea._id, { comment });
      if (actionType === 'reject') return supervisorAPI.reject(selectedIdea._id, { comment });
      if (actionType === 'return') return supervisorAPI.returnIdea(selectedIdea._id, { comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supervisorQueue'] });
      closeModal();
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'An error occurred.');
    }
  });

  const handleAction = (idea, type) => {
    setSelectedIdea(idea);
    setActionType(type);
    setComment('');
    setError('');
  };

  const closeModal = () => {
    setSelectedIdea(null);
    setActionType(null);
    setComment('');
    setError('');
  };

  const submitAction = (e) => {
    e.preventDefault();
    if ((actionType === 'reject' || actionType === 'return') && comment.trim().length < 20) {
      setError('Comment must be at least 20 characters for this action.');
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="page-enter max-w-[1200px] mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-display text-3xl text-theme-text mb-1">Supervisor Queue</h1>
          <p className="text-theme-text/80 text-sm">Ideas pending your validation</p>
        </div>
      </div>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : isError ? (
        <ErrorState title="Couldn't load the supervisor queue" message="The ideas waiting on your review didn't load. Check your connection and try again." onRetry={() => refetch()} />
      ) : queue.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="You're all caught up!"
          message="There are no ideas pending your review at this time."
          className="glass rounded-xl"
        />
      ) : (
        <div className="space-y-4">
          {queue.map((idea) => (
            <div key={idea._id} className="glass rounded-xl p-5 flex flex-col md:flex-row gap-5 items-start justify-between group transition-colors">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0 mt-1">
                  <Lightbulb className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
                <div>
                  <Link to={`/ideas/${idea._id}`} className="text-lg font-semibold text-theme-text hover:text-theme-accent transition-colors line-clamp-1">
                    {idea.title}
                  </Link>
                  <p className="text-sm text-theme-text/80 mt-1 flex flex-wrap gap-2">
                    <span>{idea.ideaId}</span>
                    <span>·</span>
                    <span className="text-theme-text/80">{idea.submittedBy?.name}</span>
                    <span>·</span>
                    <span>{idea.department}</span>
                  </p>
                  
                  {/* SLA Countdown Badge */}
                  {idea.sla && (
                    <div className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold
                      ${idea.sla.isBreached ? 'bg-error/20 sla-red' :
                        idea.sla.status === 'amber' ? 'bg-warning/10 sla-amber' :
                        'bg-success/20 sla-ok'}`}
                    >
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      {idea.sla.isBreached ? `SLA Breached (${idea.sla.elapsedDays} BD elapsed)` : `${idea.sla.remainingDays} Business Days Remaining`}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 self-start md:self-center shrink-0 w-full md:w-auto mt-4 md:mt-0">
                <button onClick={() => handleAction(idea, 'approve')} className="btn btn-secondary !bg-success-light !text-success-text hover:!bg-success/20 !border-success/20 flex-1 md:flex-none">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Approve
                </button>
                <button onClick={() => handleAction(idea, 'return')} className="btn btn-secondary !bg-theme-accent/10 !text-theme-accent hover:!bg-theme-accent/10 !border-theme-accent/20 flex-1 md:flex-none">
                  <ArrowLeftCircle className="w-4 h-4" aria-hidden="true" /> Return
                </button>
                <button onClick={() => handleAction(idea, 'reject')} className="btn btn-secondary !bg-error-light !text-error-text hover:!bg-error/20 !border-error/20 flex-1 md:flex-none">
                  <XCircle className="w-4 h-4" aria-hidden="true" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      <Modal
        open={!!selectedIdea}
        onClose={closeModal}
        title={<span className="capitalize">{actionType} Idea</span>}
        description={
          selectedIdea && (
            <>You are about to {actionType} <strong className="text-theme-text">{selectedIdea.title}</strong>.</>
          )
        }
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-light border border-error/20 text-error-text text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submitAction}>
          <div className="mb-2">
            <label htmlFor="sup-action-comment" className="text-label block mb-2">
              Comment {(actionType === 'reject' || actionType === 'return') && <span className="text-error-text">* (min 20 chars)</span>}
            </label>
            <textarea
              id="sup-action-comment"
              className="input-base resize-y"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Reason for ${actionType === 'approve' ? 'approval (optional)' : 'rejection/return'}...`}
            />
            {(actionType === 'reject' || actionType === 'return') && (
              <p className={`text-xs mt-1 ${comment.trim().length < 20 ? 'text-theme-text0' : 'text-success-text'}`}>
                {comment.trim().length}/20 characters
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={closeModal} className="btn btn-ghost" disabled={mutation.isPending}>
              Cancel
            </button>
            <button type="submit" className={`btn ${actionType === 'approve' ? 'btn-primary' : 'btn-danger'}`} disabled={mutation.isPending}>
              {mutation.isPending ? 'Processing...' : `Confirm ${actionType}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
