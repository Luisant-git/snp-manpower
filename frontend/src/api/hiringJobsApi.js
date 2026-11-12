import { apiRequest } from './client.js';

export const hiringJobsApi = {
  approvals: (signal) => apiRequest('/hiring-jobs/approvals', { signal }),
  available: () => apiRequest('/hiring-jobs/available'),
  approve: (job) => {
    const jobId = String(job?.id || '').trim();
    if (!jobId) throw new Error('Job id is required.');
    return apiRequest(`/hiring-jobs/${encodeURIComponent(jobId)}/approve`, {
      method: 'POST',
      body: { job },
    });
  },
  reject: (job) => {
    const jobId = String(job?.id || '').trim();
    if (!jobId) throw new Error('Job id is required.');
    return apiRequest(`/hiring-jobs/${encodeURIComponent(jobId)}/reject`, {
      method: 'POST',
      body: { job },
    });
  },
  close: (job) => {
    const jobId = String(job?.id || '').trim();
    if (!jobId) throw new Error('Job id is required.');
    return apiRequest(`/hiring-jobs/${encodeURIComponent(jobId)}/close`, {
      method: 'POST',
    });
  },
  reopen: (job) => {
    const jobId = String(job?.id || '').trim();
    if (!jobId) throw new Error('Job id is required.');
    return apiRequest(`/hiring-jobs/${encodeURIComponent(jobId)}/reopen`, {
      method: 'POST',
    });
  },
};
