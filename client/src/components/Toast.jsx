/**
 * client/src/components/Toast.jsx
 * Lightweight, dependency-free inline toast.
 *
 * Presentational only: the caller owns the message and when it is shown. It is
 * intentionally not a global provider yet — pages that need transient feedback
 * render it locally. A provider can wrap this component later without changing
 * call sites.
 */
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const TONES = {
  success: { cls: 'bg-success-light border-success/30 text-success-text', Icon: CheckCircle2 },
  error:   { cls: 'bg-error-light border-error/30 text-error-text',       Icon: AlertTriangle },
  info:    { cls: 'bg-info-light border-info/30 text-info-text',          Icon: Info },
};

/**
 * @param {'success'|'error'|'info'} [tone='info']
 * @param {string} message
 * @param {() => void} [onClose]  renders a dismiss button when provided
 * @param {string} [className]
 */
export default function Toast({ tone = 'info', message, onClose, className = '' }) {
  if (!message) return null;
  const { cls, Icon } = TONES[tone] || TONES.info;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 p-4 rounded-xl border text-sm shadow-pop ${cls} ${className}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p className="flex-1">{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
