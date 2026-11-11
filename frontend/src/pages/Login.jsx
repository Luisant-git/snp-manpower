import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi.js';
import { whatsappApi } from '../api/whatsappApi.js';
import { setSession } from '../data/session.js';

export default function Login() {
  const navigate = useNavigate();

  /* Single flow: phone -> password (admin) or OTP (employee). */
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
  const otpVerificationInProgress = useRef(false);

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
    const next = [...otp];
    const enteredDigits = val.replace(/\D/g, '');
    const cleanDigits = enteredDigits.slice(0, 6 - i);
    next[i] = '';
    cleanDigits.split('').forEach((digit, offset) => {
      next[i + offset] = digit;
    });
    setOtp(next);
    setError('');
    const nextDigits = next.join('');
    if (nextDigits.length === 6) {
      verifyOtp(null, nextDigits);
    } else if (cleanDigits && i + cleanDigits.length < 6) {
      otpRefs.current[i + cleanDigits.length]?.focus();
    }
  };

  const onKeyDown = (i, e) => {
    if (e.key !== 'Backspace') return;

    e.preventDefault();
    const next = [...otp];
    if (next[i]) {
      next[i] = '';
    } else if (i > 0) {
      next[i - 1] = '';
      otpRefs.current[i - 1]?.focus();
    }
    setOtp(next);
    setError('');
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

  const verifyOtp = async (e, code = digits) => {
    e?.preventDefault();
    if (code.length !== 6 || otpVerificationInProgress.current) return;
    otpVerificationInProgress.current = true;
    setError('');
    setVerifyingOtp(true);
    try {
      const user = await authApi.loginWithOtp(phone, code);
      setSession(user);
      navigate('/register');
    } catch (err) {
      setError(err.message);
    } finally {
      otpVerificationInProgress.current = false;
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
      if (!['admin', 'super_admin'].includes(String(user.role).toLowerCase())) {
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
          <img
            src="/assets/brand-logo.png"
            alt="SNP Consultant and Services"
            className="login-brand-logo"
          />
          {stage === 'phone' && (
            <>
              <h3 className="auth-title">Employee &amp; Admin Login</h3>

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
            </>
          )}

          {stage === 'password' && (
            <>
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
              <h3 className="auth-title">Verify OTP</h3>
              <p className="auth-sub">
                Enter the 6-digit code sent to WhatsApp for <strong>+91 {phone}</strong>.
              </p>

              {error && (
                <div className="alert-error" role="alert">
                  <i className="bi bi-exclamation-triangle-fill"></i> {error}
                </div>
              )}

              <form onSubmit={(e) => verifyOtp(e, digits)}>
                <div className="otp-boxes">
                  {otp.map((val, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      className="otp-box"
                      inputMode="numeric"
                      autoComplete="one-time-code"
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
                {verifyingOtp && <p className="auth-sub" role="status">Verifying code...</p>}
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
        </div>
      </div>
    </div>
  );
}
