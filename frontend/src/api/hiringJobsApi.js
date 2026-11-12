import { apiRequest } from './client.js';

export const hiringJobsApi = {
  approvals: () => apiRequest('/hiring-jobs/approvals'),
  available: () => apiRequest('/hiring-jobs/available'),
  approve: (job) => {
    const jobId = String(job?.id || '').trim();
    if (!jobId) throw new Error('Job id is required.');
    return apiRequest(`/hiring-jobs/${encodeURIComponent(jobId)}/approve`, {
      method: 'POST',
      body: { job },
    });
  },
};
