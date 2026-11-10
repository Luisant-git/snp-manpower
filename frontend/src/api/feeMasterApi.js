import { apiRequest } from './client.js';

export const feeMasterApi = {
  getRegistrationFee: () => apiRequest('/fee-master/registration-fee'),
  listAll: () => apiRequest('/fee-master'),
  updateRegistrationFee: (amount, description) =>
    apiRequest('/fee-master/registration-fee', {
      method: 'PUT',
      body: { amount, description },
    }),
};

export default feeMasterApi;
