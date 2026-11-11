import { apiRequest } from './client.js';

export const branchApi = {
  list: () => apiRequest('/branches'),
  listAll: () => apiRequest('/branches/all'),
  listForManagement: ({ search = '', status = 'all', page = 1, pageSize = 10 } = {}) => {
    const query = new URLSearchParams({ search, status, page: String(page), pageSize: String(pageSize) });
    return apiRequest(`/branches/manage?${query.toString()}`);
  },
  create: (branch) => apiRequest('/branches', { method: 'POST', body: branch }),
  update: (id, changes) => apiRequest(`/branches/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: changes,
  }),
};
