import { apiRequest } from './client.js';

export const employeeApi = {
  getByMobile: (mobile) => apiRequest(`/employees/${encodeURIComponent(mobile)}`),
};
