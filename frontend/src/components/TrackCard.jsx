import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getApplications } from '../data/mockDb.js';

/* Mock tracker for demo reference numbers — real submitted applications
   come from mockDb. Replace both with a live API call later. */
const MOCK_RESULTS = {
  'SNP-20261103-1042': {
    status: 'Shortlisted for Interview Drive (Week 2)',
    detail: 'Direct interview scheduled — report at Venue B, 10:00 AM with ID proof.',
  },
  'SNP-20261102-1001': {
    status: 'Payment Pending',
    detail: 'Registration fee processed partially. Complete verification to unlock interviews.',
  },
};

export default function TrackCard() {
  const [ref, setRef] = useState('');
  const [result, setResult] = useState(null);

  const track = (e) => {
    e.preventDefault();
    const code = ref.trim().toUpperCase();
    if (!code) return;

    // Priority 1: real applications stored from the registration form
    const found = getApplications().find((a) => a.ref === code);
    if (found) {
      setResult({
        status: found.status || 'Under Review',
        detail: `Candidate: ${found.name} — filled by ${found.submittedBy || 'Direct Registration'}.`,
      });
      return;
    }

    // Priority 2: demo lookup (generates a plausible demo response)
    setResult(
      MOCK_RESULTS[code] || {
        status: 'Application Found — Under Review',
        detail: `${code} has been received and is queued for recruiter verification.`,
      }
    );
  };

  return (
    <div className="track-card">
      <div className="track-head">
        <div className="track-icon">
          <i className="bi bi-search"></i>
        </div>
        <div>
          <h3>Track Application</h3>
          <small>Enter your unique reference number</small>
        </div>
      </div>

      <form className="track-form" onSubmit={track}>
        <input
          className="track-input"
          placeholder="e.g. SNP-20261103-1042"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
        />
        <button className="btn btn-primary" type="submit">
          <i className="bi bi-arrow-right"></i> Track
        </button>
      </form>

      {result && (
        <div className="track-result">
          <i className="bi bi-clipboard-check-fill"></i>
          <div>
            <div>{result.status}</div>
            <small style={{ fontWeight: 500 }}>{result.detail}</small>
          </div>
        </div>
      )}

      <div className="track-divider">OR</div>

      <div className="track-admin">
        <div className="label">Recruitment Department / Admin Access</div>
        <Link to="/login" className="btn btn-dark btn-sm btn-block">
          <i className="bi bi-shield-lock"></i> Admin Control Panel Login
        </Link>
      </div>
    </div>
  );
}
