import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { implementationsAPI } from '../../api';
import Modal from '../../components/Modal';
import { Play, AlertCircle, Award, CheckSquare, Square, AlertTriangle } from 'lucide-react';

export default function ImplementationBoardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [selectedImpl, setSelectedImpl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const { data: implementations = [], isLoading } = useQuery({
    queryKey: ['myImplementations'],
    queryFn: () => implementationsAPI.getMy().then(r => r.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => implementationsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myImplementations'] });
      setSelectedImpl(null);
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'An error occurred.');
    }
  });

  const handleOpenUpdate = (impl) => {
    setSelectedImpl(impl);
    setProgress(impl.progressPercent);
    setError('');
  };

  const handleSaveProgress = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      id: selectedImpl._id,
      data: { progressPercent: Number(progress) }
    });
  };

  return (
    <div className="page-enter max-w-[1200px] mx-auto pb-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-display text-4xl text-theme-text mb-2">Implementation Workspace</h1>
          <p className="text-theme-text/80">Track progress, update milestones, and log benefits for approved ideas.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-2xl h-36 animate-pulse" />
          ))}
        </div>
      ) : implementations.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Play className="w-12 h-12 text-theme-text/60 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-theme-text/80">No active implementations assigned</h3>
          <p className="text-sm text-theme-text0 mt-1">When the Innovation Committee assigns an idea to you, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {implementations.map((impl) => {
            const isCompleted = impl.progressPercent === 100;
            const isOverdue = !isCompleted && impl.targetCompletionDate && new Date(impl.targetCompletionDate) < new Date();

            return (
              <div key={impl._id} className={`glass rounded-2xl p-6 relative overflow-hidden ${isOverdue ? 'border-rose-500/40' : 'border-theme-border/50'}`}>
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-xs font-semibold text-theme-accent uppercase tracking-wider">
                        {impl.ideaId?.ideaId}
                      </span>
                      <span className="text-xs text-theme-text0">·</span>
                      <span className={`text-xs ${isOverdue ? 'text-rose-600 font-semibold' : 'text-theme-text/80'}`}>
                        Target: {new Date(impl.targetCompletionDate).toLocaleDateString('en-IN')}
                      </span>
                      {isOverdue && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Overdue
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-theme-text mb-2">{impl.ideaId?.title}</h3>

                    {/* Progress Bar */}
                    <div className="w-full max-w-md mt-4">
                      <div className="flex justify-between text-xs mb-1 font-semibold">
                        <span className="text-theme-text/80">Implementation Progress</span>
                        <span className={isCompleted ? 'text-emerald-600' : 'text-theme-accent'}>{impl.progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-theme-surface rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'gradient-brand'}`}
                          style={{ width: `${impl.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 mt-4 md:mt-0">
                    <button onClick={() => handleOpenUpdate(impl)} className="btn btn-secondary flex-1 sm:flex-none">
                      Update Progress
                    </button>
                    {isCompleted && (
                      <button onClick={() => navigate(`/benefits/record/${impl.ideaId._id}/${impl._id}`)} className="btn btn-primary flex-1 sm:flex-none">
                        <Award className="w-4 h-4" /> Record Benefits
                      </button>
                    )}
                  </div>
                </div>

                {/* Milestones list if any */}
                {impl.milestones?.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-theme-border/30 flex flex-wrap gap-4">
                    {impl.milestones.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-theme-text/80 bg-theme-surface/40 px-3 py-1.5 rounded-lg border border-theme-border">
                        {m.status === 'completed' ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-theme-text/60" />
                        )}
                        <span>{m.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Update Modal */}
      <Modal
        open={!!selectedImpl}
        onClose={() => setSelectedImpl(null)}
        title="Update Progress"
        description={selectedImpl ? `Updating status for ${selectedImpl.ideaId?.title}` : ''}
        size="md"
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSaveProgress} className="space-y-6">
          <div>
            <div className="flex justify-between text-sm font-semibold mb-2">
              <label className="text-label">Completion Percentage</label>
              <span className="text-theme-accent">{progress}%</span>
            </div>
            <input
              type="range"
              min="0" max="100" step="5"
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              className="w-full accent-theme-accent h-2 bg-theme-surface rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-theme-text0 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-theme-border/50">
            <button type="button" onClick={() => setSelectedImpl(null)} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving…' : 'Save Progress'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
