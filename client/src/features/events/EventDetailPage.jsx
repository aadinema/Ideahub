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
import {
  Trophy, ArrowLeft, Lightbulb, Medal, Calendar, Users, Target,
  Tag, CheckCircle2, ArrowRightCircle, Lock, Gauge, AlertCircle,
} from 'lucide-react';

const label = (t = '') => t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

const STATUS_STYLE = {
  [EVENT_STATUS.ACTIVE]: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25',
  [EVENT_STATUS.EXTENDED]: 'bg-blue-500/15 text-blue-600 border-blue-500/25',
  [EVENT_STATUS.CLOSED]: 'bg-theme-border/50 text-theme-text0 border-theme-border',
  [EVENT_STATUS.DRAFT]: 'bg-theme-border/50 text-theme-text0 border-theme-border',
};

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.auth.user);
  const [successMsg, setSuccessMsg] = useState('');

  const { data: event, isLoading: eventLoading, isError } = useQuery({
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
  const isFull = event?.maxParticipants && participants.length >= event.maxParticipants;

  return (
    <div className="page-enter max-w-[1000px] mx-auto pb-12">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-theme-text/80 hover:text-theme-accent flex items-center gap-1 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </button>

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* ── Event header ── */}
      {eventLoading ? (
        <div className="glass rounded-2xl h-64 animate-pulse mb-8" />
      ) : isError || !event ? (
        <div className="glass rounded-2xl p-12 text-center mb-8">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <p className="text-theme-text/80">This event could not be found or you don't have access to it.</p>
        </div>
      ) : (
        <div className="glass rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${STATUS_STYLE[event.status] || STATUS_STYLE[EVENT_STATUS.DRAFT]}`}>
              {label(event.status)}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
              {label(event.eventType)}
            </span>
            {event.visibility === EVENT_VISIBILITY.RESTRICTED && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-rose-500/15 text-rose-600 border border-rose-500/25 flex items-center gap-1">
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

          {/* Join CTA */}
          {!isClosed && (
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => joinMutation.mutate()}
                disabled={isJoined || joinMutation.isPending || isFull}
                className={`btn ${isJoined ? 'btn-secondary !text-emerald-600 cursor-not-allowed' : 'btn-primary'}`}
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
              <div key={i} className="h-16 bg-theme-surface rounded-xl animate-pulse" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="w-12 h-12 text-theme-text/60 mx-auto mb-3" />
            <p className="text-theme-text/80">No ideas have been evaluated for this event yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((idea, index) => (
              <div
                key={idea._id}
                className="flex items-center gap-4 p-4 rounded-xl bg-theme-surface/40 border border-theme-border/50 hover:bg-theme-surface/80 transition-colors"
              >
                {/* Rank badge */}
                <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg bg-theme-surface border border-theme-border relative">
                  {index === 0 && <Medal className="w-5 h-5 text-theme-accent absolute -top-2 -right-2 drop-shadow-md" />}
                  {index === 1 && <Medal className="w-5 h-5 text-theme-text/80 absolute -top-2 -right-2 drop-shadow-md" />}
                  {index === 2 && <Medal className="w-5 h-5 text-amber-600 absolute -top-2 -right-2 drop-shadow-md" />}
                  <span className={`text-xl font-bold ${index === 0 ? 'text-theme-accent' : index === 1 ? 'text-theme-text' : index === 2 ? 'text-amber-600' : 'text-theme-text0'}`}>
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

                <div className="text-right flex-shrink-0 flex items-center gap-4">
                  <div className="hidden sm:block">
                    <IdeaStatusBadge status={idea.status} />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-600">{idea.averageScore}</div>
                    <div className="text-[10px] text-theme-text0 uppercase tracking-wider">
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
        <p className="text-[10px] font-semibold text-theme-text0 uppercase tracking-wider">{metaLabel}</p>
        <p className="text-sm font-semibold text-theme-text truncate">{value}</p>
      </div>
    </div>
  );
}
