import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { evaluationAPI, ideasAPI } from '../../api';
import { EVALUATION_DECISION } from '@shared/constants';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

const DECISION_OPTIONS = [
  {
    value: EVALUATION_DECISION.SHORTLIST,
    label: 'Shortlist',
    hint: 'Advance to committee review',
    activeClass: 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/40',
  },
  {
    value: EVALUATION_DECISION.ESCALATE,
    label: 'Escalate',
    hint: 'Flag for higher review',
    activeClass: 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/40',
  },
  {
    value: EVALUATION_DECISION.REJECT,
    label: 'Reject',
    hint: 'Does not meet the bar',
    activeClass: 'border-rose-500 bg-rose-500/10 ring-1 ring-rose-500/40',
  },
];

export default function EvaluationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState('');
  const [decision, setDecision] = useState('');
  const [error, setError] = useState('');

  const { data: idea, isLoading: ideaLoading } = useQuery({
    queryKey: ['idea', id],
    queryFn: () => ideasAPI.getById(id).then(r => r.data.data),
  });

  // Criteria comes back as a sorted ARRAY, scoped to the idea's event when present.
  const { data: criteria = [], isLoading: criteriaLoading } = useQuery({
    queryKey: ['activeCriteria', idea?.linkedEventId?._id || idea?.linkedEventId],
    enabled: !!idea,
    queryFn: () => {
      const eventId = idea?.linkedEventId?._id || idea?.linkedEventId;
      return evaluationAPI.getCriteria(eventId).then(r => r.data.data);
    },
  });

  // Initialize each criterion to the midpoint of its range once criteria load.
  useEffect(() => {
    if (Array.isArray(criteria) && criteria.length > 0) {
      const initial = {};
      criteria.forEach(c => {
        const min = c.scoreRangeMin ?? 1;
        const max = c.scoreRangeMax ?? 10;
        initial[c.criterionName] = Math.round((min + max) / 2);
      });
      setScores(initial);
    }
  }, [criteria]);

  const mutation = useMutation({
    mutationFn: (data) => evaluationAPI.submitScore(data),
    onSuccess: () => navigate('/evaluations/queue'),
    onError: (err) => setError(err.response?.data?.message || 'An error occurred submitting the evaluation.'),
  });

  const handleScoreChange = (criterionName, val) => {
    setScores(prev => ({ ...prev, [criterionName]: Number(val) }));
  };

  // weightedTotal = Σ(score × weight); weight is a decimal (0–1).
  const weightedTotal = () => {
    if (!Array.isArray(criteria)) return 0;
    return criteria.reduce((sum, c) => sum + (scores[c.criterionName] || 0) * (c.weight || 0), 0);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!decision) {
      setError('Please select an overall decision (shortlist, escalate, or reject).');
      return;
    }
    if (comments.trim().length < 10) {
      setError('Evaluator comments (min 10 characters) are required.');
      return;
    }
    mutation.mutate({ ideaId: id, scores, comments: comments.trim(), decision });
  };

  if (ideaLoading || criteriaLoading) {
    return <div className="page-enter max-w-[800px] mx-auto p-12 text-center text-theme-text0">Loading evaluation form...</div>;
  }

  if (!idea || !Array.isArray(criteria) || criteria.length === 0) {
    return (
      <div className="page-enter max-w-[800px] mx-auto text-center py-20 text-rose-500">
        {!idea ? 'Idea not found.' : 'No active evaluation criteria are configured. Contact an administrator.'}
      </div>
    );
  }

  return (
    <div className="page-enter max-w-[800px] mx-auto pb-12">
      <button onClick={() => navigate(-1)} className="text-sm text-theme-text0 hover:text-theme-accent flex items-center gap-1 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Queue
      </button>

      <div className="mb-8">
        <h1 className="text-display text-3xl text-theme-text mb-2">Evaluate Idea</h1>
        <p className="text-theme-text0">You are scoring <strong className="text-theme-text">{idea.title}</strong></p>
      </div>

      <div className="glass rounded-2xl p-6 md:p-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-600 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-8">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-theme-text border-b border-theme-border/50 pb-2">Scoring Matrix</h3>

            {criteria.map((c) => {
              const min = c.scoreRangeMin ?? 1;
              const max = c.scoreRangeMax ?? 10;
              const val = scores[c.criterionName] ?? Math.round((min + max) / 2);
              return (
                <div key={c.criterionName} className="p-4 rounded-xl bg-theme-surface/40 border border-theme-border/40 transition-colors">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div>
                      <h4 className="font-medium text-theme-text mb-1">{c.criterionName}</h4>
                      {c.guidance && <p className="text-xs text-theme-text0 max-w-lg">{c.guidance}</p>}
                    </div>
                    <span className="text-xs font-semibold text-theme-accent bg-theme-accent/10 px-2 py-1 rounded-md shrink-0">
                      Weight: {Math.round((c.weight || 0) * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={min} max={max} step="1"
                      value={val}
                      onChange={(e) => handleScoreChange(c.criterionName, e.target.value)}
                      aria-label={`Score for ${c.criterionName}`}
                      className="flex-1 accent-theme-accent h-2 bg-theme-border rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="w-12 h-12 rounded-lg bg-theme-surface border border-theme-border flex items-center justify-center shrink-0">
                      <span className="text-xl font-bold text-theme-text">{val}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-theme-text0 mt-2 px-1 font-medium uppercase tracking-wider">
                    <span>{min} - Low</span>
                    <span>{max} - High</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-5 rounded-xl bg-theme-surface border border-theme-border flex items-center justify-between">
            <div>
              <p className="text-sm text-theme-text">Weighted Total Score</p>
              <p className="text-xs text-theme-text0 mt-1">Σ (score × weight), computed live</p>
            </div>
            <div className="text-3xl font-bold text-emerald-600">
              {weightedTotal().toFixed(2)} <span className="text-lg text-theme-text0 font-normal">/ 10.0</span>
            </div>
          </div>

          <div>
            <label className="text-label block mb-2">Overall Decision <span className="text-rose-500">*</span></label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DECISION_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setDecision(opt.value)}
                  aria-pressed={decision === opt.value}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    decision === opt.value
                      ? opt.activeClass
                      : 'border-theme-border bg-theme-surface/40 hover:border-theme-accent/50'
                  }`}
                >
                  <span className="block font-semibold text-theme-text">{opt.label}</span>
                  <span className="block text-xs text-theme-text0 mt-0.5">{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="eval-comments" className="text-label block mb-2">
              Evaluator Comments <span className="text-rose-500">* (min 10 chars)</span>
            </label>
            <textarea
              id="eval-comments"
              className="input-base resize-y"
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Rationale for your scores and decision..."
            />
            <p className={`text-xs mt-1 ${comments.trim().length < 10 ? 'text-theme-text0' : 'text-emerald-600'}`}>
              {comments.trim().length}/10 characters
            </p>
          </div>

          <div className="flex justify-end pt-4 border-t border-theme-border/50">
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Submitting...' : <><CheckCircle className="w-4 h-4" /> Submit Evaluation</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
