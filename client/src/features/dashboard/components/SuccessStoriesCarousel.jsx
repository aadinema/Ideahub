/**
 * SuccessStoriesCarousel — Horizontal scrollable card carousel for Implemented Success Stories (FR-01-03).
 * Highlights implemented ideas with verified business benefits and ROI figures.
 */
import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Rocket, ChevronLeft, ChevronRight, TrendingUp, CheckCircle2, ArrowRight } from 'lucide-react'

export default function SuccessStoriesCarousel({ stories = [], loading = false }) {
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
  }, [stories.length])

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
          <div className="h-6 w-44 skeleton rounded" />
          <div className="h-4 w-20 skeleton rounded" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="w-[320px] sm:w-87.5 shrink-0 p-5 rounded-xl border border-theme-border/50 bg-surface space-y-3">
              <div className="h-5 w-24 skeleton rounded-full" />
              <div className="h-5 w-3/4 skeleton rounded" />
              <div className="h-4 w-full skeleton rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!stories.length) {
    return null
  }

  return (
    <section aria-labelledby="success-heading" className="mb-8">
      {/* Header with Title + Scroll controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-emerald-500" aria-hidden="true" />
          </div>
          <div>
            <h2 id="success-heading" className="text-base font-bold text-theme-text flex items-center gap-2">
              Implemented Success Stories
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Verified ROI
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/gallery"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 transition-colors"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll success stories left"
              className="w-8 h-8 rounded-lg border border-theme-border flex items-center justify-center text-theme-text0 hover:text-theme-text hover:bg-theme-border/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Scroll success stories right"
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
        {stories.map((story) => {
          const submitterName = story.submittedBy?.name || 'Innovation Team'
          const initials = submitterName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
          const savingsINR = story.benefit?.netAnnualSavingsINR
          const formattedSavings = savingsINR
            ? savingsINR >= 10000000
              ? `₹${(savingsINR / 10000000).toFixed(1)}Cr Saved`
              : savingsINR >= 100000
              ? `₹${(savingsINR / 100000).toFixed(1)}L Saved`
              : `₹${savingsINR.toLocaleString('en-IN')} Saved`
            : 'Process Realized'

          return (
            <Link
              key={story._id}
              to={`/ideas/${story._id}`}
              className="card-premium group relative w-77.5 sm:w-85 shrink-0 snap-start p-5 rounded-xl border border-emerald-500/25 bg-linear-to-br from-surface via-surface to-emerald-500/4 backdrop-blur-md flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-pop transition-all duration-200"
            >
              <div>
                {/* Benefit Pill + Implemented badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    <TrendingUp className="w-3 h-3" aria-hidden="true" />
                    <span>{formattedSavings}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Implemented</span>
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm sm:text-base font-bold text-theme-text group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2 leading-snug">
                  {story.title}
                </h3>

                {/* Outcome summary */}
                <p className="text-xs text-theme-text0 line-clamp-2 leading-relaxed mb-4">
                  {story.benefit?.operationalDescription || story.solutionDescription || 'Successfully deployed across departments with measurable efficiency improvements.'}
                </p>
              </div>

              {/* Submitter footer */}
              <div className="pt-3 border-t border-theme-border/50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-linear-to-tr from-emerald-500 to-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-theme-text truncate leading-tight">
                      {submitterName}
                    </p>
                    <p className="text-[10px] text-theme-text0 truncate">
                      {story.department || story.submittedBy?.department || 'Operations'}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-emerald-600/80 dark:text-emerald-400/80 px-1.5 py-0.5 rounded bg-emerald-500/10 shrink-0 font-medium">
                  Verified
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
