/**
 * Shared empty state. `icon` is any lucide icon component, matching the
 * `KpiCard({ icon: Icon })` convention already in the codebase.
 */
import { Inbox } from 'lucide-react'

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  message,
  action,
  className = '',
}) {
  return (
    <div className={`state state-empty ${className}`}>
      <div className="state-icon" aria-hidden="true">
        <Icon className="w-6 h-6" />
      </div>
      <p className="state-title">{title}</p>
      {message && <p className="state-desc">{message}</p>}
      {action && <div className="state-actions">{action}</div>}
    </div>
  )
}
