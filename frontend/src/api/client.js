export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001')
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api$/i, '');

export async function apiRequest(path, { method = 'GET', body, headers = {} } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api${path.startsWith('/') ? path : `/${path}`}`, {
      method,
      credentials: 'include',
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error(`Could not connect to the API at ${API_BASE_URL}.`);
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
