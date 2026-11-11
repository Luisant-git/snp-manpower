import { apiRequest } from './client.js';

export const userApi = {
  list: ({ search = '', role = '', page = 1, pageSize = 10 } = {}) => {
    const query = new URLSearchParams({ search, role, page: String(page), pageSize: String(pageSize) });
    return apiRequest(`/users?${query.toString()}`);
  },
  create: (user) => apiRequest('/users', { method: 'POST', body: user }),
  update: (id, changes) => apiRequest(`/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: changes,
  }),
  setActive: (id, isActive) => apiRequest(`/users/${encodeURIComponent(id)}/active`, {
    method: 'PATCH',
    body: { isActive },
  }),
  remove: (id) => apiRequest(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
