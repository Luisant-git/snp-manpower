import { apiRequest } from './client.js';

export const registrationApi = {
  create: (registration) => apiRequest('/registrations', {
    method: 'POST',
    body: registration,
  }),
  listMine: () => apiRequest('/registrations/my-submissions'),
  listAll: () => apiRequest('/registrations'),
  track: (ref, mobile) => apiRequest('/registrations/track', {
    method: 'POST',
    body: { ref, mobile },
  }),
  get: (ref) => apiRequest(`/registrations/${encodeURIComponent(ref)}`),
  review: (ref, changes) => apiRequest(`/registrations/${encodeURIComponent(ref)}/review`, {
    method: 'PATCH',
    body: changes,
  }),
  remove: (ref) => apiRequest(`/registrations/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
};
