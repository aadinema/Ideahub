/**
 * Shared error state for failed queries.
 * Visual only — it renders a message and an optional retry affordance; it never
 * refetches on its own, so callers stay in control of the TanStack Query call.
 */
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  className = '',
  compact = false,
}) {
  return (
    <div className={`state state-error ${compact ? 'state-compact' : ''} ${className}`} role="alert">
      <div className="state-icon" aria-hidden="true">
        <AlertTriangle className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
      </div>
      <p className="state-title">{title}</p>
      {message && <p className="state-desc">{message}</p>}
      {onRetry && (
        <div className="state-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
            <RefreshCw className="w-4 h-4" />
            {retryLabel}
          </button>
        </div>
      )}
    </div>
  )
}
