import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authApi } from '../../api/authApi.js';
import { getSession, setSession, clearSession } from '../../data/session.js';

export const isAdminRole = (role) => ['admin', 'super_admin'].includes(String(role || '').toLowerCase());

export default function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [session, setCurrentSession] = useState(getSession);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState('');

  useEffect(() => {
    let active = true;
    authApi.me()
      .then((user) => {
        if (active) {
          const current = setSession(user);
          setCurrentSession(current);
          if (!isAdminRole(current.role)) navigate('/login', { replace: true });
        }
      })
      .catch((error) => {
        if (active) {
          clearSession();
          setCurrentSession(null);
          setSessionError(error.message);
        }
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });
    return () => { active = false; };
  }, [navigate]);

  /* Admin-only guard */
  if (checkingSession) {
    return <div className="container py-5 text-center">Checking administrator session…</div>;
  }
  if (sessionError) {
    return (
      <div className="container py-5">
        <div className="track-result track-error" role="alert">{sessionError}</div>
        <Link to="/login" className="btn btn-primary">Go to login</Link>
      </div>
    );
  }
  if (!session || !isAdminRole(session.role)) {
    return null;
  }

  const pageTitle = pathname === '/admin'
    ? 'Dashboard'
    : pathname === '/admin/users'
      ? 'User Management'
      : pathname === '/admin/branches'
        ? 'Branch Master'
        : pathname === '/admin/fee-master'
          ? 'Fee Master'
          : pathname === '/admin/applications'
            ? 'Manage Applications'
            : pathname.endsWith('/edit')
              ? 'Edit Application'
              : pathname.startsWith('/admin/application/')
                ? 'Application Details'
                : 'Admin';

  return (
    <div className="container admin-shell">
      {pathname !== '/admin/users' && pathname !== '/admin/branches' && (
        <h1 className="admin-page-title">{pageTitle}</h1>
      )}
      <Outlet />
    </div>
  );
}
