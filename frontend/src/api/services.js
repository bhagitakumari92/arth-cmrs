import api from './axios';

// Auth
export const authAPI = {
  login: (username, password) => api.post('/auth/token/', { username, password }),
  me: () => api.get('/accounts/users/me/'),
};

// Branches
export const branchAPI = {
  list: () => api.get('/accounts/branches/'),
  get: (id) => api.get(`/accounts/branches/${id}/`),
  create: (data) => api.post('/accounts/branches/', data),
  update: (id, data) => api.put(`/accounts/branches/${id}/`, data),
  remove: (id) => api.delete(`/accounts/branches/${id}/`),
};

// Users
export const userAPI = {
  list: () => api.get('/accounts/users/'),
  get: (id) => api.get(`/accounts/users/${id}/`),
  agents: () => api.get('/accounts/users/agents/'),
  create: (data) => api.post('/accounts/users/', data),
  update: (id, data) => api.put(`/accounts/users/${id}/`, data),
  remove: (id) => api.delete(`/accounts/users/${id}/`),
};

// Customers
export const customerAPI = {
  list: (params) => api.get('/customers/', { params }),
  get: (id) => api.get(`/customers/${id}/`),
  create: (data) => api.post('/customers/', data),
  update: (id, data) => api.put(`/customers/${id}/`, data),
  remove: (id) => api.delete(`/customers/${id}/`),
};

// Loans
export const loanAPI = {
  list: (params) => api.get('/loans/', { params }),
  get: (id) => api.get(`/loans/${id}/`),
  create: (data) => api.post('/loans/', data),
  update: (id, data) => api.put(`/loans/${id}/`, data),
  remove: (id) => api.delete(`/loans/${id}/`),
  schedules: (loanId) => api.get('/loans/schedules/', { params: { loan: loanId } }),
};

// Collections
export const collectionAPI = {
  list: (params) => api.get('/collections/', { params }),
  get: (id) => api.get(`/collections/${id}/`),
  create: (data) => api.post('/collections/', data),
  dailyTotal: (date) => api.get('/collections/daily_total/', { params: { date } }),
  eligibleForSubmission: (params) => api.get('/collections/eligible_for_submission/', { params }),
};

// Submissions
export const submissionAPI = {
  list: (params) => api.get('/collections/submissions/', { params }),
  get: (id) => api.get(`/collections/submissions/${id}/`),
  create: (data) => api.post('/collections/submissions/', data),
  reconcile: (id, data) => api.post(`/collections/submissions/${id}/reconcile/`, data),
};

// Reconciliation (read-only)
export const reconciliationAPI = {
  list: (params) => api.get('/reconciliation/', { params }),
  get: (id) => api.get(`/reconciliation/${id}/`),
};

// Deposits
export const depositAPI = {
  list: (params) => api.get('/deposits/', { params }),
  get: (id) => api.get(`/deposits/${id}/`),
  create: (data) => api.post('/deposits/', data),
  settle: (id, data) => api.post(`/deposits/${id}/settle/`, data),
  approvedSubmissions: () => api.get('/deposits/approved_submissions/'),
};

// Dashboard
export const dashboardAPI = {
  summary: (params) => api.get('/dashboard/summary/', { params }),
  recent: () => api.get('/dashboard/recent/'),
};
