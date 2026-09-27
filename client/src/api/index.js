import api from './axios'

// Auth
export const authAPI = {
  login:   (credentials) => api.post('/auth/login', credentials),
  refresh: ()            => api.post('/auth/refresh'),
  logout:  ()            => api.post('/auth/logout'),
  me:      ()            => api.get('/auth/me'),
}

// Ideas
export const ideasAPI = {
  create:         (formData, { submit = false } = {}) =>
                    api.post('/ideas', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                      params: submit ? { submit: 'true' } : {},
                    }),
  list:           (params)   => api.get('/ideas', { params }),
  myIdeas:        (params)   => api.get('/ideas/my', { params }),
  duplicateCheck: (params)   => api.get('/ideas/duplicate-check', { params }),
  getById:        (id)       => api.get(`/ideas/${id}`),
  autoSave:       (id, data) => api.patch(`/ideas/${id}/draft`, data),
  submit:         (id)       => api.post(`/ideas/${id}/submit`),
  publish:        (id, data) => api.post(`/ideas/${id}/publish`, data),
  delete:         (id)       => api.delete(`/ideas/${id}`),
}

// Dashboard
export const dashboardAPI = {
  kpis:              (params) => api.get('/dashboard/kpis', { params }),
  featuredIdeas:     ()       => api.get('/dashboard/featured-ideas'),
  successStories:    ()       => api.get('/dashboard/success-stories'),
  announcements:     ()       => api.get('/dashboard/announcements'),
  departmentTargets: (params) => api.get('/dashboard/department-targets', { params }),
}

// CEO / C-Suite executive dashboard (server enforces authorize(ROLES.CEO))
export const ceoAPI = {
  overview: (params) => api.get('/dashboard/ceo/overview', { params }),
  trends:   (params) => api.get('/dashboard/ceo/trends',   { params }),
  pipeline: ()       => api.get('/dashboard/ceo/pipeline'),
  insights: ()       => api.get('/dashboard/ceo/insights'),
}

// Notifications
export const notificationsAPI = {
  list:        (params) => api.get('/notifications', { params }),
  unreadCount: ()       => api.get('/notifications/unread-count'),
  markRead:    (id)     => api.patch(`/notifications/${id}/read`),
  markAllRead: ()       => api.patch('/notifications/read-all'),
}

// Supervisor
export const supervisorAPI = {
  getQueue: () => api.get('/supervisor/queue'),
  approve: (id, data) => api.post(`/supervisor/ideas/${id}/approve`, data),
  reject: (id, data) => api.post(`/supervisor/ideas/${id}/reject`, data),
  returnIdea: (id, data) => api.post(`/supervisor/ideas/${id}/return`, data),
}

// Evaluation (Dept Innovation Team)
export const evaluationAPI = {
  getCriteria: (eventId) => api.get('/evaluations/criteria', { params: eventId ? { eventId } : {} }),
  submitScore: (data) => api.post('/evaluations', data),
  getScores: (ideaId) => api.get(`/evaluations/idea/${ideaId}`),
  shortlist: (id) => api.post(`/evaluations/ideas/${id}/shortlist`),
  reject: (id, data) => api.post(`/evaluations/ideas/${id}/reject-dept`, data),
}

// Committee
export const committeeAPI = {
  get360View: (id) => api.get(`/committee/ideas/${id}/360-view`),
  getImplementationOwners: () => api.get('/committee/implementation-owners'),
  approvePublishing: (id, data) => api.post(`/committee/ideas/${id}/approve-publishing`, data),
  approveImplementation: (id, data) => api.post(`/committee/ideas/${id}/approve-implementation`, data),
  reject: (id, data) => api.post(`/committee/ideas/${id}/committee-reject`, data),
  defer: (id, data) => api.post(`/committee/ideas/${id}/defer`, data),
}

// Events
export const eventsAPI = {
  explore: (params) => api.get('/events/explore', { params }),
  mine: () => api.get('/events/mine'),
  facets: () => api.get('/events/facets'),
  getById: (id) => api.get(`/events/${id}`),
  join: (id) => api.post(`/events/${id}/join`),
  getLeaderboard: (id) => api.get(`/events/${id}/leaderboard`),
  // Admin
  list: (params) => api.get('/events', { params }),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.patch(`/events/${id}`, data),
  extend: (id, data) => api.post(`/events/${id}/extend`, data),
  close: (id) => api.post(`/events/${id}/close`),
}

// Gallery
export const galleryAPI = {
  list: (params) => api.get('/gallery', { params }),
  getTopContributors: (params) => api.get('/gallery/top-contributors', { params }),
  unpublish: (id, data) => api.post(`/gallery/${id}/unpublish`, data),
}

// Implementation & Benefits (Phase 5)
export const implementationsAPI = {
  getMy: () => api.get('/implementations/my'),
  getByIdea: (ideaId) => api.get(`/implementations/ideas/${ideaId}`),
  create: (data) => api.post('/implementations', data),
  update: (id, data) => api.patch(`/implementations/${id}`, data),
}

export const benefitsAPI = {
  getByIdea: (ideaId) => api.get(`/benefits/ideas/${ideaId}`),
  create: (formData) => api.post('/benefits', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  endorse: (id, data) => api.patch(`/benefits/${id}/endorse`, data),
}

// Reports & Admin (Phase 6)
export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getDepartmentTargets: (params) => api.get('/reports/department-targets', { params }),
  getSlaPerformance: () => api.get('/reports/sla-performance'),
  exportData: (format = 'xlsx') =>
    api.get('/reports/export', { params: { format }, responseType: 'blob' }),
}

export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  deactivateUser: (id) => api.patch(`/admin/users/${id}/deactivate`),
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  getCriteria: () => api.get('/admin/criteria'),
  updateCriteria: (data) => api.post('/admin/criteria', data),
  getTargets: () => api.get('/admin/targets'),
  upsertTarget: (data) => api.post('/admin/targets', data),
  getConfig: () => api.get('/admin/config'),
  updateConfig: (data) => api.patch('/admin/config', data),
  getHolidays: () => api.get('/admin/holidays'),
  addHoliday: (data) => api.post('/admin/holidays', data),
  getAnnouncements: () => api.get('/admin/announcements'),
  createAnnouncement: (data) => api.post('/admin/announcements', data),
  updateAnnouncement: (id, data) => api.patch(`/admin/announcements/${id}`, data),
  deleteAnnouncement: (id) => api.delete(`/admin/announcements/${id}`),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
}
