import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ideasAPI } from '../../api';
import { Lightbulb, Users, ArrowRightCircle } from 'lucide-react';
import EmptyState from '../../components/EmptyState';
import usePageTitle from '../../hooks/usePageTitle';
import { SkeletonList } from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';

export default function CommitteeQueuePage() {
  usePageTitle("Committee Queue");
  const { data: queue = [], isLoading, isError, refetch } = useQuery({
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
        <SkeletonList count={3} />
      ) : isError ? (
        <ErrorState
          title="Couldn't load the committee queue"
          message="The ideas waiting on your review didn't load. Check your connection and try again."
          onRetry={() => refetch()}
        />
      ) : queue.length === 0 ? (
        <EmptyState
          icon={Users}
          title="The queue is empty"
          message="There are no ideas awaiting committee review at this time."
          className="glass rounded-xl"
        />
      ) : (
        <div className="space-y-4">
          {queue.map((idea) => (
            <div key={idea._id} className="glass rounded-xl p-5 flex flex-col md:flex-row gap-5 items-center justify-between group transition-colors">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0 mt-1">
                  <Lightbulb className="w-4 h-4 text-white" aria-hidden="true" />
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
                  Open 360° View <ArrowRightCircle className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
