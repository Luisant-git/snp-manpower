import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authApi } from '../../api/authApi.js';
import { getSession, setSession, clearSession } from '../../data/session.js';

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
  { to: '/admin/users', label: 'User Management', icon: 'bi-people' },
  { to: '/admin/branches', label: 'Branch Master', icon: 'bi-building' },
  { to: '/admin/applications', label: 'Manage Applications', icon: 'bi-folder2-open' },
];

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
          if (current.role !== 'admin') navigate('/login', { replace: true });
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
  if (!session || session.role !== 'admin') {
    return null;
  }

  const doLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout request failed:', error);
    }
    clearSession();
    navigate('/');
  };

  return (
    <div className={`container admin-shell${pathname === '/admin/applications' ? ' admin-applications-wide' : ''}`}>
      {/* ---------- Header ---------- */}
      <div className="admin-head">
        <div className="admin-welcome-tile">
          <span className="admin-welcome-mark" aria-hidden="true">
            <i className="bi bi-sliders2"></i>
          </span>
          <div className="admin-welcome-copy">
            <span className="section-eyebrow">Admin Control Panel</span>
            <h2 className="section-title">
              Welcome, {session.name}
            </h2>
          </div>
        </div>
        <button className="btn logout-btn" onClick={doLogout}>
          <i className="bi bi-box-arrow-right"></i> Logout
        </button>
      </div>

      {/* ---------- Sub navigation ---------- */}
      <div className="admin-tabs">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => `tab-pill${isActive ? ' active' : ''}`}
          >
            <i className={`bi ${l.icon}`}></i> {l.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
