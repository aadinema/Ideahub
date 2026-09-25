/**
 * GalleryPage — FR-06 Innovation Showcase.
 * Public (authenticated) gallery of published ideas with search + filters,
 * a top-contributors leaderboard, and admin unpublish.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { galleryAPI } from '../../api';
import useRole from '../../hooks/useRole';
import useDebounce from '../../hooks/useDebounce';
import RichText from '../../components/RichText';
import Modal from '../../components/Modal';
import { Search, Trophy, Star, TrendingUp, Lightbulb, AlertCircle, EyeOff } from 'lucide-react';

const CATEGORIES = [
  'Technology & Innovation', 'Process Improvement', 'Cost Optimization',
  'Customer Experience', 'Employee Experience', 'Compliance & Risk', 'Business Development',
];

export default function GalleryPage() {
  const queryClient = useQueryClient();
  const { hasRole } = useRole();
  const isAdmin = hasRole('admin');

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [filters, setFilters] = useState({ category: '', department: '' });

  // Unpublish modal state
  const [unpublishTarget, setUnpublishTarget] = useState(null);
  const [justification, setJustification] = useState('');
  const [unpublishError, setUnpublishError] = useState('');

  const { data: galleryData, isLoading } = useQuery({
    queryKey: ['gallery', debouncedSearch, filters],
    queryFn: () => galleryAPI.list({ q: debouncedSearch, ...filters, limit: 12 }).then((r) => r.data),
  });

  const { data: topContributors = [] } = useQuery({
    queryKey: ['topContributors'],
    queryFn: () => galleryAPI.getTopContributors({ limit: 5 }).then((r) => r.data.data),
  });

  const unpublishMutation = useMutation({
    mutationFn: () => galleryAPI.unpublish(unpublishTarget._id, { justification }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      queryClient.invalidateQueries({ queryKey: ['topContributors'] });
      closeUnpublish();
    },
    onError: (err) => setUnpublishError(err.response?.data?.message || 'Failed to unpublish.'),
  });

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const openUnpublish = (e, idea) => {
    e.preventDefault();
    e.stopPropagation();
    setUnpublishTarget(idea);
    setJustification('');
    setUnpublishError('');
  };
  const closeUnpublish = () => {
    setUnpublishTarget(null);
    setJustification('');
    setUnpublishError('');
  };
  const submitUnpublish = (e) => {
    e.preventDefault();
    if (justification.trim().length < 20) {
      setUnpublishError('Justification must be at least 20 characters.');
      return;
    }
    unpublishMutation.mutate();
  };

  const ideas = galleryData?.data || [];

  return (
    <div className="page-enter max-w-[1400px] mx-auto pb-12">
      <div className="mb-10 text-center">
        <h1 className="text-display text-5xl text-theme-text mb-4">Innovation Showcase</h1>
        <p className="text-theme-text/80 text-lg max-w-2xl mx-auto">
          Explore the most impactful ideas published across the organization.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Gallery Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search & Filters */}
          <div className="glass rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center relative z-20">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-text0" />
              <input
                type="text"
                placeholder="Search ideas, keywords, solutions..."
                className="input-base pl-10 w-full text-lg py-3"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search published ideas"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select name="category" value={filters.category} onChange={handleFilterChange} className="input-base" aria-label="Filter by category">
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                name="department"
                value={filters.department}
                onChange={handleFilterChange}
                placeholder="Department"
                className="input-base"
                aria-label="Filter by department"
                list="gallery-depts"
              />
              <datalist id="gallery-depts">
                {['Engineering', 'Sales', 'Marketing', 'Operations', 'Finance', 'HR'].map((d) => <option key={d} value={d} />)}
              </datalist>
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass rounded-2xl h-64 animate-pulse" />
              ))}
            </div>
          ) : ideas.length === 0 ? (
            <div className="glass rounded-2xl p-16 text-center">
              <Lightbulb className="w-16 h-16 text-theme-text/40 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-theme-text/80">No published ideas found</h3>
              <p className="text-theme-text0 mt-2">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ideas.map((idea) => (
                <Link
                  to={`/ideas/${idea._id}`}
                  key={idea._id}
                  className="glass glass-hover rounded-2xl p-6 flex flex-col transition-all group h-full relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Star className="w-5 h-5 text-theme-accent" />
                  </div>

                  <div className="flex gap-2 mb-4 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
                      {idea.category || 'Idea'}
                    </span>
                    {idea.isFeatured && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-amber-500/15 text-amber-600 border border-amber-500/20">
                        Featured
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-theme-text mb-2 group-hover:text-theme-accent transition-colors line-clamp-2">
                    {idea.title}
                  </h3>

                  <div className="text-sm text-theme-text/80 line-clamp-3 mb-6 flex-1">
                    <RichText html={idea.problemStatement} />
                  </div>

                  <div className="mt-auto pt-4 border-t border-theme-border/50 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-theme-text/80">{idea.submittedBy?.name}</p>
                      <p className="text-[10px] text-theme-text0">{idea.department}</p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={(e) => openUnpublish(e, idea)}
                        className="text-[10px] flex items-center gap-1 text-rose-600 hover:text-rose-500 font-semibold"
                        aria-label={`Unpublish ${idea.title}`}
                      >
                        <EyeOff className="w-3 h-3" /> Unpublish
                      </button>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Trophy className="w-24 h-24 text-theme-accent" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-theme-accent" />
                <h3 className="text-lg font-bold text-theme-text">Top Contributors</h3>
              </div>

              <div className="space-y-4">
                {topContributors.map((user, idx) => (
                  <div key={user._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center font-bold text-xs text-theme-text/80">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-theme-text">{user.name}</p>
                        <p className="text-[10px] text-theme-text0">{user.department}</p>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-md">
                      {user.count} <span className="font-normal text-emerald-600/70">pub</span>
                    </div>
                  </div>
                ))}
                {topContributors.length === 0 && (
                  <p className="text-sm text-theme-text0 italic">No contributors yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Admin Unpublish Modal ── */}
      <Modal
        open={!!unpublishTarget}
        onClose={closeUnpublish}
        title="Unpublish Idea"
        description={unpublishTarget ? <>Removing <strong className="text-theme-text">{unpublishTarget.title}</strong> from the gallery.</> : ''}
      >
        {unpublishError && (
          <div role="alert" className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-600 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{unpublishError}</span>
          </div>
        )}
        <form onSubmit={submitUnpublish} className="space-y-4">
          <div>
            <label htmlFor="unpublish-reason" className="text-label block mb-2">
              Justification <span className="text-rose-500">* (min 20 chars)</span>
            </label>
            <textarea
              id="unpublish-reason"
              className="input-base resize-y"
              rows={4}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Reason for removing this idea from the public gallery…"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-theme-border/50">
            <button type="button" onClick={closeUnpublish} className="btn btn-ghost" disabled={unpublishMutation.isPending}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger" disabled={unpublishMutation.isPending}>
              {unpublishMutation.isPending ? 'Unpublishing…' : 'Unpublish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
