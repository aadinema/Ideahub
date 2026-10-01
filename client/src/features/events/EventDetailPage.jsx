/**
 * EventDetailPage — FR-IE event detail view.
 * Shows event metadata (theme, description, schedule, participation, config)
 * with a Join CTA, followed by the live evaluator-score leaderboard.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { eventsAPI } from '../../api';
import { EVENT_STATUS, EVENT_VISIBILITY } from '@shared/constants';
import IdeaStatusBadge from '../../components/IdeaStatusBadge';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import usePageTitle from '../../hooks/usePageTitle';
import {
  Trophy, ArrowLeft, Lightbulb, Medal, Calendar, Users, Target,
  Tag, CheckCircle2, ArrowRightCircle, Lock, Gauge, AlertCircle,
} from 'lucide-react';

const label = (t = '') => t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

const STATUS_STYLE = {
  [EVENT_STATUS.ACTIVE]: 'bg-success/15 text-success-text border-success/20',
  [EVENT_STATUS.EXTENDED]: 'bg-info-light text-info-text border-info/25',
  [EVENT_STATUS.CLOSED]: 'bg-theme-border/50 text-theme-text0 border-theme-border',
  [EVENT_STATUS.DRAFT]: 'bg-theme-border/50 text-theme-text0 border-theme-border',
};

export default function EventDetailPage() {
  usePageTitle("Event");
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.auth.user);
  const [successMsg, setSuccessMsg] = useState('');

  const { data: event, isLoading: eventLoading, isError, refetch } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsAPI.getById(id).then((r) => r.data.data),
  });

  const { data: leaderboard = [], isLoading: lbLoading } = useQuery({
    queryKey: ['eventLeaderboard', id],
    queryFn: () => eventsAPI.getLeaderboard(id).then((r) => r.data.data),
  });

  const joinMutation = useMutation({
    mutationFn: () => eventsAPI.join(id),
    onSuccess: (res) => {
      setSuccessMsg(res.data?.message || 'Successfully joined this event!');
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      setTimeout(() => setSuccessMsg(''), 3000);
    },
  });

  const participants = event?.participants || [];
  const isJoined = currentUser?._id
    ? participants.some((p) => (p?._id || p)?.toString() === currentUser._id.toString())
    : false;
  const isClosed = event?.status === EVENT_STATUS.CLOSED;
  const deadlinePassed = !!event && new Date(event.endDate).getTime() < Date.now();
  // FR-IE-06 — submissions stop once the event is closed or the deadline passes.
  const submissionsClosed = isClosed || deadlinePassed;
  const isFull = event?.maxParticipants && participants.length >= event.maxParticipants;

  return (
    <div className="page-enter max-w-250 mx-auto pb-12">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-theme-text/80 hover:text-theme-accent flex items-center gap-1 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </button>

      {successMsg && (
        <div className="mb-6 p-4 bg-success-light border border-success/30 text-success-text rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* ── Event header ── */}
      {eventLoading ? (
        <div className="h-64 skeleton rounded-2xl mb-8" />
      ) : isError || !event ? (
        <ErrorState
          className="glass rounded-2xl mb-8"
          title="Event unavailable"
          message="This event could not be found or you don't have access to it."
          onRetry={() => refetch()}
        />
      ) : (
        <div className="glass rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${STATUS_STYLE[event.status] || STATUS_STYLE[EVENT_STATUS.DRAFT]}`}>
              {label(event.status)}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
              {label(event.eventType)}
            </span>
            {event.visibility === EVENT_VISIBILITY.RESTRICTED && (
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-error/15 text-error-text border border-error/20 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Restricted
              </span>
            )}
          </div>

          <h1 className="text-display text-4xl text-theme-text mb-2">{event.eventName}</h1>
          {event.theme && <p className="text-theme-accent font-semibold mb-3">{event.theme}</p>}
          {event.description && (
            <p className="text-theme-text/80 leading-relaxed mb-6 max-w-3xl">{event.description}</p>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Meta icon={Calendar} label="Starts" value={fmtDate(event.startDate)} />
            <Meta icon={Calendar} label="Ends" value={fmtDate(event.endDate)} />
            <Meta
              icon={Users}
              label="Participants"
              value={`${participants.length}${event.maxParticipants ? ` / ${event.maxParticipants}` : ''}`}
            />
            <Meta icon={Gauge} label="Min. Qualifying Score" value={`${event.minQualifyingScore ?? '—'} / 10`} />
            {event.initiative && <Meta icon={Target} label="Initiative" value={event.initiative} />}
            {event.ideaCategory && <Meta icon={Tag} label="Category" value={label(event.ideaCategory)} />}
          </div>

          {/* FR-IE-06 — closed / past-deadline notice */}
          {submissionsClosed && (
            <div role="alert" className="flex items-start gap-3 p-4 mb-2 rounded-xl bg-warning/10 border border-warning/30 text-warning-text text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                This event {isClosed ? 'has been closed' : 'deadline has passed'}. Idea submissions are no longer
                accepted, but you can still view its leaderboard.
              </span>
            </div>
          )}

          {/* Join CTA */}
          {!submissionsClosed && (
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => joinMutation.mutate()}
                disabled={isJoined || joinMutation.isPending || isFull}
                className={`btn ${isJoined ? 'btn-secondary text-success-text! cursor-not-allowed' : 'btn-primary'}`}
              >
                {isJoined ? (
                  <><CheckCircle2 className="w-4 h-4" /> You've Joined</>
                ) : isFull ? (
                  'Event Full'
                ) : joinMutation.isPending ? (
                  'Joining…'
                ) : (
                  <><ArrowRightCircle className="w-4 h-4" /> Join Event</>
                )}
              </button>
              <Link to={`/ideas/new?eventId=${id}`} className="btn btn-secondary">
                <Lightbulb className="w-4 h-4" /> Submit an Idea
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Leaderboard ── */}
      <div className="glass rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-6 h-6 text-theme-accent" />
          <div>
            <h2 className="text-2xl font-bold text-theme-text">Leaderboard</h2>
            <p className="text-sm text-theme-text0">Top ranked ideas based on evaluator scores.</p>
          </div>
        </div>

        {lbLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 skeleton rounded-xl" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No scored ideas yet"
            message="The leaderboard appears once evaluators have scored ideas for this event."
          />
        ) : (
          <div className="space-y-4">
            {leaderboard.map((idea, index) => (
              <div
                key={idea._id}
                className="flex items-center gap-4 p-4 rounded-xl bg-theme-surface/40 border border-theme-border/50 hover:bg-theme-surface/80 transition-colors"
              >
                {/* Rank badge */}
                <div className="w-12 h-12 shrink-0 flex items-center justify-center rounded-lg bg-theme-surface border border-theme-border relative">
                  {index === 0 && <Medal className="w-5 h-5 text-theme-accent absolute -top-2 -right-2 drop-shadow-md" />}
                  {index === 1 && <Medal className="w-5 h-5 text-theme-text/80 absolute -top-2 -right-2 drop-shadow-md" />}
                  {index === 2 && <Medal className="w-5 h-5 text-warning absolute -top-2 -right-2 drop-shadow-md" />}
                  <span className={`text-xl font-bold ${index === 0 ? 'text-theme-accent' : index === 1 ? 'text-theme-text' : index === 2 ? 'text-warning-text' : 'text-theme-text0'}`}>
                    #{index + 1}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <Link to={`/ideas/${idea._id}`} className="text-lg font-semibold text-theme-text hover:text-theme-accent truncate block">
                    {idea.title}
                  </Link>
                  <p className="text-xs text-theme-text/80 mt-1 flex items-center gap-2">
                    <span>{idea.submittedBy?.name}</span>
                    <span>·</span>
                    <span>{idea.department}</span>
                  </p>
                </div>

                <div className="text-right shrink-0 flex items-center gap-4">
                  <div className="hidden sm:block">
                    <IdeaStatusBadge status={idea.status} />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-success-text">{idea.averageScore}</div>
                    <div className="text-[11px] text-theme-text0 uppercase tracking-wider">
                      {idea.evaluationsCount} Evals
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Meta({ icon: Icon, label: metaLabel, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-4 h-4 text-theme-text0 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-theme-text0 uppercase tracking-wider">{metaLabel}</p>
        <p className="text-sm font-semibold text-theme-text truncate">{value}</p>
      </div>
    </div>
  );
}
