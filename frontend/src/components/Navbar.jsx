import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { BRAND, NAV_LINKS } from '../data/site.js';
import { getSession, clearSession } from '../data/mockDb.js';

export default function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const session = getSession();

  const doLogout = () => {
    clearSession();
    setOpen(false);
    setAdminMenuOpen(false);
    navigate('/');
  };

  const panelLink = session
    ? { to: session.role === 'admin' ? '/admin' : '/register', label: session.role === 'admin' ? 'Admin Panel' : 'Candidate Form' }
    : null;

  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand" onClick={() => setOpen(false)}>
            <span className="brand-badge">{BRAND.short}</span>
            <span className="brand-text">
              {BRAND.name}
              <small>{BRAND.tagline}</small>
            </span>
          </Link>

          <ul className="nav-links">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  <i className={`bi ${link.icon}`}></i> {link.label}
                  {!session && link.to === '/register' && (
                    <i className="bi bi-lock-fill" style={{ fontSize: '.75rem', opacity: .7 }}></i>
                  )}
                </NavLink>
              </li>
            ))}
            {session && (
              <li>
                <NavLink
                  to="/my-submissions"
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  <i className="bi bi-person-lines-fill"></i> My Submissions
                </NavLink>
              </li>
            )}
          </ul>

          <div className="nav-actions">
            {session ? (
              <>
                <span className="session-chip">
                  <i className={`bi ${session.role === 'admin' ? 'bi-shield-lock-fill' : 'bi-person-badge-fill'}`}></i>
                  {session.name}
                </span>
                {session.role === 'admin' ? (
                  <div
                    className={`nav-admin-menu${adminMenuOpen ? ' open' : ''}`}
                    onMouseEnter={() => setAdminMenuOpen(true)}
                    onMouseLeave={() => setAdminMenuOpen(false)}
                  >
                    <button
                      type="button"
                      className="btn btn-sm btn-outline nav-admin-trigger"
                      aria-haspopup="true"
                      aria-expanded={adminMenuOpen}
                      onClick={() => setAdminMenuOpen((isOpen) => !isOpen)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') setAdminMenuOpen(false);
                      }}
                    >
                      {panelLink.label} <i className="bi bi-chevron-down"></i>
                    </button>
                    <div className="nav-admin-dropdown">
                      {[
                        { to: '/admin', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
                        { to: '/admin/users', label: 'User Management', icon: 'bi-people' },
                        { to: '/admin/branches', label: 'Branch Master', icon: 'bi-building' },
                        { to: '/admin/applications', label: 'Manage Applications', icon: 'bi-folder2-open' },
                      ].map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) => `nav-admin-dropdown-link${isActive ? ' active' : ''}`}
                          onClick={() => setAdminMenuOpen(false)}
                        >
                          <i className={`bi ${item.icon}`}></i>{item.label}
                        </NavLink>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link to={panelLink.to} className="btn btn-sm btn-outline">
                    {panelLink.label}
                  </Link>
                )}
                <button className="btn btn-sm btn-dark" onClick={doLogout}>
                  <i className="bi bi-box-arrow-right"></i> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-sm btn-outline">
                  <i className="bi bi-whatsapp text-success"></i> WhatsApp Login
                </Link>
                <Link to="/login" className="btn btn-sm btn-dark">
                  <i className="bi bi-shield-lock"></i> Admin
                </Link>
              </>
            )}
          </div>

          <button
            className="nav-toggle no-print"
            aria-label="Toggle navigation"
            onClick={() => setOpen((v) => !v)}
          >
            <i className={`bi ${open ? 'bi-x-lg' : 'bi-list'}`}></i>
          </button>
        </div>

        {open && (
          <div className="nav-mobile open">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className="nav-link"
                onClick={() => setOpen(false)}
              >
                <i className={`bi ${link.icon}`}></i> {link.label}
              </NavLink>
            ))}
            {session && (
              <NavLink
                to="/my-submissions"
                className="nav-link"
                onClick={() => setOpen(false)}
              >
                <i className="bi bi-person-lines-fill"></i> My Submissions
              </NavLink>
            )}
            {session?.role === 'admin' && (
              <div className="nav-mobile-admin-links">
                <span>Admin Panel</span>
                {[
                  { to: '/admin', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
                  { to: '/admin/users', label: 'User Management', icon: 'bi-people' },
                  { to: '/admin/branches', label: 'Branch Master', icon: 'bi-building' },
                  { to: '/admin/applications', label: 'Manage Applications', icon: 'bi-folder2-open' },
                ].map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className="nav-link"
                    onClick={() => setOpen(false)}
                  >
                    <i className={`bi ${item.icon}`}></i> {item.label}
                  </NavLink>
                ))}
              </div>
            )}
            <div className="actions">
              {session ? (
                <>
                  <Link to={panelLink.to} className="btn btn-sm btn-outline" onClick={() => setOpen(false)}>
                    {panelLink.label}
                  </Link>
                  <button className="btn btn-sm btn-dark" onClick={doLogout}>
                    <i className="bi bi-box-arrow-right"></i> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-sm btn-outline" onClick={() => setOpen(false)}>
                    <i className="bi bi-whatsapp text-success"></i> WhatsApp Login
                  </Link>
                  <Link to="/login" className="btn btn-sm btn-dark" onClick={() => setOpen(false)}>
                    <i className="bi bi-shield-lock"></i> Admin
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
