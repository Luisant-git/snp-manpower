import { apiRequest } from './client.js';

export const branchApi = {
  list: () => apiRequest('/branches'),
  listAll: () => apiRequest('/branches/all'),
  create: (branch) => apiRequest('/branches', { method: 'POST', body: branch }),
  update: (id, changes) => apiRequest(`/branches/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: changes,
  }),
};
