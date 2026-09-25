import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ideasAPI } from '../../api';
import { Lightbulb, Users, ArrowRightCircle } from 'lucide-react';

export default function CommitteeQueuePage() {
  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['committeeQueue'],
    queryFn: () => ideasAPI.list({ status: 'under_committee_review', limit: 100 }).then(r => r.data.data),
  });

  return (
    <div className="page-enter max-w-[1200px] mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-display text-3xl text-theme-text mb-1">Innovation Committee Queue</h1>
          <p className="text-theme-text/80 text-sm">Ideas pending final approval for publishing or implementation</p>
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
          <Users className="w-12 h-12 text-emerald-600 opacity-50" />
          <h3 className="text-heading text-lg text-theme-text">The queue is empty</h3>
          <p className="text-theme-text/80 text-sm max-w-xs">There are no ideas awaiting committee review at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((idea) => (
            <div key={idea._id} className="glass rounded-xl p-5 flex flex-col md:flex-row gap-5 items-center justify-between group transition-colors">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-violet-500/20">
                  <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <div>
                  <Link to={`/committee/ideas/${idea._id}`} className="text-lg font-semibold text-theme-text hover:text-theme-accent transition-colors line-clamp-1">
                    {idea.title}
                  </Link>
                  <p className="text-sm text-theme-text/80 mt-1 flex flex-wrap gap-2">
                    <span>{idea.ideaId}</span>
                    <span>·</span>
                    <span className="text-theme-text/80">{idea.submittedBy?.name}</span>
                    <span>·</span>
                    <span>{idea.department}</span>
                  </p>
                </div>
              </div>
              
              <div className="shrink-0 w-full md:w-auto mt-4 md:mt-0">
                <Link to={`/committee/ideas/${idea._id}`} className="btn btn-primary w-full md:w-auto">
                  Open 360° View <ArrowRightCircle className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
