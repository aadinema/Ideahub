import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../../api';
import { EVENT_TYPE, EVENT_STATUS } from '@shared/constants';
import { Calendar, Users, Target, ArrowRightCircle, CheckCircle2, Lock } from 'lucide-react';
import { useSelector } from 'react-redux';

const TYPE_LABEL = (t) => t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function EventsExplorePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);

  const [filters, setFilters] = useState({ status: EVENT_STATUS.ACTIVE, type: '' });
  const [successMsg, setSuccessMsg] = useState('');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['exploreEvents', filters],
    queryFn: () => eventsAPI.explore(filters).then(r => r.data.data),
  });

  const joinMutation = useMutation({
    mutationFn: (id) => eventsAPI.join(id),
    onSuccess: (res) => {
      setSuccessMsg(res.data?.message || 'Successfully joined!');
      queryClient.invalidateQueries({ queryKey: ['exploreEvents'] });
      setTimeout(() => setSuccessMsg(''), 3000);
    },
  });

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-5">
            <h3 className="text-label mb-4">Filters</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-theme-text0 uppercase tracking-wider mb-2 block">Status</label>
                <select name="status" value={filters.status} onChange={handleFilterChange} className="input-base">
                  <option value="">All Statuses</option>
                  <option value={EVENT_STATUS.ACTIVE}>Active</option>
                  <option value={EVENT_STATUS.EXTENDED}>Extended</option>
                  <option value={EVENT_STATUS.CLOSED}>Closed</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-theme-text0 uppercase tracking-wider mb-2 block">Event Type</label>
                <select name="type" value={filters.type} onChange={handleFilterChange} className="input-base">
                  <option value="">All Types</option>
                  {Object.values(EVENT_TYPE).map((t) => (
                    <option key={t} value={t}>{TYPE_LABEL(t)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Event List */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass rounded-2xl h-64 animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="glass rounded-2xl p-16 text-center">
              <Calendar className="w-12 h-12 text-theme-text/60 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-theme-text/80">No events found</h3>
              <p className="text-sm text-theme-text0 mt-1">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map(event => {
                const participants = event.participants || [];
                const isJoined = currentUser?._id
                  ? participants.some((p) => (p?._id || p)?.toString() === currentUser._id.toString())
                  : false;
                const isClosed = event.status === EVENT_STATUS.CLOSED;

                return (
                  <div key={event._id} className="glass glass-hover rounded-2xl p-6 flex flex-col transition-colors group">
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
                    
                    <p className="text-sm text-theme-text/80 line-clamp-2 mb-6 flex-1">
                      {event.description}
                    </p>

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
                      <button 
                        onClick={() => navigate(`/events/${event._id}`)} 
                        className="btn btn-secondary flex-1"
                      >
                        Details
                      </button>
                      
                      {!isClosed && (
                        <button
                          onClick={() => joinMutation.mutate(event._id)}
                          disabled={isJoined || joinMutation.isPending}
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
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
