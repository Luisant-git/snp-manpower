import { apiRequest } from './client.js';

export const whatsappApi = {
  requestOtp: (mobile, purpose) => apiRequest('/whatsapp/otp/request', {
    method: 'POST',
    body: { mobile, purpose },
  }),
  verifyOtp: (mobile, purpose, code) => apiRequest('/whatsapp/otp/verify', {
    method: 'POST',
    body: { mobile, purpose, code },
  }),
};
