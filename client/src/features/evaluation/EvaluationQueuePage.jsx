import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ideasAPI, evaluationAPI } from '../../api';
import Modal from '../../components/Modal';
import { Lightbulb, CheckCircle2, XCircle, Users, AlertCircle, Play } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import usePageTitle from '../../hooks/usePageTitle';
import { SkeletonList } from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';

export default function EvaluationQueuePage() {
  usePageTitle("Evaluation Queue");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [actionType, setActionType] = useState(null); // 'shortlist', 'reject'
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  // Fetch ideas in under_department_evaluation state
  const { data: queue = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['evaluationQueue'],
    queryFn: () => ideasAPI.list({ status: 'under_department_evaluation', limit: 100 }).then(r => r.data.data),
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      if (actionType === 'shortlist') return evaluationAPI.shortlist(selectedIdea._id);
      if (actionType === 'reject') return evaluationAPI.reject(selectedIdea._id, { comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluationQueue'] });
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
    if (actionType === 'reject' && comment.trim().length < 20) {
      setError('Rejection requires a comment of at least 20 characters.');
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="page-enter max-w-300 mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-display text-3xl text-theme-text mb-1">Department Evaluation Queue</h1>
          <p className="text-theme-text/80 text-sm">Score ideas and progress them to Committee Review</p>
        </div>
      </div>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : isError ? (
        <ErrorState
          title="Couldn't load the evaluation queue"
          message="The ideas waiting for your evaluation didn't load. Check your connection and try again."
          onRetry={() => refetch()}
        />
      ) : queue.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No ideas pending evaluation"
          message="Your department's queue is empty."
          className="glass rounded-xl"
        />
      ) : (
        <div className="space-y-4">
          {queue.map((idea) => (
            <div key={idea._id} className="glass rounded-xl p-5 flex flex-col md:flex-row gap-5 items-start justify-between group transition-colors">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg gradient-brand flex items-center justify-center shrink-0 mt-1">
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
                  
                  {/* Info Badge */}
                  {idea.assignedEvaluators && idea.assignedEvaluators.length > 0 ? (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
                      <Users className="w-3.5 h-3.5" aria-hidden="true" />
                      Assigned: {idea.assignedEvaluators.map(e => e.name.split(' ')[0]).join(', ')}
                    </div>
                  ) : (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
                      <Users className="w-3.5 h-3.5" aria-hidden="true" />
                      Pending 2+ Evaluator Scores
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 self-start md:self-center shrink-0 w-full md:w-auto mt-4 md:mt-0">
                <button onClick={() => navigate(`/evaluations/${idea._id}/score`)} className="btn btn-primary flex-1 md:flex-none">
                  <Play className="w-4 h-4" aria-hidden="true" /> Score Idea
                </button>
                <button onClick={() => handleAction(idea, 'shortlist')} className="btn btn-secondary bg-success-light! text-success-text! hover:bg-success/20! border-success/20! flex-1 md:flex-none">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Shortlist
                </button>
                <button onClick={() => handleAction(idea, 'reject')} className="btn btn-secondary bg-error-light! text-error-text! hover:bg-error/20! border-error/20! flex-1 md:flex-none">
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
        title={actionType === 'shortlist' ? 'Shortlist Idea' : 'Reject Idea'}
        description={selectedIdea ? (
          <>
            You are about to {actionType} <strong className="text-theme-text">{selectedIdea.title}</strong>.
            {actionType === 'shortlist' && ' Note: this requires at least 2 evaluator scores in the system.'}
          </>
        ) : ''}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-light border border-error/20 text-error-text text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submitAction}>
          {actionType === 'reject' && (
            <div className="mb-6">
              <label htmlFor="rejection-comment" className="text-label block mb-2">
                Comment <span className="text-error-text">* (min 20 chars)</span>
              </label>
              <textarea
                id="rejection-comment"
                className="input-base resize-y"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Reason for rejection..."
              />
              <p className={`text-xs mt-1 ${comment.trim().length < 20 ? 'text-theme-text0' : 'text-success-text'}`}>
                {comment.trim().length}/20 characters
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn btn-ghost" disabled={mutation.isPending}>
              Cancel
            </button>
            <button type="submit" className={`btn ${actionType === 'shortlist' ? 'btn-primary' : 'btn-danger'}`} disabled={mutation.isPending}>
              {mutation.isPending ? 'Processing…' : `Confirm ${actionType}`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
