import { BRAND } from '../data/site.js';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <span className="brand-badge" style={{ fontSize: '0.85rem', padding: '5px 10px' }}>
                {BRAND.short}
              </span>
              <strong>{BRAND.fullName}</strong>
            </div>
            <p className="footer-desc">
              Industrial &amp; corporate manpower recruitment, staffing, verification and placement
              solutions — connecting verified candidates with trusted employers.
            </p>
          </div>

          <div className="footer-right">
            <div className="footer-badges">
              <span>
                <i className="bi bi-shield-check"></i> Secure Candidate Database
              </span>
              <span>
                <i className="bi bi-whatsapp"></i> WhatsApp Cloud API Ready
              </span>
              <Link to="/login">
                <i className="bi bi-lock"></i> Admin Login
              </Link>
            </div>
            <div className="footer-copy">
              © {new Date().getFullYear()} {BRAND.fullName}. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
