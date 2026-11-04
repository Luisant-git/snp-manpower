import { apiRequest } from './client.js';

export const userApi = {
  list: () => apiRequest('/users'),
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
