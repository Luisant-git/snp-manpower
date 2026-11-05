import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi.js';
import { whatsappApi } from '../api/whatsappApi.js';
import { setSession } from '../data/session.js';

export default function Login() {
  const navigate = useNavigate();

  /* Single flow: phone -> password (admin) or OTP (employee) -> done */
  const [stage, setStage] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSentFor, setOtpSentFor] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const otpRefs = useRef([]);

  const digits = otp.join('');

  const resetToPhone = () => {
    setStage('phone');
    setOtp(['', '', '', '', '', '']);
    setPassword('');
    setError('');
  };

  const identifyAccount = async (e) => {
    e.preventDefault();
    if (phone.length !== 10 || checking) return;
    setChecking(true);
    setError('');
    try {
      const result = await authApi.identifyLogin(phone);
      if (result.method === 'password') {
        setPassword('');
        setStage('password');
      } else {
        if (otpSentFor !== phone) {
          await whatsappApi.requestOtp(phone, 'LOGIN');
          setOtpSentFor(phone);
        }
        setOtp(['', '', '', '', '', '']);
        setStage('otp');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
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

  const resendOtp = async () => {
    if (resendingOtp) return;
    setError('');
    setResendingOtp(true);
    try {
      await whatsappApi.requestOtp(phone, 'LOGIN');
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.message);
    } finally {
      setResendingOtp(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (digits.length !== 6) return;
    setError('');
    setVerifyingOtp(true);
    try {
      const user = await authApi.loginWithOtp(phone, digits);
      setSession(user);
      setStage('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const adminLogin = async (e) => {
    e.preventDefault();
    if (!password) return;
    setError('');
    setLoggingIn(true);
    try {
      const user = await authApi.login({ mobile: phone, password });
      if (String(user.role).toLowerCase() !== 'admin') {
        await authApi.logout();
        throw new Error('This account is not an administrator. Use the OTP option for employee access.');
      }
      setSession(user);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="auth-wrap login-wrap">
      <div className="auth-card p-0">
        <div className="auth-card-body">
          {stage === 'phone' && (
            <>
              <div className="auth-icon auth-icon-brand">
                <i className="bi bi-person-badge-fill"></i>
              </div>
              <h3 className="auth-title">Employee &amp; Admin Login</h3>
              <p className="auth-sub">
                Enter the mobile number registered in User Management. We&apos;ll check your account
                and ask for the right sign-in method.
              </p>

              {error && (
                <div className="alert-error" role="alert">
                  <i className="bi bi-exclamation-triangle-fill"></i> {error}
                </div>
              )}

              <form onSubmit={identifyAccount}>
                <label className="field-label" htmlFor="login-mobile">
                  Mobile Number
                </label>
                <div className="auth-phone-row">
                  <span className="auth-prefix">
                    <i className="bi bi-phone"></i> +91
                  </span>
                  <input
                    id="login-mobile"
                    className="auth-input"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    autoComplete="tel"
                    required
                    autoFocus
                    placeholder="e.g. 9840123456"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setError('');
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  style={{ marginTop: 18 }}
                  disabled={phone.length !== 10 || checking}
                >
                  <i className="bi bi-arrow-right-circle"></i> {checking ? 'Checking...' : 'Continue'}
                </button>
              </form>

              <p className="auth-method-note">
                <i className="bi bi-info-circle"></i>
                <span>Only numbers registered in User Management can sign in. Admins use a password; employees use a WhatsApp OTP.</span>
              </p>
            </>
          )}

          {stage === 'password' && (
            <>
              <div className="auth-icon auth-icon-dark">
                <i className="bi bi-shield-lock-fill"></i>
              </div>
              <h3 className="auth-title">Admin Login</h3>
              <p className="auth-sub">
                Admin account found for <strong>+91 {phone}</strong>. Enter your password to
                continue.
              </p>

              {error && (
                <div className="alert-error" role="alert">
                  <i className="bi bi-exclamation-triangle-fill"></i> {error}
                </div>
              )}

              <form onSubmit={adminLogin}>
                <label className="field-label" htmlFor="login-password">
                  Password
                </label>
                <input
                  id="login-password"
                  className="auth-input"
                  type="password"
                  autoComplete="current-password"
                  required
                  autoFocus
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                />
                <button
                  type="submit"
                  className="btn btn-dark btn-block"
                  style={{ marginTop: 18 }}
                  disabled={!password || loggingIn}
                >
                  <i className="bi bi-box-arrow-in-right"></i>{' '}
                  {loggingIn ? 'Logging in...' : 'Login'}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-block btn-outline"
                  style={{ marginTop: 10 }}
                  onClick={resetToPhone}
                >
                  Use a different number
                </button>
              </form>
            </>
          )}

          {stage === 'otp' && (
            <>
              <div className="auth-icon">
                <i className="bi bi-whatsapp"></i>
              </div>
              <h3 className="auth-title">Verify OTP</h3>
              <p className="auth-sub">
                Enter the 6-digit code sent to WhatsApp for <strong>+91 {phone}</strong>.
              </p>

              {error && (
                <div className="alert-error" role="alert">
                  <i className="bi bi-exclamation-triangle-fill"></i> {error}
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
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={val}
                      onChange={(e) => changeOtp(i, e.target.value)}
                      onKeyDown={(e) => onKeyDown(i, e)}
                    />
                  ))}
                </div>
                <div className="auth-resend">
                  <span>Didn&apos;t receive the code?</span>
                  <button type="button" onClick={resendOtp} disabled={resendingOtp}>
                    {resendingOtp ? 'Sending...' : 'Resend OTP'}
                  </button>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={digits.length !== 6 || verifyingOtp}
                >
                  <i className="bi bi-box-arrow-in-right"></i>{' '}
                  {verifyingOtp ? 'Verifying...' : 'Login'}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-block btn-outline"
                  style={{ marginTop: 10 }}
                  onClick={resetToPhone}
                >
                  Change Number
                </button>
              </form>
            </>
          )}

          {stage === 'done' && (
            <div className="auth-success">
              <div className="big">
                <i className="bi bi-check-lg"></i>
              </div>
              <h3 className="auth-title" style={{ textAlign: 'center' }}>
                Login Successful!
              </h3>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
                <Link to="/register" className="btn btn-primary">
                  <i className="bi bi-arrow-right-circle"></i> Continue
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
