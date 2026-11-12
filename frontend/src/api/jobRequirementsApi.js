import { apiRequest } from './client.js';

const JOB_REQUIREMENTS_PATH = '/hiring-jobs';

export const jobRequirementsApi = {
  list({ page = 1, limit = 50, signal } = {}) {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    }).toString();
    return apiRequest(`${JOB_REQUIREMENTS_PATH}?${query}`, { signal });
  },
};
