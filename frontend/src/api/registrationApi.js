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
  update: (ref, changes) => apiRequest(`/registrations/${encodeURIComponent(ref)}`, {
    method: 'PATCH',
    body: changes,
  }),
  requestEdit: (ref, notes) => apiRequest(`/registrations/${encodeURIComponent(ref)}/request-edit`, {
    method: 'POST',
    body: { notes },
  }),
  reviewEditRequest: (ref, action, reason) => apiRequest(`/registrations/${encodeURIComponent(ref)}/review-edit-request`, {
    method: 'PATCH',
    body: { action, reason },
  }),
  remove: (ref) => apiRequest(`/registrations/${encodeURIComponent(ref)}`, { method: 'DELETE' }),
};
