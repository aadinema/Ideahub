import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supervisorAPI } from '../../api';
import Modal from '../../components/Modal';
import { Lightbulb, CheckCircle2, XCircle, ArrowLeftCircle, AlertCircle, Clock } from 'lucide-react';

export default function SupervisorQueuePage() {
  const queryClient = useQueryClient();
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve', 'reject', 'return'
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const { data: queue = [], isLoading } = useQuery({
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
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : queue.length === 0 ? (
        <div className="glass rounded-xl p-16 flex flex-col items-center gap-5 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 opacity-50" />
          <h3 className="text-heading text-lg text-theme-text">You're all caught up!</h3>
          <p className="text-theme-text/80 text-sm max-w-xs">There are no ideas pending your review at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((idea) => (
            <div key={idea._id} className="glass rounded-xl p-5 flex flex-col md:flex-row gap-5 items-start justify-between group transition-colors">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0 mt-1">
                  <Lightbulb className="w-4 h-4 text-white" />
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
                      ${idea.sla.isBreached ? 'bg-rose-500/20 text-rose-600 sla-red' :
                        idea.sla.status === 'amber' ? 'bg-theme-accent/10 text-theme-accent sla-amber' :
                        'bg-emerald-500/20 text-emerald-600 sla-ok'}`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {idea.sla.isBreached ? `SLA Breached (${idea.sla.elapsedDays} BD elapsed)` : `${idea.sla.remainingDays} Business Days Remaining`}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 self-start md:self-center shrink-0 w-full md:w-auto mt-4 md:mt-0">
                <button onClick={() => handleAction(idea, 'approve')} className="btn btn-secondary !bg-emerald-500/10 !text-emerald-600 hover:!bg-emerald-500/20 !border-emerald-500/20 flex-1 md:flex-none">
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => handleAction(idea, 'return')} className="btn btn-secondary !bg-theme-accent/10 !text-theme-accent hover:!bg-theme-accent/10 !border-amber-500/20 flex-1 md:flex-none">
                  <ArrowLeftCircle className="w-4 h-4" /> Return
                </button>
                <button onClick={() => handleAction(idea, 'reject')} className="btn btn-secondary !bg-rose-500/10 !text-rose-600 hover:!bg-rose-500/20 !border-rose-500/20 flex-1 md:flex-none">
                  <XCircle className="w-4 h-4" /> Reject
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
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-600 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submitAction}>
          <div className="mb-2">
            <label htmlFor="sup-action-comment" className="text-label block mb-2">
              Comment {(actionType === 'reject' || actionType === 'return') && <span className="text-rose-500">* (min 20 chars)</span>}
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
              <p className={`text-xs mt-1 ${comment.trim().length < 20 ? 'text-theme-text0' : 'text-emerald-600'}`}>
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
