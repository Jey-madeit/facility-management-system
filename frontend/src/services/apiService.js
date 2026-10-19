import apiClient from './apiClient';

export const authService = {
  register: (username, password, role = 'user') => {
    return apiClient.post('/auth/register', { username, password, role });
  },

  login: (username, password) => {
    return apiClient.post('/auth/login', { username, password });
  },

  logout: () => {
    return apiClient.post('/auth/logout');
  },

  getCurrentUser: () => {
    return apiClient.get('/auth/me');
  },

  forgotPassword: (username, otp, newPassword) => {
    return apiClient.post('/auth/forgot-password', { username, otp, newPassword });
  },

  requestPasswordResetOTP: (username, email = '') => {
    return apiClient.post('/auth/request-password-reset-otp', { username, email });
  },

  verifyOTP: (username, otp, email = '') => {
    return apiClient.post('/auth/verify-otp', { username, email, otp });
  },

  verifyOTPAndResetPassword: (username, otp, newPassword, email = '') => {
    return apiClient.post('/auth/verify-otp-and-reset-password', { username, email, otp, newPassword });
  }
};

export const dashboardService = {
  getSummary: () => apiClient.get('/dashboard/summary'),
};

export const auditService = {
  getAll: (params = {}) => apiClient.get('/audit', { params }),
  getEntityTrail: (targetType, targetId) => apiClient.get(`/audit/entity/${targetType}/${targetId}`),
  getDeleted: (limit = 100) => apiClient.get('/audit/deleted', { params: { limit } }),
  restoreDeleted: (id) => apiClient.post(`/audit/deleted/${id}/restore`),
};

export const testRunService = {
  getAll: () => apiClient.get('/testruns'),
  getById: (id) => apiClient.get(`/testruns/${id}`),
  create: (data) => apiClient.post('/testruns', data),
  update: (id, data) => apiClient.put(`/testruns/${id}`, data),
  delete: (id) => apiClient.delete(`/testruns/${id}`),
  import: (rows, assignedUserId) => apiClient.post('/testruns/import', { rows, assignedUserId }),
  deleteMultiple: (ids) => apiClient.post('/testruns/delete-multiple', { ids }),
  generateReport: () => apiClient.get('/testruns/report/generate'),
  exportToExcel: async () => {
    const response = await apiClient.get('/testruns/export/excel', {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'test-runs.xlsx');
    document.body.appendChild(link);
    link.click();
    link.parentElement.removeChild(link);
  },
  exportReportToExcel: async () => {
    const response = await apiClient.get('/testruns/export/report', {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'test-runs-report.xlsx');
    document.body.appendChild(link);
    link.click();
    link.parentElement.removeChild(link);
  }
};

export const boosterPumpService = {
  getAll: () => apiClient.get('/boosterpumps'),
  getById: (id) => apiClient.get(`/boosterpumps/${id}`),
  create: (data) => apiClient.post('/boosterpumps', data),
  update: (id, data) => apiClient.put(`/boosterpumps/${id}`, data),
  delete: (id) => apiClient.delete(`/boosterpumps/${id}`),
  import: (rows, assignedUserId) => apiClient.post('/boosterpumps/import', { rows, assignedUserId }),
  deleteMultiple: (ids) => apiClient.post('/boosterpumps/delete-multiple', { ids }),
  generateReport: () => apiClient.get('/boosterpumps/report/generate'),
  exportToExcel: async () => {
    const response = await apiClient.get('/boosterpumps/export/excel', {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'booster-pumps.xlsx');
    document.body.appendChild(link);
    link.click();
    link.parentElement.removeChild(link);
  },
  exportReportToExcel: async () => {
    const response = await apiClient.get('/boosterpumps/export/report', {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'booster-pumps-report.xlsx');
    document.body.appendChild(link);
    link.click();
    link.parentElement.removeChild(link);
  }
};

export const dailyInspectionService = {
  getAll: () => apiClient.get('/dailyinspections'),
  getById: (id) => apiClient.get(`/dailyinspections/${id}`),
  submit: (data, draftId) => apiClient.post('/dailyinspections/submit', { ...data, draftId }),
  saveDraft: (id, data) => apiClient.post(`/dailyinspections/draft/${id || 'null'}`, data),
  delete: (id) => apiClient.delete(`/dailyinspections/${id}`),
  import: (rows, assignedUserId) => apiClient.post('/dailyinspections/import', { rows, assignedUserId }),
  deleteMultiple: (ids) => apiClient.post('/dailyinspections/delete-multiple', { ids }),
  generateReport: () => apiClient.get('/dailyinspections/report/generate'),
  exportToExcel: async () => {
    const response = await apiClient.get('/dailyinspections/export/excel', {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'daily-inspections.xlsx');
    document.body.appendChild(link);
    link.click();
    link.parentElement.removeChild(link);
  },
  exportReportToExcel: async () => {
    const response = await apiClient.get('/dailyinspections/export/report', {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'daily-inspections-report.xlsx');
    document.body.appendChild(link);
    link.click();
    link.parentElement.removeChild(link);
  }
};

export const avrRecordingService = {
  getAll: () => apiClient.get('/avrrecordings'),
  create: (data) => apiClient.post('/avrrecordings', data),
  update: (id, data) => apiClient.put(`/avrrecordings/${id}`, data),
  delete: (id) => apiClient.delete(`/avrrecordings/${id}`),
  import: (rows, assignedUserId) => apiClient.post('/avrrecordings/import', { rows, assignedUserId }),
  deleteMultiple: (ids) => apiClient.post('/avrrecordings/delete-multiple', { ids }),
  generateReport: () => apiClient.get('/avrrecordings/report/generate'),
  exportToExcel: async () => {
    const response = await apiClient.get('/avrrecordings/export/excel', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'avr-systems.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  exportReportToExcel: async () => {
    const response = await apiClient.get('/avrrecordings/export/report', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'avr-systems-report.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

export const userService = {
  getAll: () => apiClient.get('/users'),
  getById: (id) => apiClient.get(`/users/${id}`),
  getStats: () => apiClient.get('/users/stats'),
  create: (data) => apiClient.post('/users', data),
  update: (id, data) => apiClient.put(`/users/${id}`, data),
  delete: (id) => apiClient.delete(`/users/${id}`),
  toggleLock: (id) => apiClient.put(`/users/${id}/lock`)
};
