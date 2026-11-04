export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001')
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api$/i, '');

export function getApiOrigin() {
  const apiUrl = new URL(API_BASE_URL);
  const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
  if (localHosts.has(window.location.hostname) && localHosts.has(apiUrl.hostname)) {
    apiUrl.hostname = window.location.hostname;
  }
  return apiUrl.origin;
}

export async function apiRequest(path, { method = 'GET', body, headers = {} } = {}) {
  const apiOrigin = getApiOrigin();
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  let response;
  try {
    response = await fetch(`${apiOrigin}/api${path.startsWith('/') ? path : `/${path}`}`, {
      method,
      credentials: 'include',
      headers: {
        ...(body === undefined || isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
      ...(body === undefined ? {} : { body: isFormData ? body : JSON.stringify(body) }),
    });
  } catch {
    throw new Error(`Could not connect to the API at ${apiOrigin}.`);
  }

  const contentType = response.headers.get('content-type') || '';
  const result = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof result === 'object' && result !== null
      ? result.message
      : result;
    throw new Error(
      Array.isArray(message)
        ? message.join(', ')
        : message || `API request failed (${response.status}).`,
    );
  }

  return result;
}
