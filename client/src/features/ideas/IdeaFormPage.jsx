/**
 * IdeaFormPage — FR-02 complete multi-section form.
 *
 * Sections (matching FRD FR-02-01 through FR-02-07):
 *   1. Basic Info (title, category, type, dept, initiative, keywords)
 *   2. Description (problem, challenges, solution, innovation, outcome — rich text)
 *   3. Benefit Types (checkboxes)
 *   4. Attachments (up to 5 files, 20MB each)
 *   5. Link Event (optional)
 *
 * Features:
 * - Auto-save every 2 minutes (FR-02-05) for BOTH new and existing drafts,
 *   plus beforeunload guard when there are unsaved edits.
 * - Duplicate warning with dismissable alert (FR-02-06)
 * - Full validation before submit (FR-02-02, FR-02-03)
 * - Client-side file size/type validation (FR-02-04)
 * - Edit mode (pre-fills from API when editing a returned draft)
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ideasAPI, eventsAPI } from '../../api'
import {
  BENEFIT_TYPE,
  UPLOAD_CONSTRAINTS,
  AUTO_SAVE_INTERVAL_MS,
  MIN_CHARS,
  EVENT_STATUS,
} from '@shared/constants'
import RichTextEditor from '../../components/RichTextEditor'
import { AlertCircle, CheckCircle2, Info, Upload, X, Lightbulb, ChevronRight, Save } from 'lucide-react'

// Human labels for the 8 canonical benefit types (single source of truth).
const BENEFIT_LABELS = {
  [BENEFIT_TYPE.COST_REDUCTION]: 'Cost Reduction',
  [BENEFIT_TYPE.TIME_SAVINGS]: 'Time Savings',
  [BENEFIT_TYPE.AUTOMATION]: 'Automation',
  [BENEFIT_TYPE.CUSTOMER_EXPERIENCE]: 'Customer Experience',
  [BENEFIT_TYPE.REVENUE_GENERATION]: 'Revenue Generation',
  [BENEFIT_TYPE.EMPLOYEE_SATISFACTION]: 'Employee Satisfaction',
  [BENEFIT_TYPE.COMPLIANCE_IMPROVEMENT]: 'Compliance Improvement',
  [BENEFIT_TYPE.PROCESS_OPTIMIZATION]: 'Process Optimization',
}
const BENEFIT_TYPES = Object.values(BENEFIT_TYPE).map((value) => ({ value, label: BENEFIT_LABELS[value] }))

const SECTIONS = [
  { id: 'basic',       label: 'Basic Info',    num: 1 },
  { id: 'description', label: 'Description',   num: 2 },
  { id: 'benefits',    label: 'Benefits',      num: 3 },
  { id: 'attachments', label: 'Attachments',   num: 4 },
  { id: 'event',       label: 'Ideathon',      num: 5 },
]

const ALLOWED_EXTS = UPLOAD_CONSTRAINTS.ALLOWED_EXTENSIONS.join(',')
const MAX_SIZE = UPLOAD_CONSTRAINTS.MAX_SIZE_BYTES
const MAX_FILES = UPLOAD_CONSTRAINTS.MAX_FILES

const DRAFT_FIELDS = [
  'title', 'category', 'ideaType', 'department', 'initiative', 'keywords',
  'problemStatement', 'currentChallenges', 'proposedSolution',
  'innovationDescription', 'expectedOutcome', 'benefitTypes', 'linkedEventId',
  'estimatedValueINR',
]

const stripHtml = (s) => (s || '').replace(/<[^>]*>/g, '').replace(/&\w+;/g, ' ').trim()

const emptyForm = {
  title:                '',
  category:             '',
  ideaType:             '',
  department:           '',
  initiative:           '',
  keywords:             '',
  problemStatement:     '',
  currentChallenges:    '',
  proposedSolution:     '',
  innovationDescription:'',
  expectedOutcome:      '',
  benefitTypes:         [],
  linkedEventId:        '',
  estimatedValueINR:    '',
}

// Convert the form's keywords string into the array the draft API expects.
const toDraftPayload = (form) => ({
  ...form,
  keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean),
})

export default function IdeaFormPage() {
  const { id: editId }    = useParams()
  const [searchParams]    = useSearchParams()
  const navigate          = useNavigate()
  const queryClient       = useQueryClient()

  const initialEventId = searchParams.get('eventId') || ''

  const [form, setForm]               = useState({ ...emptyForm, linkedEventId: initialEventId })
  const [files, setFiles]             = useState([])
  const [activeSection, setSection]   = useState('basic')
  const [errors, setErrors]           = useState({})
  const [duplicates, setDuplicates]   = useState([])
  const [dupDismissed, setDupDismissed] = useState(false)
  const [lastSaved, setLastSaved]     = useState(null)
  const [fileError, setFileError]     = useState('')
  const [globalError, setGlobalError] = useState('')
  const [success, setSuccess]         = useState(false)

  // Draft id: starts as the route param; a new idea acquires one on first save.
  const [draftId, setDraftId] = useState(editId || null)
  const isEdit = !!editId
  const dirtyRef = useRef(false)

  // ── Load existing idea for edit ──
  const { data: existingIdea } = useQuery({
    queryKey: ['idea', editId],
    queryFn: () => ideasAPI.getById(editId),
    select: (r) => r.data.data,
    enabled: isEdit,
  })

  // ── Active events for the linking selector (FR-02-07) ──
  const { data: activeEvents = [] } = useQuery({
    queryKey: ['activeEventsForLink'],
    queryFn: () => eventsAPI.explore({ status: EVENT_STATUS.ACTIVE }).then((r) => r.data.data),
  })

  // ── Deadline guard (FR-IE-06): resolve the linked event even when it has
  //    closed and therefore dropped out of the active list. ──
  const linkedEventInList = activeEvents.find((e) => e._id === form.linkedEventId)
  const { data: linkedEventDetail } = useQuery({
    queryKey: ['linkedEvent', form.linkedEventId],
    queryFn: () => eventsAPI.getById(form.linkedEventId).then((r) => r.data.data),
    enabled: !!form.linkedEventId && !linkedEventInList,
    retry: false,
  })
  const effectiveEvent = linkedEventInList || linkedEventDetail
  const eventDeadlinePassed = !!effectiveEvent && (
    effectiveEvent.status === EVENT_STATUS.CLOSED ||
    new Date(effectiveEvent.endDate).getTime() < Date.now()
  )

  useEffect(() => {
    if (existingIdea) {
      setForm({
        title:                existingIdea.title             || '',
        category:             existingIdea.category          || '',
        ideaType:             existingIdea.ideaType          || '',
        department:           existingIdea.department        || '',
        initiative:           existingIdea.initiative        || '',
        keywords:             (existingIdea.keywords || []).join(', '),
        problemStatement:     existingIdea.problemStatement  || '',
        currentChallenges:    existingIdea.currentChallenges || '',
        proposedSolution:     existingIdea.proposedSolution  || '',
        innovationDescription:existingIdea.innovationDescription || '',
        expectedOutcome:      existingIdea.expectedOutcome   || '',
        benefitTypes:         existingIdea.benefitTypes      || [],
        linkedEventId:        existingIdea.linkedEventId?._id || '',
        estimatedValueINR:    existingIdea.estimatedValueINR ?? '',
      })
    }
  }, [existingIdea])

  // ── Duplicate check (debounced on title change) ──
  useEffect(() => {
    if (!form.title || form.title.length < 8) {
      setDuplicates([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await ideasAPI.duplicateCheck({ title: form.title, keywords: form.keywords })
        if (data.hasDuplicates) setDuplicates(data.data)
        else setDuplicates([])
      } catch {}
    }, 800)
    return () => clearTimeout(timer)
  }, [form.title, form.keywords])

  // ── Save draft (creates a draft on first save for a new idea) ──
  const saveDraft = useCallback(async () => {
    // Nothing meaningful to save yet.
    if (!form.title.trim()) return null
    const payload = toDraftPayload(form)

    if (draftId) {
      await ideasAPI.autoSave(draftId, payload)
      return draftId
    }
    // New idea: create a draft record (no attachments yet), remember its id.
    const fd = new FormData()
    Object.entries(payload).forEach(([key, val]) => {
      if (Array.isArray(val)) val.forEach((v) => fd.append(key, v))
      else if (val != null) fd.append(key, val)
    })
    const res = await ideasAPI.create(fd) // status defaults to draft
    const newId = res.data?.data?._id
    if (newId) setDraftId(newId)
    return newId
  }, [form, draftId])

  const autoSaveMutation = useMutation({
    mutationFn: saveDraft,
    onSuccess: (id) => {
      if (id) {
        setLastSaved(new Date())
        dirtyRef.current = false
      }
    },
  })

  const doAutoSave = useCallback(() => {
    if (!dirtyRef.current) return
    autoSaveMutation.mutate()
  }, [autoSaveMutation])

  // ── Auto-save timer (every 2 min when there are unsaved edits) ──
  useEffect(() => {
    const timer = setInterval(doAutoSave, AUTO_SAVE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [doAutoSave])

  // ── Warn on unload with unsaved edits ──
  useEffect(() => {
    const handler = (e) => {
      if (dirtyRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // ── Form field change ──
  const handleChange = (field, value) => {
    dirtyRef.current = true
    setForm((p) => ({ ...p, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }))
    if (globalError) setGlobalError('')
  }

  const toggleBenefit = (val) => {
    dirtyRef.current = true
    setForm((p) => ({
      ...p,
      benefitTypes: p.benefitTypes.includes(val)
        ? p.benefitTypes.filter((b) => b !== val)
        : [...p.benefitTypes, val],
    }))
    if (errors.benefitTypes) setErrors((e) => ({ ...e, benefitTypes: '' }))
  }

  // ── File handling with size/type/count validation (FR-02-04) ──
  const handleFiles = (e) => {
    setFileError('')
    const incoming = Array.from(e.target.files || [])
    const accepted = []
    for (const f of incoming) {
      const ext = '.' + f.name.split('.').pop().toLowerCase()
      const typeOk =
        UPLOAD_CONSTRAINTS.ALLOWED_MIME_TYPES.includes(f.type) ||
        UPLOAD_CONSTRAINTS.ALLOWED_EXTENSIONS.includes(ext)
      if (!typeOk) {
        setFileError(`"${f.name}" is not an allowed file type.`)
        continue
      }
      if (f.size > MAX_SIZE) {
        setFileError(`"${f.name}" exceeds the ${(MAX_SIZE / 1024 / 1024).toFixed(0)} MB limit.`)
        continue
      }
      accepted.push(f)
    }
    setFiles((prev) => {
      const combined = [...prev, ...accepted]
      if (combined.length > MAX_FILES) {
        setFileError(`You can attach at most ${MAX_FILES} files.`)
        return combined.slice(0, MAX_FILES)
      }
      return combined
    })
    e.target.value = '' // allow re-selecting the same file
  }
  const removeFile = (idx) => setFiles((f) => f.filter((_, i) => i !== idx))

  // ── Validation ──
  const validate = () => {
    const errs = {}
    if (!form.title.trim())            errs.title = 'Title is required'
    if (!form.category.trim())         errs.category = 'Category is required'
    if (!form.department.trim())       errs.department = 'Department is required'
    if (stripHtml(form.problemStatement).length < MIN_CHARS.PROBLEM_STATEMENT)
      errs.problemStatement = `Problem statement must be at least ${MIN_CHARS.PROBLEM_STATEMENT} characters`
    if (form.benefitTypes.length === 0) errs.benefitTypes = 'Select at least one benefit type'
    // Estimated value is optional, but when given must be a non-negative number
    if (form.estimatedValueINR !== '') {
      const num = Number(form.estimatedValueINR)
      if (Number.isNaN(num) || num < 0) errs.estimatedValueINR = 'Enter a valid amount (0 or more)'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Submit ──
  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload = toDraftPayload(form)

      // Existing/known draft: persist latest fields, then submit.
      if (draftId) {
        await ideasAPI.autoSave(draftId, payload)
        return ideasAPI.submit(draftId)
      }

      // Brand-new idea with attachments: create + submit in one multipart request.
      const fd = new FormData()
      Object.entries(payload).forEach(([key, val]) => {
        if (Array.isArray(val)) val.forEach((v) => fd.append(key, v))
        else if (val != null) fd.append(key, val)
      })
      files.forEach((f) => fd.append('attachments', f))
      return ideasAPI.create(fd, { submit: true })
    },
    onSuccess: () => {
      dirtyRef.current = false
      setSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['my-ideas'] })
      queryClient.invalidateQueries({ queryKey: ['kpis'] })
      setTimeout(() => navigate('/ideas'), 2000)
    },
    onError: (err) => {
      setGlobalError(err.response?.data?.message || 'Submission failed. Please try again.')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) {
      if (errors.title || errors.category || errors.department) setSection('basic')
      else if (errors.problemStatement) setSection('description')
      else if (errors.benefitTypes) setSection('benefits')
      return
    }
    submitMutation.mutate()
  }

  if (success) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-20 h-20 rounded-full bg-emerald-400/15 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <div className="text-center">
          <h2 className="text-display text-2xl text-theme-text mb-2">Idea Submitted!</h2>
          <p className="text-theme-text0">Your idea has been routed to your supervisor for review. Redirecting…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-enter max-w-[860px] mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center gap-2 text-sm text-theme-text0 mb-6">
        <span>Ideas</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-theme-text/80">{isEdit ? 'Edit Idea' : 'Submit New Idea'}</span>
        {lastSaved && (
          <span className="ml-auto text-xs text-emerald-600 flex items-center gap-1">
            <Save className="w-3 h-3" />
            Auto-saved {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>

      <h1 className="text-display text-2xl text-theme-text mb-8">
        {isEdit ? 'Edit Your Idea' : 'Share Your Innovation Idea'}
      </h1>

      {/* ── Duplicate warning (FR-02-06) ── */}
      {duplicates.length > 0 && !dupDismissed && (
        <div className="mb-6 p-4 rounded-xl bg-theme-accent/10 border border-amber-500/25 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-theme-accent flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-700 mb-1">
              Similar ideas may already exist — please review before submitting.
            </p>
            <ul className="text-xs text-theme-text0 space-y-1">
              {duplicates.map((d) => (
                <li key={d._id}>· {d.title} ({d.ideaId}) — {d.status}</li>
              ))}
            </ul>
            <p className="text-xs text-theme-text0 mt-2">You may still submit if your idea is sufficiently different.</p>
          </div>
          <button
            onClick={() => setDupDismissed(true)}
            aria-label="Dismiss duplicate warning"
            className="text-amber-600 hover:text-amber-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Global error ── */}
      {globalError && (
        <div role="alert" className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-rose-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {globalError}
        </div>
      )}

      {/* ── Section tabs ── */}
      <div className="flex gap-1 mb-8 overflow-x-auto pb-1" role="tablist">
        {SECTIONS.map((s) => {
          const hasError = (
            (s.id === 'basic' && (errors.title || errors.category || errors.department)) ||
            (s.id === 'description' && errors.problemStatement) ||
            (s.id === 'benefits' && errors.benefitTypes)
          )
          return (
            <button
              key={s.id}
              role="tab"
              id={`tab-${s.id}`}
              aria-selected={activeSection === s.id}
              onClick={() => setSection(s.id)}
              className={`btn btn-sm flex-shrink-0 relative ${activeSection === s.id ? 'btn-primary' : 'btn-secondary'}`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: activeSection === s.id ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.05)' }}>
                {s.num}
              </span>
              {s.label}
              {hasError && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />}
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} noValidate encType="multipart/form-data">
        {/* ── Section 1: Basic Info ── */}
        {activeSection === 'basic' && (
          <div className="glass rounded-2xl p-6 space-y-5">
            <h2 className="text-heading text-base text-theme-text">1. Basic Information</h2>

            {/* Title */}
            <div>
              <label htmlFor="idea-title" className="text-label block mb-2">
                Idea Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="idea-title"
                type="text"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className={`input-base ${errors.title ? 'border-rose-500/60' : ''}`}
                placeholder="Concise, descriptive title for your idea"
                maxLength={300}
                aria-required="true"
                aria-describedby={errors.title ? 'err-title' : undefined}
              />
              {errors.title && <p id="err-title" role="alert" className="text-xs text-rose-500 mt-1">{errors.title}</p>}
              <p className="text-xs text-theme-text0 mt-1">{form.title.length}/300</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label htmlFor="idea-category" className="text-label block mb-2">
                  Category <span className="text-rose-500">*</span>
                </label>
                <input
                  id="idea-category"
                  type="text"
                  list="categories-list"
                  value={form.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className={`input-base ${errors.category ? 'border-rose-500/60' : ''}`}
                  placeholder="e.g. Technology & Innovation"
                  aria-required="true"
                />
                <datalist id="categories-list">
                  {['Technology & Innovation','Process Improvement','Cost Optimization','Customer Experience','Employee Experience','Compliance & Risk','Business Development'].map(c => <option key={c} value={c} />)}
                </datalist>
                {errors.category && <p role="alert" className="text-xs text-rose-500 mt-1">{errors.category}</p>}
              </div>
              {/* Idea Type */}
              <div>
                <label htmlFor="idea-type" className="text-label block mb-2">Idea Type</label>
                <select id="idea-type" value={form.ideaType} onChange={(e) => handleChange('ideaType', e.target.value)} className="input-base">
                  <option value="">Select type…</option>
                  <option value="incremental">Incremental</option>
                  <option value="radical">Radical</option>
                  <option value="disruptive">Disruptive</option>
                  <option value="architectural">Architectural</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Department */}
              <div>
                <label htmlFor="idea-dept" className="text-label block mb-2">
                  Department <span className="text-rose-500">*</span>
                </label>
                <input
                  id="idea-dept"
                  type="text"
                  value={form.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  className={`input-base ${errors.department ? 'border-rose-500/60' : ''}`}
                  placeholder="Your department"
                  aria-required="true"
                />
                {errors.department && <p role="alert" className="text-xs text-rose-500 mt-1">{errors.department}</p>}
              </div>
              {/* Initiative */}
              <div>
                <label htmlFor="idea-initiative" className="text-label block mb-2">Initiative</label>
                <input
                  id="idea-initiative"
                  type="text"
                  list="initiatives-list"
                  value={form.initiative}
                  onChange={(e) => handleChange('initiative', e.target.value)}
                  className="input-base"
                  placeholder="Link to a strategic initiative"
                />
                <datalist id="initiatives-list">
                  {['Digital Transformation','Operational Excellence','Customer First','Green & Sustainability','Talent & Culture'].map(i => <option key={i} value={i} />)}
                </datalist>
              </div>
            </div>

            {/* Keywords */}
            <div>
              <label htmlFor="idea-keywords" className="text-label block mb-2">
                Keywords <span className="text-theme-text0">(comma-separated)</span>
              </label>
              <input
                id="idea-keywords"
                type="text"
                value={form.keywords}
                onChange={(e) => handleChange('keywords', e.target.value)}
                className="input-base"
                placeholder="automation, cost, workflow, digital"
              />
              <p className="text-xs text-theme-text0 mt-1">Used for search and duplicate detection</p>
            </div>
          </div>
        )}

        {/* ── Section 2: Description (rich text) ── */}
        {activeSection === 'description' && (
          <div className="glass rounded-2xl p-6 space-y-6">
            <h2 className="text-heading text-base text-theme-text">2. Idea Description</h2>

            {[
              { field: 'problemStatement',     label: 'Problem Statement',      required: true,  hint: 'Describe the problem or opportunity', minLen: MIN_CHARS.PROBLEM_STATEMENT },
              { field: 'currentChallenges',    label: 'Current Challenges',     required: false, hint: 'What obstacles or pain points exist today?' },
              { field: 'proposedSolution',     label: 'Proposed Solution',      required: false, hint: 'Describe your solution in detail' },
              { field: 'innovationDescription',label: 'Innovation Description', required: false, hint: 'What makes this idea novel or unique?' },
              { field: 'expectedOutcome',      label: 'Expected Outcome',       required: false, hint: 'What results do you expect from this idea?' },
            ].map(({ field, label, required, hint, minLen }) => {
              const plainLen = stripHtml(form[field]).length
              return (
                <div key={field}>
                  <label className="text-label block mb-2">
                    {label} {required && <span className="text-rose-500">*</span>}
                  </label>
                  <RichTextEditor
                    id={`idea-${field}`}
                    value={form[field]}
                    onChange={(html) => handleChange(field, html)}
                    placeholder={hint}
                  />
                  {errors[field] && <p role="alert" className="text-xs text-rose-500 mt-1">{errors[field]}</p>}
                  {minLen && (
                    <p className={`text-xs mt-1 ${plainLen < minLen ? 'text-theme-text0' : 'text-emerald-600'}`}>
                      {plainLen}/{minLen} min characters
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Section 3: Benefits ── */}
        {activeSection === 'benefits' && (
          <div className="glass rounded-2xl p-6">
            <h2 className="text-heading text-base text-theme-text mb-1">3. Expected Benefits</h2>
            <p className="text-sm text-theme-text0 mb-6">Select at least one benefit type (FR-02-03) <span className="text-rose-500">*</span></p>
            <div
              role="group"
              aria-label="Benefit types"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              {BENEFIT_TYPES.map(({ value, label }) => {
                const checked = form.benefitTypes.includes(value)
                return (
                  <label
                    key={value}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150 border
                      ${checked
                        ? 'bg-theme-accent/10 border-theme-accent/40 text-theme-text'
                        : 'border-theme-border text-theme-text0 hover:border-theme-accent/40 hover:text-theme-text'
                      }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      value={value}
                      checked={checked}
                      onChange={() => toggleBenefit(value)}
                      aria-label={label}
                    />
                    <div className={`w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors ${checked ? 'bg-theme-accent border-theme-accent' : 'border-theme-border'}`}>
                      {checked && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                )
              })}
            </div>
            {errors.benefitTypes && (
              <p role="alert" className="text-xs text-rose-500 mt-4 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.benefitTypes}
              </p>
            )}

            {/* Estimated (potential) value — optional, feeds the CEO Business
                Impact view. Clearly an ESTIMATE, never presented as realized. */}
            <div className="mt-6 pt-6 border-t border-theme-border/50 max-w-sm">
              <label htmlFor="idea-estimatedValueINR" className="text-label block mb-2">
                Estimated Business Value (₹)
              </label>
              <input
                id="idea-estimatedValueINR"
                type="number"
                min="0"
                step="1000"
                inputMode="numeric"
                value={form.estimatedValueINR}
                onChange={(e) => handleChange('estimatedValueINR', e.target.value)}
                placeholder="e.g. 250000"
                aria-describedby="idea-estimatedValueINR-hint"
                aria-invalid={errors.estimatedValueINR ? 'true' : undefined}
                className={`input-base ${errors.estimatedValueINR ? 'border-rose-500/60' : ''}`}
              />
              <p id="idea-estimatedValueINR-hint" className="text-xs text-theme-text0 mt-1.5">
                Optional · Your best estimate of annual value. Executives compare this
                against realized benefits recorded after implementation.
              </p>
              {errors.estimatedValueINR && (
                <p role="alert" className="text-xs text-rose-500 mt-1">{errors.estimatedValueINR}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Section 4: Attachments ── */}
        {activeSection === 'attachments' && (
          <div className="glass rounded-2xl p-6">
            <h2 className="text-heading text-base text-theme-text mb-1">4. Supporting Attachments</h2>
            <p className="text-sm text-theme-text0 mb-6">Up to {MAX_FILES} files, max {(MAX_SIZE / 1024 / 1024).toFixed(0)} MB each · PDF, DOCX, XLSX, JPG, PNG, PPTX, MP4</p>

            <label
              htmlFor="idea-attachments"
              className="flex flex-col items-center gap-4 p-8 rounded-xl border-2 border-dashed border-theme-border hover:border-theme-accent/40 hover:bg-theme-accent/5 cursor-pointer transition-all group"
            >
              <Upload className="w-8 h-8 text-theme-text0 group-hover:text-theme-accent transition-colors" />
              <div className="text-center">
                <p className="text-sm text-theme-text">Drag & drop or <span className="text-theme-accent">browse files</span></p>
                <p className="text-xs text-theme-text0 mt-1">Max {MAX_FILES} files · {(MAX_SIZE / 1024 / 1024).toFixed(0)} MB each</p>
              </div>
              <input
                id="idea-attachments"
                type="file"
                multiple
                accept={ALLOWED_EXTS}
                onChange={handleFiles}
                className="sr-only"
                aria-label="Upload attachments"
              />
            </label>

            {fileError && (
              <p role="alert" className="text-xs text-rose-500 mt-3 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {fileError}
              </p>
            )}

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-theme-surface/60 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded bg-theme-border flex items-center justify-center text-[10px] font-bold text-theme-text uppercase flex-shrink-0">
                        {file.name.split('.').pop()}
                      </div>
                      <span className="text-theme-text truncate">{file.name}</span>
                      <span className="text-theme-text0 flex-shrink-0">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      aria-label={`Remove ${file.name}`}
                      className="ml-3 text-theme-text0 hover:text-rose-500 transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isEdit && existingIdea?.attachments?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-theme-text0 mb-2">Existing attachments:</p>
                {existingIdea.attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-2 py-2 text-sm text-theme-text border-b border-theme-border/50">
                    <span className="truncate">{att.fileName}</span>
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-xs text-theme-accent hover:underline flex-shrink-0">View</a>
                  </div>
                ))}
              </div>
            )}

            {draftId && files.length > 0 && (
              <p className="text-xs text-theme-text0 mt-3 flex items-center gap-1">
                <Info className="w-3 h-3" /> Attachments upload when you submit the idea.
              </p>
            )}
          </div>
        )}

        {/* ── Section 5: Ideathon Event Link ── */}
        {activeSection === 'event' && (
          <div className="glass rounded-2xl p-6">
            <h2 className="text-heading text-base text-theme-text mb-1">5. Link to Ideathon Event</h2>
            <p className="text-sm text-theme-text0 mb-6">Optionally link this idea to an active Ideathon event (FR-02-07).</p>

            {/* FR-IE-06 — post-deadline banner */}
            {eventDeadlinePassed && (
              <div role="alert" className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  The linked event “{effectiveEvent.eventName}” closed on{' '}
                  {new Date(effectiveEvent.endDate).toLocaleDateString('en-IN')}. Idea submissions for this
                  event are no longer accepted.
                  {isEdit ? ' You can still edit this existing idea.' : ' Please unlink the event or choose another.'}
                </span>
              </div>
            )}

            {activeEvents.length === 0 ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-theme-accent/10 border border-theme-accent/20 text-theme-accent text-sm">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>No active Ideathon events available to link right now.</span>
              </div>
            ) : (
              <div>
                <label htmlFor="idea-event" className="text-label block mb-2">Event (optional)</label>
                <select
                  id="idea-event"
                  className="input-base"
                  value={form.linkedEventId}
                  onChange={(e) => handleChange('linkedEventId', e.target.value)}
                >
                  <option value="">Not linked to an event</option>
                  {activeEvents.map((ev) => (
                    <option key={ev._id} value={ev._id}>
                      {ev.eventName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* ── Navigation + Submit ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-6 border-t border-theme-border/50">
          {/* Section nav */}
          <div className="flex gap-2">
            {activeSection !== 'basic' && (
              <button
                type="button"
                onClick={() => {
                  const idx = SECTIONS.findIndex((s) => s.id === activeSection)
                  if (idx > 0) setSection(SECTIONS[idx - 1].id)
                }}
                className="btn btn-secondary btn-sm"
              >
                ← Back
              </button>
            )}
            {activeSection !== 'event' && (
              <button
                type="button"
                id="btn-next-section"
                onClick={() => {
                  const idx = SECTIONS.findIndex((s) => s.id === activeSection)
                  if (idx < SECTIONS.length - 1) setSection(SECTIONS[idx + 1].id)
                }}
                className="btn btn-secondary btn-sm"
              >
                Next →
              </button>
            )}
          </div>

          {/* Save draft + Submit */}
          <div className="flex gap-3">
            <button
              type="button"
              id="btn-manual-save"
              onClick={doAutoSave}
              disabled={autoSaveMutation.isPending || !form.title.trim()}
              className="btn btn-secondary btn-sm"
            >
              {autoSaveMutation.isPending ? <><span className="spinner w-3 h-3" /> Saving…</> : <><Save className="w-3 h-3" /> Save Draft</>}
            </button>
            <button
              type="submit"
              id="btn-submit-idea-form"
              disabled={submitMutation.isPending || (eventDeadlinePassed && !isEdit)}
              title={eventDeadlinePassed && !isEdit ? 'The linked event has closed — submissions are no longer accepted.' : undefined}
              className="btn btn-primary"
            >
              {submitMutation.isPending
                ? <><span className="spinner w-4 h-4" /> Submitting…</>
                : <><Lightbulb className="w-4 h-4" /> Submit Idea</>
              }
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
