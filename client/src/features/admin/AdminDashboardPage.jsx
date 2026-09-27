/**
 * AdminDashboardPage — FRD §12 Admin Management Console.
 * Tabs: Users (roles[] array + create + deactivate), Targets (TARGET_TYPE enum),
 * Criteria (weighted 1–10 set), Announcements (rich text CRUD), Audit Log viewer.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI, eventsAPI } from '../../api';
import {
  ROLES, ALL_ROLES, TARGET_TYPE, getFYLabel,
  EVENT_TYPE, ALL_EVENT_TYPES, EVENT_VISIBILITY, ALL_EVENT_VISIBILITIES,
  EVENT_STATUS, ALL_EVENT_STATUSES,
} from '@shared/constants';
import Modal from '../../components/Modal';
import RichTextEditor from '../../components/RichTextEditor';
import RichText from '../../components/RichText';
import {
  Users, Target, SlidersHorizontal, Megaphone, ScrollText,
  AlertCircle, Plus, Trash2, UserPlus, Power,
  Calendar, Clock, Send, Ban, ChevronDown, ChevronUp, Lock, Globe,
} from 'lucide-react';

const ROLE_LABEL = (r) =>
  r === 'ceo' ? 'CEO' : r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const TARGET_TYPE_LABEL = {
  [TARGET_TYPE.TOTAL_IDEAS]: 'Total Ideas',
  [TARGET_TYPE.APPROVED_IDEAS]: 'Approved Ideas',
  [TARGET_TYPE.IMPLEMENTED_IDEAS]: 'Implemented Ideas',
};

const TABS = [
  { id: 'users',         label: 'User Management',    icon: Users },
  { id: 'targets',       label: 'Department Targets', icon: Target },
  { id: 'criteria',      label: 'Evaluation Criteria',icon: SlidersHorizontal },
  { id: 'events',        label: 'Ideathon Events',    icon: Calendar },
  { id: 'announcements', label: 'Announcements',      icon: Megaphone },
  { id: 'audit',         label: 'Audit Log',          icon: ScrollText },
];

const DEPARTMENTS = ['Engineering', 'Sales', 'Marketing', 'Operations', 'HR', 'Finance'];

// Departments selectable when creating a restricted event (FR-IE-02).
const EVENT_DEPARTMENTS = [
  'IT', 'Operations', 'Finance', 'Human Resources', 'Strategy',
  'Marketing', 'Sales', 'Engineering',
];

const EVENT_LABEL = (v = '') =>
  v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="page-enter max-w-[1400px] mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-display text-4xl text-theme-text mb-2">Admin Control Center</h1>
        <p className="text-theme-text/80">Manage RBAC roles, department targets, evaluation criteria, announcements and the audit trail.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-theme-border mb-8 gap-1 overflow-x-auto" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            className={`pb-4 pt-1 px-3 font-semibold text-sm flex items-center gap-2 transition-colors relative whitespace-nowrap ${activeTab === id ? 'text-theme-accent' : 'text-theme-text/80 hover:text-theme-text'}`}
          >
            <Icon className="w-4 h-4" /> {label}
            {activeTab === id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme-accent rounded-full" />}
          </button>
        ))}
      </div>

      {activeTab === 'users'         && <UsersTab queryClient={queryClient} />}
      {activeTab === 'targets'       && <TargetsTab queryClient={queryClient} />}
      {activeTab === 'criteria'      && <CriteriaTab queryClient={queryClient} />}
      {activeTab === 'events'        && <EventsTab queryClient={queryClient} />}
      {activeTab === 'announcements' && <AnnouncementsTab queryClient={queryClient} />}
      {activeTab === 'audit'         && <AuditTab />}
    </div>
  );
}

/* ─────────────────────────── Users Tab ─────────────────────────── */
function UsersTab({ queryClient }) {
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState({
    employeeId: '', name: '', email: '', password: '', department: 'Engineering', roles: [ROLES.EMPLOYEE],
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => adminAPI.getUsers().then((r) => r.data.data),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, roles }) => adminAPI.updateUser(id, { roles }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] }),
  });
  const activeMutation = useMutation({
    mutationFn: ({ id, isActive }) => (isActive ? adminAPI.updateUser(id, { isActive: true }) : adminAPI.deactivateUser(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] }),
  });
  const createMutation = useMutation({
    mutationFn: (data) => adminAPI.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setShowCreate(false);
      setCreateForm({ employeeId: '', name: '', email: '', password: '', department: 'Engineering', roles: [ROLES.EMPLOYEE] });
    },
    onError: (err) => setCreateError(err.response?.data?.message || 'Failed to create user.'),
  });

  const toggleCreateRole = (r) => {
    setCreateForm((f) => ({
      ...f,
      roles: f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r],
    }));
  };

  const submitCreate = (e) => {
    e.preventDefault();
    setCreateError('');
    if (createForm.roles.length === 0) { setCreateError('Select at least one role.'); return; }
    createMutation.mutate(createForm);
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-theme-text">User Accounts & Role Assignments</h3>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary btn-sm">
          <UserPlus className="w-4 h-4" /> Add User
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-theme-surface rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="table-responsive">
          <table className="w-full text-left text-sm text-theme-text/80">
            <thead className="bg-theme-surface/50 text-xs font-semibold text-theme-text/80 uppercase tracking-wider">
              <tr>
                <th className="p-4 rounded-l-xl">User</th>
                <th className="p-4">Department</th>
                <th className="p-4">Roles</th>
                <th className="p-4">Status</th>
                <th className="p-4 rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border/50">
              {users.map((user) => {
                const primaryRole = user.roles?.[0] || ROLES.EMPLOYEE;
                return (
                  <tr key={user._id} className="hover:bg-theme-surface/30 transition-colors">
                    <td className="p-4 font-semibold text-theme-text">
                      <div>{user.name}</div>
                      <div className="text-xs text-theme-text0 font-normal">{user.email}</div>
                    </td>
                    <td className="p-4">{user.department}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(user.roles || []).map((r) => (
                          <span key={r} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-theme-accent/10 text-theme-accent">
                            {ROLE_LABEL(r)}
                          </span>
                        ))}
                      </div>
                      <select
                        value={primaryRole}
                        onChange={(e) => roleMutation.mutate({ id: user._id, roles: [e.target.value] })}
                        className="input-base text-xs py-1.5 px-3 font-semibold"
                        aria-label={`Set role for ${user.name}`}
                      >
                        {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL(r)}</option>)}
                      </select>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${user.isActive ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => activeMutation.mutate({ id: user._id, isActive: !user.isActive })}
                        disabled={activeMutation.isPending}
                        className="text-xs flex items-center gap-1 text-theme-text0 hover:text-theme-accent"
                      >
                        <Power className="w-3 h-3" /> {user.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create user modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add New User" size="lg">
        {createError && (
          <div role="alert" className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-600 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{createError}</span>
          </div>
        )}
        <form onSubmit={submitCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-label block mb-2">Employee ID <span className="text-rose-500">*</span></label>
              <input className="input-base" value={createForm.employeeId} onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })} required />
            </div>
            <div>
              <label className="text-label block mb-2">Full Name <span className="text-rose-500">*</span></label>
              <input className="input-base" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-label block mb-2">Email <span className="text-rose-500">*</span></label>
              <input type="email" className="input-base" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required />
            </div>
            <div>
              <label className="text-label block mb-2">Temp Password <span className="text-rose-500">*</span></label>
              <input type="text" className="input-base" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} required />
            </div>
            <div>
              <label className="text-label block mb-2">Department <span className="text-rose-500">*</span></label>
              <select className="input-base" value={createForm.department} onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-label block mb-2">Roles <span className="text-rose-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map((r) => {
                const on = createForm.roles.includes(r);
                return (
                  <button type="button" key={r} onClick={() => toggleCreateRole(r)}
                    className={`btn btn-sm ${on ? 'btn-primary' : 'btn-secondary'}`}>
                    {ROLE_LABEL(r)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-theme-border/50">
            <button type="button" onClick={() => setShowCreate(false)} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ─────────────────────────── Targets Tab ─────────────────────────── */
function TargetsTab({ queryClient }) {
  const [form, setForm] = useState({
    department: 'Engineering',
    financialYear: getFYLabel(),
    targetType: TARGET_TYPE.TOTAL_IDEAS,
    targetValue: 50,
  });

  const { data: targets = [], isLoading } = useQuery({
    queryKey: ['adminTargets'],
    queryFn: () => adminAPI.getTargets().then((r) => r.data.data),
  });
  const mutation = useMutation({
    mutationFn: (data) => adminAPI.upsertTarget(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminTargets'] }),
  });

  const submit = (e) => {
    e.preventDefault();
    mutation.mutate({ ...form, targetValue: Number(form.targetValue) });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-bold text-theme-text mb-4">Set Department Target</h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-label block mb-2">Department</label>
            <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input-base">
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-label block mb-2">Financial Year</label>
            <input type="text" value={form.financialYear} onChange={(e) => setForm({ ...form, financialYear: e.target.value })} className="input-base" />
          </div>
          <div>
            <label className="text-label block mb-2">Target Type</label>
            <select value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value })} className="input-base">
              {Object.values(TARGET_TYPE).map((t) => <option key={t} value={t}>{TARGET_TYPE_LABEL[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-label block mb-2">Target Quota</label>
            <input type="number" value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: e.target.value })} className="input-base" min="1" />
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save Department Target'}
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 glass rounded-2xl p-6">
        <h3 className="text-lg font-bold text-theme-text mb-6">Configured Department Targets</h3>
        {isLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-theme-surface rounded-lg animate-pulse" />)}</div>
        ) : targets.length === 0 ? (
          <p className="text-sm text-theme-text0 italic">No targets configured yet.</p>
        ) : (
          <div className="space-y-3">
            {targets.map((t) => (
              <div key={t._id} className="flex justify-between items-center p-4 rounded-xl bg-theme-surface/50 border border-theme-border">
                <div>
                  <h4 className="font-bold text-theme-text">{t.department}</h4>
                  <p className="text-xs text-theme-text/80">{t.financialYear} · {TARGET_TYPE_LABEL[t.targetType] || t.targetType}</p>
                </div>
                <div className="text-xl font-bold text-theme-accent">{t.targetValue}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Criteria Tab ─────────────────────────── */
function CriteriaTab({ queryClient }) {
  const [rows, setRows] = useState([{ criterionName: '', weight: 0.25, guidance: '' }]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { data: criteria = [], isLoading } = useQuery({
    queryKey: ['adminCriteria'],
    queryFn: () => adminAPI.getCriteria().then((r) => r.data.data),
  });
  const activeCriteria = criteria.filter((c) => c.isActive);

  const mutation = useMutation({
    mutationFn: (data) => adminAPI.updateCriteria(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCriteria'] });
      setSuccess('Criteria set updated.');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to save criteria.'),
  });

  const total = rows.reduce((s, r) => s + Number(r.weight || 0), 0);

  const updateRow = (i, field, val) => setRows((rs) => rs.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const addRow = () => setRows((rs) => [...rs, { criterionName: '', weight: 0, guidance: '' }]);
  const removeRow = (i) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (rows.some((r) => !r.criterionName.trim())) { setError('Every criterion needs a name.'); return; }
    if (Math.abs(total - 1) > 0.001) { setError(`Weights must sum to 1.0 (100%). Current: ${(total * 100).toFixed(0)}%.`); return; }
    mutation.mutate({
      criteria: rows.map((r) => ({
        criterionName: r.criterionName.trim(),
        weight: Number(r.weight),
        guidance: r.guidance,
        scoreRangeMin: 1,
        scoreRangeMax: 10,
      })),
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-bold text-theme-text mb-1">Define Evaluation Criteria</h3>
        <p className="text-sm text-theme-text0 mb-4">Weights are decimals (0–1) and must total 100%. Scores are on a 1–10 scale.</p>

        {error && <div role="alert" className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-600 text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 text-sm">{success}</div>}

        <form onSubmit={submit} className="space-y-4">
          {rows.map((r, i) => (
            <div key={i} className="p-3 rounded-xl bg-theme-surface/50 border border-theme-border space-y-2">
              <div className="flex gap-2">
                <input
                  className="input-base flex-1" placeholder="Criterion name"
                  value={r.criterionName} onChange={(e) => updateRow(i, 'criterionName', e.target.value)}
                />
                <input
                  type="number" step="0.05" min="0" max="1"
                  className="input-base w-24" placeholder="Weight"
                  value={r.weight} onChange={(e) => updateRow(i, 'weight', e.target.value)}
                  aria-label="Weight"
                />
                {rows.length > 1 && (
                  <button type="button" onClick={() => removeRow(i)} className="btn btn-ghost btn-sm text-rose-600" aria-label="Remove criterion">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <input
                className="input-base text-xs" placeholder="Guidance (optional)"
                value={r.guidance} onChange={(e) => updateRow(i, 'guidance', e.target.value)}
              />
            </div>
          ))}
          <div className="flex items-center justify-between">
            <button type="button" onClick={addRow} className="btn btn-secondary btn-sm"><Plus className="w-3 h-3" /> Add Criterion</button>
            <span className={`text-sm font-semibold ${Math.abs(total - 1) < 0.001 ? 'text-emerald-600' : 'text-theme-text0'}`}>
              Total: {(total * 100).toFixed(0)}%
            </span>
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Publish Criteria Set'}
          </button>
        </form>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-bold text-theme-text mb-4">Active Criteria</h3>
        {isLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-theme-surface rounded-lg animate-pulse" />)}</div>
        ) : activeCriteria.length === 0 ? (
          <p className="text-sm text-theme-text0 italic">No active criteria configured.</p>
        ) : (
          <div className="space-y-3">
            {activeCriteria.map((c) => (
              <div key={c._id} className="flex justify-between items-start p-4 rounded-xl bg-theme-surface/50 border border-theme-border">
                <div>
                  <h4 className="font-semibold text-theme-text">{c.criterionName}</h4>
                  {c.guidance && <p className="text-xs text-theme-text0 mt-0.5">{c.guidance}</p>}
                  <p className="text-[10px] text-theme-text0 mt-1">v{c.version} · scale {c.scoreRangeMin}–{c.scoreRangeMax}</p>
                </div>
                <div className="text-lg font-bold text-theme-accent">{Math.round(c.weight * 100)}%</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Announcements Tab ─────────────────────────── */
function AnnouncementsTab({ queryClient }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', richTextBody: '', expiryDate: '', isActive: true });
  const [error, setError] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['adminAnnouncements'],
    queryFn: () => adminAPI.getAnnouncements().then((r) => r.data.data),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['adminAnnouncements'] });
    queryClient.invalidateQueries({ queryKey: ['announcements'] });
  };
  const saveMutation = useMutation({
    mutationFn: (data) => editing ? adminAPI.updateAnnouncement(editing, data) : adminAPI.createAnnouncement(data),
    onSuccess: () => { invalidate(); closeForm(); },
    onError: (err) => setError(err.response?.data?.message || 'Failed to save.'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteAnnouncement(id),
    onSuccess: invalidate,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', richTextBody: '', expiryDate: '', isActive: true });
    setError('');
    setShowForm(true);
  };
  const openEdit = (a) => {
    setEditing(a._id);
    setForm({
      title: a.title,
      richTextBody: a.richTextBody,
      expiryDate: a.expiryDate ? new Date(a.expiryDate).toISOString().slice(0, 10) : '',
      isActive: a.isActive,
    });
    setError('');
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.expiryDate) { setError('Title and expiry date are required.'); return; }
    saveMutation.mutate(form);
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-theme-text">Announcements</h3>
        <button onClick={openCreate} className="btn btn-primary btn-sm"><Plus className="w-4 h-4" /> New Announcement</button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-theme-surface rounded-lg animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <p className="text-sm text-theme-text0 italic">No announcements yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a._id} className="p-4 rounded-xl bg-theme-surface/50 border border-theme-border">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-theme-text">{a.title}</h4>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${a.isActive ? 'bg-emerald-500/20 text-emerald-600' : 'bg-theme-border/50 text-theme-text0'}`}>
                      {a.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-xs text-theme-text/80 line-clamp-2"><RichText html={a.richTextBody} /></div>
                  <p className="text-[10px] text-theme-text0 mt-1">Expires {new Date(a.expiryDate).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(a)} className="btn btn-ghost btn-sm">Edit</button>
                  <button onClick={() => deleteMutation.mutate(a._id)} className="btn btn-ghost btn-sm text-rose-600" aria-label={`Delete ${a.title}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={closeForm} title={editing ? 'Edit Announcement' : 'New Announcement'} size="lg">
        {error && <div role="alert" className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-600 text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-label block mb-2">Title <span className="text-rose-500">*</span></label>
            <input className="input-base" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="text-label block mb-2">Body <span className="text-rose-500">*</span></label>
            <RichTextEditor value={form.richTextBody} onChange={(html) => setForm({ ...form, richTextBody: html })} placeholder="Announcement details…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-label block mb-2">Expiry Date <span className="text-rose-500">*</span></label>
              <input type="date" className="input-base" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} required />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-theme-text">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Active
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-theme-border/50">
            <button type="button" onClick={closeForm} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ─────────────────────────── Events Tab ─────────────────────────── */
const emptyEventForm = {
  eventName: '',
  theme: '',
  description: '',
  eventType: EVENT_TYPE.IDEATHON,
  initiative: '',
  startDate: '',
  endDate: '',
  targetDepartments: [],
  maxParticipants: '',
  ideaCategory: '',
  visibility: EVENT_VISIBILITY.DRAFT,
  status: EVENT_STATUS.DRAFT,
  minQualifyingScore: 6,
  quorumType: 'majority',
  quorumValue: '',
};

// Convert a Date/ISO string to the yyyy-mm-dd a <input type="date"> expects,
// in local time.
const toDateInput = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const STATUS_BADGE = {
  [EVENT_STATUS.ACTIVE]: 'bg-emerald-500/20 text-emerald-600',
  [EVENT_STATUS.EXTENDED]: 'bg-blue-500/20 text-blue-600',
  [EVENT_STATUS.CLOSED]: 'bg-theme-border/50 text-theme-text0',
  [EVENT_STATUS.DRAFT]: 'bg-amber-500/20 text-amber-600',
};

function EventsTab({ queryClient }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyEventForm);
  const [error, setError] = useState('');

  const [extendFor, setExtendFor] = useState(null);
  const [extendForm, setExtendForm] = useState({ newEndDate: '', justification: '' });
  const [extendError, setExtendError] = useState('');

  const [expanded, setExpanded] = useState(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['adminEvents'],
    queryFn: () => eventsAPI.list().then((r) => r.data.data),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
    queryClient.invalidateQueries({ queryKey: ['exploreEvents'] });
  };

  const saveMutation = useMutation({
    mutationFn: (data) => (editing ? eventsAPI.update(editing, data) : eventsAPI.create(data)),
    onSuccess: () => { invalidate(); closeForm(); },
    onError: (err) => setError(err.response?.data?.message || 'Failed to save event.'),
  });
  const publishMutation = useMutation({
    mutationFn: (id) => eventsAPI.update(id, {
      visibility: EVENT_VISIBILITY.PUBLISHED,
      status: EVENT_STATUS.ACTIVE,
    }),
    onSuccess: invalidate,
  });
  const closeMutation = useMutation({
    mutationFn: (id) => eventsAPI.close(id),
    onSuccess: invalidate,
  });
  const extendMutation = useMutation({
    mutationFn: ({ id, data }) => eventsAPI.extend(id, data),
    onSuccess: () => { invalidate(); closeExtend(); },
    onError: (err) => setExtendError(err.response?.data?.message || 'Failed to extend deadline.'),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyEventForm);
    setError('');
    setShowForm(true);
  };
  const openEdit = (ev) => {
    setEditing(ev._id);
    setForm({
      eventName: ev.eventName || '',
      theme: ev.theme || '',
      description: ev.description || '',
      eventType: ev.eventType || EVENT_TYPE.IDEATHON,
      initiative: ev.initiative || '',
      startDate: toDateInput(ev.startDate),
      endDate: toDateInput(ev.endDate),
      targetDepartments: ev.targetDepartments || [],
      maxParticipants: ev.maxParticipants ?? '',
      ideaCategory: ev.ideaCategory || '',
      visibility: ev.visibility || EVENT_VISIBILITY.DRAFT,
      status: ev.status || EVENT_STATUS.DRAFT,
      minQualifyingScore: ev.minQualifyingScore ?? 6,
      quorumType: ev.quorumType || 'majority',
      quorumValue: ev.quorumValue ?? '',
    });
    setError('');
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const openExtend = (ev) => {
    setExtendFor(ev);
    setExtendForm({ newEndDate: toDateInput(ev.endDate), justification: '' });
    setExtendError('');
  };
  const closeExtend = () => { setExtendFor(null); setExtendForm({ newEndDate: '', justification: '' }); };

  const toggleDept = (d) => setForm((f) => ({
    ...f,
    targetDepartments: f.targetDepartments.includes(d)
      ? f.targetDepartments.filter((x) => x !== d)
      : [...f.targetDepartments, d],
  }));

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.eventName.trim() || !form.startDate || !form.endDate) {
      setError('Event name, start date and end date are required.');
      return;
    }
    saveMutation.mutate({
      ...form,
      maxParticipants: form.maxParticipants === '' ? null : Number(form.maxParticipants),
      minQualifyingScore: Number(form.minQualifyingScore),
      quorumValue: form.quorumValue === '' ? null : Number(form.quorumValue),
      targetDepartments: form.visibility === EVENT_VISIBILITY.RESTRICTED ? form.targetDepartments : [],
    });
  };

  const submitExtend = (e) => {
    e.preventDefault();
    setExtendError('');
    if (extendForm.justification.trim().length < 20) {
      setExtendError('Justification must be at least 20 characters (FR-IE-07).');
      return;
    }
    extendMutation.mutate({ id: extendFor._id, data: extendForm });
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-theme-text">Ideathon Events</h3>
        <button onClick={openCreate} className="btn btn-primary btn-sm"><Plus className="w-4 h-4" /> New Event</button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-theme-surface rounded-lg animate-pulse" />)}</div>
      ) : events.length === 0 ? (
        <p className="text-sm text-theme-text0 italic">No events yet. Create one to launch an Ideathon.</p>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const participants = ev.participants || [];
            const isDraft = ev.visibility === EVENT_VISIBILITY.DRAFT || ev.status === EVENT_STATUS.DRAFT;
            const isClosed = ev.status === EVENT_STATUS.CLOSED;
            const isOpen = expanded === ev._id;
            return (
              <div key={ev._id} className="p-4 rounded-xl bg-theme-surface/50 border border-theme-border">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-semibold text-theme-text">{ev.eventName}</h4>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${STATUS_BADGE[ev.status] || 'bg-theme-border/50 text-theme-text0'}`}>
                        {ev.status}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-theme-border/40 text-theme-text/80 flex items-center gap-1">
                        {ev.visibility === EVENT_VISIBILITY.RESTRICTED ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                        {ev.visibility}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-theme-accent/10 text-theme-accent">
                        {EVENT_LABEL(ev.eventType)}
                      </span>
                    </div>
                    <p className="text-xs text-theme-text/80 line-clamp-2">{ev.description}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-theme-text0">
                      <span>{new Date(ev.startDate).toLocaleDateString('en-IN')} → {new Date(ev.endDate).toLocaleDateString('en-IN')}</span>
                      {ev.initiative && <span>Initiative: {ev.initiative}</span>}
                      {ev.ideaCategory && <span>Category: {ev.ideaCategory}</span>}
                      {ev.visibility === EVENT_VISIBILITY.RESTRICTED && <span>Targets: {(ev.targetDepartments || []).join(', ') || '—'}</span>}
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : ev._id)}
                        className="text-theme-accent inline-flex items-center gap-1"
                        aria-expanded={isOpen}
                      >
                        {participants.length} participant{participants.length === 1 ? '' : 's'}
                        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                    {isOpen && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {participants.length === 0 ? (
                          <span className="text-[11px] text-theme-text0 italic">No registrations yet.</span>
                        ) : participants.map((p) => (
                          <span key={p._id || p} className="text-[11px] px-2 py-0.5 rounded-full bg-theme-bg border border-theme-border text-theme-text/90">
                            {p.name || 'Unknown'}{p.department ? ` · ${p.department}` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    {isDraft && (
                      <button onClick={() => publishMutation.mutate(ev._id)} className="btn btn-ghost btn-sm text-emerald-600" title="Publish (visible to all active employees)">
                        <Send className="w-4 h-4" /> Publish
                      </button>
                    )}
                    <button onClick={() => openEdit(ev)} className="btn btn-ghost btn-sm">Edit</button>
                    <button onClick={() => openExtend(ev)} className="btn btn-ghost btn-sm" title="Extend deadline (FR-IE-07)">
                      <Clock className="w-4 h-4" /> Extend
                    </button>
                    {!isClosed && (
                      <button onClick={() => closeMutation.mutate(ev._id)} className="btn btn-ghost btn-sm text-rose-600" title="Close event">
                        <Ban className="w-4 h-4" /> Close
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit modal (FR-IE-01) ── */}
      <Modal open={showForm} onClose={closeForm} title={editing ? 'Edit Event' : 'New Ideathon Event'} size="lg">
        {error && <div role="alert" className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-600 text-sm">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-label block mb-2">Event Name <span className="text-rose-500">*</span></label>
            <input className="input-base" value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-label block mb-2">Event Type <span className="text-rose-500">*</span></label>
              <select className="input-base" value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}>
                {ALL_EVENT_TYPES.map((t) => <option key={t} value={t}>{EVENT_LABEL(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-label block mb-2">Theme</label>
              <input className="input-base" value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-label block mb-2">Description</label>
            <textarea className="input-base min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-label block mb-2">Start Date <span className="text-rose-500">*</span></label>
              <input type="date" className="input-base" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </div>
            <div>
              <label className="text-label block mb-2">End Date <span className="text-rose-500">*</span></label>
              <input type="date" className="input-base" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-label block mb-2">Initiative</label>
              <input className="input-base" value={form.initiative} onChange={(e) => setForm({ ...form, initiative: e.target.value })} placeholder="e.g. Digital Transformation" />
            </div>
            <div>
              <label className="text-label block mb-2">Idea Category</label>
              <input className="input-base" value={form.ideaCategory} onChange={(e) => setForm({ ...form, ideaCategory: e.target.value })} placeholder="e.g. Process Improvement" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-label block mb-2">Max Participants</label>
              <input type="number" min="1" className="input-base" value={form.maxParticipants} onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })} placeholder="Unlimited" />
            </div>
            <div>
              <label className="text-label block mb-2">Visibility</label>
              <select className="input-base" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                {ALL_EVENT_VISIBILITIES.map((v) => <option key={v} value={v}>{EVENT_LABEL(v)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-label block mb-2">Status</label>
              <select className="input-base" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {ALL_EVENT_STATUSES.map((s) => <option key={s} value={s}>{EVENT_LABEL(s)}</option>)}
              </select>
            </div>
          </div>
          {form.visibility === EVENT_VISIBILITY.RESTRICTED && (
            <div>
              <label className="text-label block mb-2">Target Departments (restricted)</label>
              <div className="flex flex-wrap gap-2">
                {EVENT_DEPARTMENTS.map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => toggleDept(d)}
                    aria-pressed={form.targetDepartments.includes(d)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      form.targetDepartments.includes(d)
                        ? 'bg-theme-accent text-white border-theme-accent'
                        : 'bg-theme-bg text-theme-text/80 border-theme-border hover:border-theme-accent'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-label block mb-2">Min Qualifying Score</label>
              <input type="number" min="0" max="10" step="0.5" className="input-base" value={form.minQualifyingScore} onChange={(e) => setForm({ ...form, minQualifyingScore: e.target.value })} />
            </div>
            <div>
              <label className="text-label block mb-2">Quorum Type</label>
              <select className="input-base" value={form.quorumType} onChange={(e) => setForm({ ...form, quorumType: e.target.value })}>
                <option value="majority">Majority</option>
                <option value="fixed_count">Fixed Count</option>
              </select>
            </div>
            {form.quorumType === 'fixed_count' && (
              <div>
                <label className="text-label block mb-2">Quorum Value</label>
                <input type="number" min="1" className="input-base" value={form.quorumValue} onChange={(e) => setForm({ ...form, quorumValue: e.target.value })} />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-theme-border/50">
            <button type="button" onClick={closeForm} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : editing ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Extend deadline modal (FR-IE-07) ── */}
      <Modal open={!!extendFor} onClose={closeExtend} title={`Extend Deadline — ${extendFor?.eventName || ''}`} size="md">
        {extendError && <div role="alert" className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-600 text-sm">{extendError}</div>}
        <form onSubmit={submitExtend} className="space-y-4">
          <div>
            <label className="text-label block mb-2">New End Date <span className="text-rose-500">*</span></label>
            <input type="date" className="input-base" value={extendForm.newEndDate} onChange={(e) => setExtendForm({ ...extendForm, newEndDate: e.target.value })} required />
          </div>
          <div>
            <label className="text-label block mb-2">Justification <span className="text-rose-500">*</span> <span className="text-theme-text0 font-normal">(min 20 chars)</span></label>
            <textarea className="input-base min-h-[90px]" value={extendForm.justification} onChange={(e) => setExtendForm({ ...extendForm, justification: e.target.value })} placeholder="Why is the deadline being extended?" required />
          </div>
          <p className="text-xs text-theme-text0">All registered participants will be notified of the new deadline.</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-theme-border/50">
            <button type="button" onClick={closeExtend} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={extendMutation.isPending}>
              {extendMutation.isPending ? 'Extending…' : 'Extend Deadline'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ─────────────────────────── Audit Tab ─────────────────────────── */
function AuditTab() {
  const [filters, setFilters] = useState({ action: '', entityType: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['adminAudit', filters],
    queryFn: () => adminAPI.getAuditLogs({ ...filters, limit: 50 }).then((r) => r.data.data),
  });
  const items = data?.items || [];

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h3 className="text-lg font-bold text-theme-text">Audit Trail</h3>
        <div className="flex gap-2">
          <input
            placeholder="Action (e.g. update)"
            className="input-base text-sm"
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          />
          <input
            placeholder="Entity type (e.g. Idea)"
            className="input-base text-sm"
            value={filters.entityType}
            onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-10 bg-theme-surface rounded animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <p className="text-sm text-theme-text0 italic">No audit entries match.</p>
      ) : (
        <div className="table-responsive">
          <table className="w-full text-left text-sm text-theme-text/80">
            <thead className="bg-theme-surface/50 text-xs font-semibold text-theme-text/80 uppercase tracking-wider">
              <tr>
                <th className="p-3 rounded-l-xl">When</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity</th>
                <th className="p-3 rounded-r-xl">Entity ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border/50">
              {items.map((log) => (
                <tr key={log._id} className="hover:bg-theme-surface/30 transition-colors">
                  <td className="p-3 whitespace-nowrap text-xs">{new Date(log.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="p-3">{log.actorId?.name || 'System'}</td>
                  <td className="p-3"><span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-theme-accent/10 text-theme-accent uppercase">{log.action}</span></td>
                  <td className="p-3">{log.entityType}</td>
                  <td className="p-3 text-xs font-mono truncate max-w-[160px]">{log.entityId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
