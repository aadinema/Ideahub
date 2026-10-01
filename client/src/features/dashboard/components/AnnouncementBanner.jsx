/**
 * AnnouncementBanner — Dismissible, rich-media announcement banner/panel.
 * Replaces boring text lists with a modern enterprise alert card featuring
 * multiple announcements carousel, priority tagging, and session persistence.
 */
import { useState, useEffect } from 'react'
import { Megaphone, X, ChevronLeft, ChevronRight, Sparkles, Clock } from 'lucide-react'
import RichText from '../../../components/RichText'

export default function AnnouncementBanner({ announcements = [], loading = false }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('ideahub_dismissed_announcements') || '[]')
    } catch {
      return []
    }
  })
  const [expanded, setExpanded] = useState(false)

  const activeAnnouncements = announcements.filter((a) => !dismissedIds.includes(a._id))

  useEffect(() => {
    if (currentIndex >= activeAnnouncements.length && activeAnnouncements.length > 0) {
      setCurrentIndex(0)
    }
  }, [activeAnnouncements.length, currentIndex])

  if (loading) {
    return (
      <div className="mb-8 rounded-xl p-4 border border-theme-border/60 bg-surface/60 backdrop-blur-md shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg skeleton shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 skeleton rounded" />
            <div className="h-3 w-2/3 skeleton rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!activeAnnouncements.length) {
    return null
  }

  const current = activeAnnouncements[currentIndex] || activeAnnouncements[0]

  const handleDismiss = (id) => {
    const updated = [...dismissedIds, id]
    setDismissedIds(updated)
    try {
      sessionStorage.setItem('ideahub_dismissed_announcements', JSON.stringify(updated))
    } catch {}
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : activeAnnouncements.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < activeAnnouncements.length - 1 ? prev + 1 : 0))
  }

  return (
    <div
      role="region"
      aria-label="Organizational Announcements"
      className="mb-8 relative overflow-hidden rounded-xl border border-primary/25 bg-linear-to-r from-primary/[0.07] via-surface/90 to-primary/[0.04] backdrop-blur-md p-4 sm:p-5 shadow-card transition-all duration-300"
    >
      {/* Decorative ambient gradient highlight */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl"
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-4">
        {/* Left: Icon & Content */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs mt-0.5">
            <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/20">
                <Megaphone className="w-3 h-3" aria-hidden="true" />
                Announcement
              </span>
              {current.priority && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {current.priority}
                </span>
              )}
              {activeAnnouncements.length > 1 && (
                <span className="text-[11px] text-theme-text0 font-medium ml-1">
                  {currentIndex + 1} of {activeAnnouncements.length}
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-bold text-theme-text mb-1 line-clamp-1">
              {current.title}
            </h3>

            <div
              className={`text-xs text-theme-text/80 leading-relaxed transition-all duration-200 ${
                expanded ? '' : 'line-clamp-2'
              }`}
            >
              <RichText html={current.richTextBody} className="prose-idea-sm" />
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-2.5 text-[11px] text-theme-text0">
              {current.expiryDate && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  Valid until {new Date(current.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="text-primary hover:underline font-semibold cursor-pointer"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Carousel controls + Dismiss button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {activeAnnouncements.length > 1 && (
            <div className="flex items-center gap-1 mr-1">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous announcement"
                className="w-7 h-7 rounded-lg border border-theme-border/70 flex items-center justify-center text-theme-text0 hover:text-theme-text hover:bg-theme-border/30 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next announcement"
                className="w-7 h-7 rounded-lg border border-theme-border/70 flex items-center justify-center text-theme-text0 hover:text-theme-text hover:bg-theme-border/30 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleDismiss(current._id)}
            aria-label="Dismiss announcement"
            className="w-7 h-7 rounded-lg border border-theme-border/60 flex items-center justify-center text-theme-text0 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
