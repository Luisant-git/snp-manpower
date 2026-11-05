import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi.js';
import { whatsappApi } from '../api/whatsappApi.js';
import { setSession } from '../data/session.js';

export default function Login() {
  const navigate = useNavigate();

  /* Top tabs — mirrors the original site: WhatsApp OTP | Admin Login */
  const [tab, setTab] = useState('whatsapp');

  /* WhatsApp OTP flow: 'phone' -> 'otp' -> 'done' */
  const [stage, setStage] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const otpRefs = useRef([]);

  /* Admin / staff password login */
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const digits = otp.join('');

  const sendOtp = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) return;
    setSendingOtp(true);
    setOtpError('');
    try {
      await whatsappApi.requestOtp(phone, 'LOGIN');
      setOtp(['', '', '', '', '', '']);
      setStage('otp');
    } catch (error) {
      setOtpError(error.message);
    } finally {
      setSendingOtp(false);
    }
  };

  const changeOtp = (i, val) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[i] = clean;
    setOtp(next);
    if (clean && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (digits.length !== 6) return;
    setOtpError('');
    setVerifyingOtp(true);
    try {
      const user = await authApi.loginWithOtp(phone, digits);
      setSession(user);
      setStage('done');
    } catch (error) {
      setOtpError(error.message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  /* Admin — ONLY System Administrator role may use mobile + password */
  const adminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const user = await authApi.login({ mobile: username, password });
      if (String(user.role).toLowerCase() !== 'admin') {
        await authApi.logout();
        throw new Error('This login is restricted to system administrators. Use WhatsApp OTP for employee and applicant access.');
      }
      setSession(user);
      navigate('/admin');
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card p-0">
        {/* ---------- Tab headers (like the original login card) ---------- */}
        <div className="tab-pills">
          <button
            className={`tab-pill${tab === 'whatsapp' ? ' active' : ''}`}
            onClick={() => {
              setTab('whatsapp');
              setLoginError('');
            }}
            type="button"
          >
            <i className="bi bi-whatsapp text-success"></i> WhatsApp OTP Login
          </button>
          <button
            className={`tab-pill${tab === 'admin' ? ' active' : ''}`}
            onClick={() => {
              setTab('admin');
              setLoginError('');
            }}
            type="button"
          >
            <i className="bi bi-shield-lock"></i> Admin Login
          </button>
        </div>

        <div className="auth-card-body">
          {/* ================= WHATSAPP TAB ================= */}
          {tab === 'whatsapp' && stage === 'phone' && (
            <>
              <div className="auth-icon auth-icon-green">
                <i className="bi bi-whatsapp"></i>
              </div>
              <h3 className="auth-title">Employee / Applicant Login</h3>
              <p className="auth-sub">
                Enter your 10-digit registered mobile number to receive a secure WhatsApp
                verification code.
              </p>
              <form onSubmit={sendOtp}>
                <label className="field-label">Mobile Number (WhatsApp Enabled)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      gap: 6,
                      alignItems: 'center',
                      fontWeight: 800,
                      color: 'var(--navy)',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: 10,
                      padding: '12px 12px',
                      background: '#f8fafc',
                    }}
                  >
                    <i className="bi bi-phone"></i> +91
                  </span>
                  <input
                    className="auth-input"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    required
                    autoFocus
                    placeholder="e.g. 9840123456"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setOtpError('');
                    }}
                  />
                </div>
                <small style={{ color: 'var(--muted)', fontSize: '.78rem', display: 'block', marginTop: 6 }}>
                  We'll send an official 6-digit OTP code to your WhatsApp.
                </small>
                <button
                  type="submit"
                  className="btn btn-teal btn-block"
                  style={{ marginTop: 18 }}
                  disabled={phone.length !== 10 || sendingOtp}
                >
                  <i className="bi bi-send-fill"></i> {sendingOtp ? 'Sending...' : 'Send WhatsApp OTP'}
                </button>
                {otpError && <div className="alert-error" role="alert" style={{ marginTop: 12 }}>
                  <i className="bi bi-exclamation-triangle-fill"></i> {otpError}
                </div>}
              </form>
            </>
          )}

          {tab === 'whatsapp' && stage === 'otp' && (
            <>
              <div className="auth-icon">
                <i className="bi bi-shield-lock-fill"></i>
              </div>
              <h3 className="auth-title">Verify OTP</h3>
              <p className="auth-sub">Enter the 6-digit code sent to WhatsApp for +91 {phone}</p>

              {otpError && (
                <div className="alert-error">
                  <i className="bi bi-exclamation-triangle-fill"></i> {otpError}
                </div>
              )}

              <form onSubmit={verifyOtp}>
                <div className="otp-boxes">
                  {otp.map((val, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      className="otp-box"
                      inputMode="numeric"
                      maxLength={1}
                      value={val}
                      onChange={(e) => changeOtp(i, e.target.value)}
                      onKeyDown={(e) => onKeyDown(i, e)}
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={digits.length !== 6 || verifyingOtp}
                >
                  <i className="bi bi-box-arrow-in-right"></i> {verifyingOtp ? 'Verifying...' : 'Login'}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-block btn-outline"
                  style={{ marginTop: 10 }}
                  onClick={() => {
                    setStage('phone');
                    setOtp(['', '', '', '', '', '']);
                    setOtpError('');
                  }}
                >
                  Change Number
                </button>
              </form>
            </>
          )}

          {tab === 'whatsapp' && stage === 'done' && (
            <div className="auth-success">
              <div className="big">
                <i className="bi bi-check-lg"></i>
              </div>
              <h3 className="auth-title" style={{ textAlign: 'center' }}>
                Login Successful!
              </h3>
              <p className="auth-sub" style={{ marginBottom: 20 }}>
                +91 {phone} verified via WhatsApp. Your application dossier is now unlocked.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <Link to="/track" className="btn btn-outline">
                  <i className="bi bi-search"></i> Track Application
                </Link>
                <Link to="/register" className="btn btn-primary">
                  <i className="bi bi-file-earmark-person"></i> Update Dossier
                </Link>
              </div>
            </div>
          )}

          {/* ================= ADMIN / STAFF TAB ================= */}
          {tab === 'admin' && (
            <>
              <div className="auth-icon auth-icon-dark">
                <i className="bi bi-shield-lock-fill"></i>
              </div>
              <h3 className="auth-title">Admin Control Login</h3>
              <p className="auth-sub">
                Restricted access for recruitment officers &amp; system administrators.
              </p>

              {loginError && (
                <div className="alert-error">
                  <i className="bi bi-exclamation-triangle-fill"></i> {loginError}
                </div>
              )}

              <form onSubmit={adminLogin}>
                <div style={{ marginBottom: 14 }}>
                  <label className="field-label">Admin Username / Registered Mobile</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        border: '1.5px solid #cbd5e1',
                        borderRadius: 10,
                        padding: '12px 14px',
                        background: '#f8fafc',
                        color: 'var(--slate)',
                      }}
                    >
                      <i className="bi bi-person"></i>
                    </span>
                    <input
                      className="auth-input"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="10-digit admin mobile"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label className="field-label">Password</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        border: '1.5px solid #cbd5e1',
                        borderRadius: 10,
                        padding: '12px 14px',
                        background: '#f8fafc',
                        color: 'var(--slate)',
                      }}
                    >
                      <i className="bi bi-key"></i>
                    </span>
                    <input
                      className="auth-input"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Admin password"
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-dark btn-block" disabled={loggingIn}>
                  <i className="bi bi-box-arrow-in-right"></i> {loggingIn ? 'Logging in...' : 'Login to Admin Panel'}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="auth-card-foot">
          <small>
            <i className="bi bi-shield-check text-success"></i> End-to-end encrypted session.
          </small>
        </div>
      </div>
    </div>
  );
}
