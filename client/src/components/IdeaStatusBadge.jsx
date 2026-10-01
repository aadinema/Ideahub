/** Status badge for idea status — maps status string to CSS class */
const STATUS_META = {
  draft:                        { label: 'Draft',              cls: 'badge-draft',          dot: 'bg-slate-400' },
  submitted:                    { label: 'Submitted',          cls: 'badge-submitted',      dot: 'bg-blue-500' },
  under_supervisor_review:      { label: 'Supervisor Review',  cls: 'badge-supervisor',     dot: 'bg-amber-500' },
  supervisor_approved:          { label: 'Approved',           cls: 'badge-approved',       dot: 'bg-emerald-500' },
  returned:                     { label: 'Returned',           cls: 'badge-supervisor',     dot: 'bg-amber-500' },
  supervisor_rejected:          { label: 'Rejected',           cls: 'badge-rejected',       dot: 'bg-red-500' },
  under_department_evaluation:  { label: 'Dept. Evaluation',   cls: 'badge-evaluation',     dot: 'bg-amber-500' },
  shortlisted:                  { label: 'Shortlisted',        cls: 'badge-shortlisted',    dot: 'bg-emerald-500' },
  rejected_by_dept:             { label: 'Dept. Rejected',     cls: 'badge-rejected',       dot: 'bg-red-500' },
  under_committee_review:       { label: 'Committee Review',   cls: 'badge-committee',      dot: 'bg-amber-500' },
  approved_for_publishing:      { label: 'Approved',           cls: 'badge-approved',       dot: 'bg-emerald-500' },
  approved_for_implementation:  { label: 'For Implementation', cls: 'badge-approved',       dot: 'bg-emerald-500' },
  committee_rejected:           { label: 'Rejected',           cls: 'badge-rejected',       dot: 'bg-red-500' },
  published:                    { label: 'Published',          cls: 'badge-published',      dot: 'bg-purple-500' },
  implementation_initiated:     { label: 'Implementation',     cls: 'badge-implementation', dot: 'bg-purple-500' },
  implementation_in_progress:   { label: 'In Progress',        cls: 'badge-implementation', dot: 'bg-purple-500' },
  implementation_completed:     { label: 'Completed',          cls: 'badge-approved',       dot: 'bg-emerald-500' },
  benefits_recorded:            { label: 'Benefits Recorded',  cls: 'badge-implementation', dot: 'bg-purple-500' },
  outcome_monitored:            { label: 'Monitoring',         cls: 'badge-implementation', dot: 'bg-purple-500' },
  closed:                       { label: 'Closed',             cls: 'badge-closed',         dot: 'bg-slate-400' },
}

export default function IdeaStatusBadge({ status, className = '', showDot = true }) {
  const meta = STATUS_META[status] || { label: status || 'Unknown', cls: 'badge-draft', dot: 'bg-slate-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-tight border whitespace-nowrap shadow-xs ${meta.cls} ${className}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} aria-hidden="true" />}
      <span>{meta.label}</span>
    </span>
  )
}
