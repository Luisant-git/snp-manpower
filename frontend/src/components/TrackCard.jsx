import { useState } from 'react';
import { Link } from 'react-router-dom';
import { registrationApi } from '../api/registrationApi.js';

export default function TrackCard() {
  const [ref, setRef] = useState('');
  const [mobile, setMobile] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const track = async (e) => {
    e.preventDefault();
    const code = ref.trim().toUpperCase();
    if (!code || !/^\d{10}$/.test(mobile)) {
      setError('Enter your driver registration reference and 10-digit mobile number.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const application = await registrationApi.track(code, mobile);
      const status = String(application.status || 'UNDER_REVIEW').replace(/_/g, ' ');
      const payment = String(application.paymentStatus || 'PENDING').replace(/_/g, ' ');
      setResult({
        status: status[0] + status.slice(1).toLowerCase(),
        detail: `Payment status: ${payment[0] + payment.slice(1).toLowerCase()}.`,
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="track-card">
      <div className="track-head">
        <div className="track-icon">
          <i className="bi bi-search"></i>
        </div>
        <div>
          <h3>Track Driver Registration</h3>
          <small>Check your registration and placement updates</small>
        </div>
      </div>

      <form className="track-form" onSubmit={track}>
        <input
          className="track-input"
          placeholder="Enter your registration reference"
          value={ref}
          onChange={(e) => {
            setRef(e.target.value);
            setError('');
          }}
          required
        />
        <input
          className="track-input"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          placeholder="Driver mobile number"
          value={mobile}
          onChange={(e) => {
            setMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
            setError('');
          }}
          required
        />
        <button className="btn btn-primary" type="submit" disabled={loading || !ref.trim() || mobile.length !== 10}>
          <i className="bi bi-arrow-right"></i> {loading ? 'Checking…' : 'Track'}
        </button>
      </form>

      {error && <div className="track-result track-error" role="alert">{error}</div>}
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
