/** Status badge for idea status — maps status string to CSS class */
const STATUS_META = {
  draft:                        { label: 'Draft',              cls: 'badge-draft'          },
  submitted:                    { label: 'Submitted',          cls: 'badge-submitted'       },
  under_supervisor_review:      { label: 'Supervisor Review',  cls: 'badge-supervisor'      },
  supervisor_approved:          { label: 'Approved',           cls: 'badge-approved'        },
  returned:                     { label: 'Returned',           cls: 'badge-supervisor'      },
  supervisor_rejected:          { label: 'Rejected',           cls: 'badge-rejected'        },
  under_department_evaluation:  { label: 'Dept. Evaluation',   cls: 'badge-evaluation'      },
  shortlisted:                  { label: 'Shortlisted',        cls: 'badge-shortlisted'     },
  rejected_by_dept:             { label: 'Dept. Rejected',     cls: 'badge-rejected'        },
  under_committee_review:       { label: 'Committee Review',   cls: 'badge-committee'       },
  approved_for_publishing:      { label: 'Approved',           cls: 'badge-approved'        },
  approved_for_implementation:  { label: 'For Implementation', cls: 'badge-approved'        },
  committee_rejected:           { label: 'Rejected',           cls: 'badge-rejected'        },
  published:                    { label: 'Published',          cls: 'badge-published'       },
  implementation_initiated:     { label: 'Implementation',     cls: 'badge-implementation'  },
  implementation_in_progress:   { label: 'In Progress',        cls: 'badge-implementation'  },
  implementation_completed:     { label: 'Completed',          cls: 'badge-approved'        },
  benefits_recorded:            { label: 'Benefits Recorded',  cls: 'badge-approved'        },
  outcome_monitored:            { label: 'Monitoring',         cls: 'badge-implementation'  },
  closed:                       { label: 'Closed',             cls: 'badge-closed'          },
}

export default function IdeaStatusBadge({ status, className = '' }) {
  const meta = STATUS_META[status] || { label: status, cls: 'badge-draft' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${meta.cls} ${className}`}>
      {meta.label}
    </span>
  )
}
