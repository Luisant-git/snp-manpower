import { apiRequest, getApiOrigin } from './client.js';

export async function uploadRegistrationFile(kind, file) {
  const formData = new FormData();
  formData.append('file', file);
  const uploaded = await apiRequest(`/uploads/${encodeURIComponent(kind)}`, {
    method: 'POST',
    body: formData,
  });
  return { ...uploaded, url: new URL(uploaded.url, getApiOrigin()).toString() };
}
