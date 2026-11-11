import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BRAND, NAV_LINKS } from '../data/site.js';
import { authApi } from '../api/authApi.js';
import { clearSession, getSession } from '../data/session.js';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [session, setCurrentSession] = useState(getSession);
  const [logoLoaded, setLogoLoaded] = useState(false);

  useEffect(() => {
    const refreshSession = () => setCurrentSession(getSession());
    window.addEventListener('snp-session-change', refreshSession);
    return () => window.removeEventListener('snp-session-change', refreshSession);
  }, []);

  const doLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout request failed:', error);
    }
    clearSession();
    setOpen(false);
    setAdminMenuOpen(false);
    navigate('/login');
  };

  const isAdminRole = (role) => ['admin', 'super_admin'].includes(String(role || '').toLowerCase());
  const isAdmin = session && isAdminRole(session.role);
  const isApplicant = session && String(session.role).toUpperCase() === 'APPLICANT';

  const panelLink = session
    ? {
        to: isAdmin ? '/admin' : (isApplicant ? '/my-submissions' : '/register'),
        label: isAdmin ? 'Admin Panel' : (isApplicant ? 'My Applications' : 'Registrations'),
      }
    : null;

  const hideGuestMenu = location.pathname === '/login' && !session;
  if (hideGuestMenu) return null;

  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar-inner">
          <Link
            to={session && String(session.role).toUpperCase() === 'APPLICANT' ? '/my-submissions' : '/register'}
            className="navbar-brand"
            aria-label={`${BRAND.fullName} registration`}
            onClick={() => setOpen(false)}
          >
            <img
              src="/assets/brand-logo.png"
              alt=""
              className={`navbar-brand-logo${logoLoaded ? ' is-loaded' : ''}`}
              onLoad={() => setLogoLoaded(true)}
              onError={() => setLogoLoaded(false)}
            />
          </Link>

          <ul className="nav-links">
            {(!session || String(session.role).toUpperCase() !== 'APPLICANT') && NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            {session && (
              <li>
                <NavLink
                  to="/my-submissions"
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  {String(session.role).toUpperCase() === 'APPLICANT' ? 'My Applications' : 'Applications'}
                </NavLink>
              </li>
            )}
          </ul>

          <div className="nav-actions">
            {session ? (
              <>
                <span className="session-chip">
                  <i className={`bi ${isAdmin ? 'bi-shield-lock-fill' : 'bi-person-badge-fill'}`}></i>
                  {session.name}
                </span>
                {isAdmin ? (
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
                        { to: '/admin/fee-master', label: 'Fee Master', icon: 'bi-currency-rupee' },
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
            aria-expanded={open}
            aria-controls="primary-navigation"
            onClick={() => setOpen((v) => !v)}
          >
            <i className={`bi ${open ? 'bi-x-lg' : 'bi-list'}`}></i>
          </button>
        </div>

        {open && (
          <div className="nav-mobile open" id="primary-navigation">
            {(!session || String(session.role).toUpperCase() !== 'APPLICANT') && NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className="nav-link"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            {session && (
              <NavLink
                to="/my-submissions"
                className="nav-link"
                onClick={() => setOpen(false)}
              >
                {String(session.role).toUpperCase() === 'APPLICANT' ? 'My Applications' : 'Applications'}
              </NavLink>
            )}
            {isAdmin && (
              <div className="nav-mobile-admin-links">
                <span>Admin Panel</span>
                {[
                  { to: '/admin', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
                  { to: '/admin/users', label: 'User Management', icon: 'bi-people' },
                  { to: '/admin/branches', label: 'Branch Master', icon: 'bi-building' },
                  { to: '/admin/fee-master', label: 'Fee Master', icon: 'bi-currency-rupee' },
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
