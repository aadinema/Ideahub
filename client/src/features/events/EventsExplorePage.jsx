import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../../api';
import { EVENT_TYPE, EVENT_STATUS } from '@shared/constants';
import { Calendar, Users, Target, ArrowRightCircle, CheckCircle2, Lock, Compass } from 'lucide-react';
import { useSelector } from 'react-redux';

const TYPE_LABEL = (t = '') => t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/* Multi-select filter (FR-IE-04) — checkbox list inside an expandable <details>. */
function FilterMulti({ label, options, selected, onChange }) {
  const toggle = (v) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);

  return (
    <details className="group">
      <summary className="cursor-pointer list-none flex items-center justify-between text-xs font-semibold text-theme-text0 uppercase tracking-wider">
        <span>{label}</span>
        <span className="text-[10px] text-theme-accent normal-case">
          {selected.length ? `${selected.length} selected` : 'Any'}
        </span>
      </summary>
      <div className="mt-2 space-y-1.5 pl-1">
        {options.length === 0 ? (
          <p className="text-xs text-theme-text0 italic">No options yet.</p>
        ) : (
          options.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm text-theme-text/90 cursor-pointer">
              <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)} />
              {TYPE_LABEL(o)}
            </label>
          ))
        )}
      </div>
    </details>
  );
}

/* Event card — shared by Explore and My Events. */
function EventCard({ event, currentUser, onJoin, joining, onOpen }) {
  const participants = event.participants || [];
  const isJoined = currentUser?._id
    ? participants.some((p) => (p?._id || p)?.toString() === currentUser._id.toString())
    : false;
  const isClosed = event.status === EVENT_STATUS.CLOSED;

  return (
    <div className="glass glass-hover rounded-2xl p-6 flex flex-col transition-colors group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
            event.status === EVENT_STATUS.ACTIVE ? 'bg-emerald-500/20 text-emerald-600' :
            event.status === EVENT_STATUS.EXTENDED ? 'bg-blue-500/20 text-blue-600' :
            'bg-theme-border/50 text-theme-text0'
          }`}>
            {event.status}
          </span>
          {event.visibility === 'restricted' && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-rose-500/20 text-rose-600 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Restricted
            </span>
          )}
        </div>
      </div>

      <h3 className="text-xl font-bold text-theme-text mb-2 group-hover:text-theme-accent transition-colors line-clamp-2">
        {event.eventName}
      </h3>

      <p className="text-sm text-theme-text/80 line-clamp-2 mb-6 flex-1">{event.description}</p>

      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-xs text-theme-text/80">
          <Calendar className="w-4 h-4 text-theme-text0" />
          <span>Ends: {new Date(event.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-theme-text/80">
          <Users className="w-4 h-4 text-theme-text0" />
          <span>{participants.length} {event.maxParticipants ? `/ ${event.maxParticipants}` : ''} Participants</span>
        </div>
        {event.initiative && (
          <div className="flex items-center gap-2 text-xs text-theme-text/80">
            <Target className="w-4 h-4 text-theme-text0" />
            <span>Initiative: {event.initiative}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mt-auto">
        <button onClick={() => onOpen(event._id)} className="btn btn-secondary flex-1">Details</button>
        {!isClosed && (
          <button
            onClick={() => onJoin(event._id)}
            disabled={isJoined || joining}
            className={`btn flex-1 ${isJoined ? 'btn-secondary !text-emerald-600 cursor-not-allowed' : 'btn-primary'}`}
          >
            {isJoined ? (
              <><CheckCircle2 className="w-4 h-4" /> Joined</>
            ) : (
              <><ArrowRightCircle className="w-4 h-4" /> Join Event</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function EventsExplorePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);

  const [view, setView] = useState('explore'); // 'explore' | 'mine'
  const [filters, setFilters] = useState({ status: EVENT_STATUS.ACTIVE, types: [], initiatives: [], categories: [] });
  const [successMsg, setSuccessMsg] = useState('');

  const exploreParams = {
    status: filters.status || undefined,
    type: filters.types.join(',') || undefined,
    initiative: filters.initiatives.join(',') || undefined,
    category: filters.categories.join(',') || undefined,
  };

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['exploreEvents', exploreParams],
    queryFn: () => eventsAPI.explore(exploreParams).then((r) => r.data.data),
    enabled: view === 'explore',
  });

  const { data: myEvents = [], isLoading: mineLoading } = useQuery({
    queryKey: ['myEvents'],
    queryFn: () => eventsAPI.mine().then((r) => r.data.data),
    enabled: view === 'mine',
  });

  // FR-IE-04 — distinct Initiative / Business Category options.
  const { data: facets = { initiatives: [], categories: [] } } = useQuery({
    queryKey: ['eventFacets'],
    queryFn: () => eventsAPI.facets().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const joinMutation = useMutation({
    mutationFn: (id) => eventsAPI.join(id),
    onSuccess: (res) => {
      setSuccessMsg(res.data?.message || 'Successfully joined!');
      queryClient.invalidateQueries({ queryKey: ['exploreEvents'] });
      queryClient.invalidateQueries({ queryKey: ['myEvents'] });
      setTimeout(() => setSuccessMsg(''), 3000);
    },
  });

  const list = view === 'explore' ? events : myEvents;
  const loading = view === 'explore' ? isLoading : mineLoading;

  return (
    <div className="page-enter max-w-[1200px] mx-auto pb-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-display text-4xl text-theme-text mb-2">Ideathon Events</h1>
          <p className="text-theme-text/80">Discover and participate in company-wide innovation challenges.</p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* ── Explore / My Events (FR-IE-03) ── */}
      <div className="flex gap-1 border-b border-theme-border mb-6" role="tablist">
        {[
          { id: 'explore', label: 'Explore Events' },
          { id: 'mine', label: 'My Events' },
        ].map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={view === t.id}
            onClick={() => setView(t.id)}
            className={`pb-3 pt-1 px-4 font-semibold text-sm relative transition-colors ${
              view === t.id ? 'text-theme-accent' : 'text-theme-text/80 hover:text-theme-text'
            }`}
          >
            {t.label}
            {view === t.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme-accent rounded-full" />}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-5">
            <h3 className="text-label mb-4">Filters</h3>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-theme-text0 uppercase tracking-wider mb-2 block">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="input-base"
                >
                  <option value="">All Statuses</option>
                  <option value={EVENT_STATUS.ACTIVE}>Active</option>
                  <option value={EVENT_STATUS.EXTENDED}>Extended</option>
                  <option value={EVENT_STATUS.CLOSED}>Closed</option>
                </select>
              </div>

              <FilterMulti
                label="Event Type"
                options={Object.values(EVENT_TYPE)}
                selected={filters.types}
                onChange={(types) => setFilters({ ...filters, types })}
              />
              <FilterMulti
                label="Initiative"
                options={facets.initiatives || []}
                selected={filters.initiatives}
                onChange={(initiatives) => setFilters({ ...filters, initiatives })}
              />
              <FilterMulti
                label="Business Category"
                options={facets.categories || []}
                selected={filters.categories}
                onChange={(categories) => setFilters({ ...filters, categories })}
              />
            </div>
          </div>
        </div>

        {/* Event List */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass rounded-2xl h-64 animate-pulse" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="glass rounded-2xl p-16 text-center">
              {view === 'mine'
                ? <Compass className="w-12 h-12 text-theme-text/60 mx-auto mb-4" />
                : <Calendar className="w-12 h-12 text-theme-text/60 mx-auto mb-4" />}
              <h3 className="text-lg font-semibold text-theme-text/80">
                {view === 'mine' ? 'You have not joined any events yet' : 'No events found'}
              </h3>
              <p className="text-sm text-theme-text0 mt-1">
                {view === 'mine' ? 'Browse the Explore tab and register for an event.' : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {list.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  currentUser={currentUser}
                  joining={joinMutation.isPending}
                  onJoin={(id) => joinMutation.mutate(id)}
                  onOpen={(id) => navigate(`/events/${id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
