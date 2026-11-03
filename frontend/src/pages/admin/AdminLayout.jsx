import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getSession, clearSession } from '../../data/mockDb.js';

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
  { to: '/admin/users', label: 'User Management', icon: 'bi-people' },
  { to: '/admin/applications', label: 'Manage Applications', icon: 'bi-folder2-open' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const session = getSession();

  /* Admin-only guard */
  if (!session || session.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const doLogout = () => {
    clearSession();
    navigate('/');
  };

  return (
    <div className="container admin-shell">
      {/* ---------- Header ---------- */}
      <div className="admin-head">
        <div>
          <span className="section-eyebrow">
            <i className="bi bi-shield-lock-fill"></i> Admin Control Panel
          </span>
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            Welcome, {session.name}
          </h2>
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
