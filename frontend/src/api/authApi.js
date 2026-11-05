import { apiRequest } from './client.js';

export const authApi = {
  identifyLogin: (mobile) => apiRequest('/auth/login/identify', {
    method: 'POST',
    body: { mobile },
  }),
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),
  loginWithOtp: (mobile, code) => apiRequest('/auth/login/otp', {
    method: 'POST',
    body: { mobile, code },
  }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  me: () => apiRequest('/auth/me'),
};
