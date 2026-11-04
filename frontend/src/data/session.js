const SESSION_KEY = 'snp_session';

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setSession(user) {
  const session = {
    ...user,
    role: String(user.role || '').toLowerCase(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event('snp-session-change'));
  return session;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event('snp-session-change'));
}
