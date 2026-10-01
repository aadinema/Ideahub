/**
 * FeaturedIdeasCarousel — Horizontal scrollable card carousel for Featured Ideas (FR-01-02).
 * Features idea thumbnail/category tag, submitter avatar, and status pill.
 */
import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Lightbulb, ChevronLeft, ChevronRight, ArrowRight, Tag, Sparkles } from 'lucide-react'
import IdeaStatusBadge from '../../../components/IdeaStatusBadge'

export default function FeaturedIdeasCarousel({ ideas = [], loading = false }) {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (el) {
      el.addEventListener('scroll', checkScroll)
      window.addEventListener('resize', checkScroll)
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [ideas.length])

  const scroll = (direction) => {
    const el = scrollRef.current
    if (!el) return
    const offset = direction === 'left' ? -360 : 360
    el.scrollBy({ left: offset, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-36 skeleton rounded" />
          <div className="h-4 w-20 skeleton rounded" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-[320px] sm:w-87.5 shrink-0 p-5 rounded-xl border border-theme-border/50 bg-surface space-y-3">
              <div className="flex justify-between">
                <div className="h-5 w-20 skeleton rounded-full" />
                <div className="h-5 w-16 skeleton rounded-full" />
              </div>
              <div className="h-5 w-3/4 skeleton rounded" />
              <div className="h-4 w-full skeleton rounded" />
              <div className="flex items-center gap-3 pt-3">
                <div className="w-8 h-8 rounded-full skeleton" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-24 skeleton rounded" />
                  <div className="h-3 w-16 skeleton rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!ideas.length) {
    return null
  }

  return (
    <section aria-labelledby="featured-heading" className="mb-8">
      {/* Header with Title + Scroll controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-amber-500" aria-hidden="true" />
          </div>
          <div>
            <h2 id="featured-heading" className="text-base font-bold text-theme-text flex items-center gap-2">
              Featured Ideas
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-theme-border/40 text-theme-text0">
                {ideas.length}
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/gallery"
            className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
          >
            <span>View Gallery</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll featured ideas left"
              className="w-8 h-8 rounded-lg border border-theme-border flex items-center justify-center text-theme-text0 hover:text-theme-text hover:bg-theme-border/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Scroll featured ideas right"
              className="w-8 h-8 rounded-lg border border-theme-border flex items-center justify-center text-theme-text0 hover:text-theme-text hover:bg-theme-border/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory hide-scrollbar -mx-1 px-1"
      >
        {ideas.map((idea) => {
          const submitterName = idea.submittedBy?.name || 'Anonymous'
          const initials = submitterName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
          const category = idea.category || 'Innovation'

          return (
            <Link
              key={idea._id}
              to={`/ideas/${idea._id}`}
              className="card-premium group relative w-77.5 sm:w-85 shrink-0 snap-start p-5 rounded-xl border border-theme-border/70 bg-surface/95 backdrop-blur-md flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-pop transition-all duration-200"
            >
              <div>
                {/* Category tag + Status pill */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    <Tag className="w-3 h-3" aria-hidden="true" />
                    <span className="max-w-32.5 truncate">{category}</span>
                  </span>
                  <IdeaStatusBadge status={idea.status} />
                </div>

                {/* Title */}
                <h3 className="text-sm sm:text-base font-bold text-theme-text group-hover:text-primary transition-colors line-clamp-2 mb-2 leading-snug">
                  {idea.title}
                </h3>

                {/* Snippet */}
                <p className="text-xs text-theme-text0 line-clamp-2 leading-relaxed mb-4">
                  {idea.problemStatement || idea.description || 'Explores high-impact organizational transformation and operational efficiency.'}
                </p>
              </div>

              {/* Submitter & Metadata footer */}
              <div className="pt-3 border-t border-theme-border/50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-linear-to-tr from-primary to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-theme-text truncate leading-tight">
                      {submitterName}
                    </p>
                    <p className="text-[10px] text-theme-text0 truncate">
                      {idea.department || idea.submittedBy?.department || 'Cross-dept'}
                    </p>
                  </div>
                </div>

                {idea.ideaId && (
                  <span className="text-[10px] font-mono text-theme-text0 px-1.5 py-0.5 rounded bg-theme-border/40 shrink-0">
                    {idea.ideaId}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
