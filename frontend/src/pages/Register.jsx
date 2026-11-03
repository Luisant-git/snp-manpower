import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LANGUAGES, T } from '../data/translations.js';
import { getSession, addApplication } from '../data/mockDb.js';

const emptyForm = {
  fullName: '',
  fatherName: '',
  dob: ['', '', '', '', '', '', '', ''],
  gender: 'Male',
  mobile: '',
  altMobile: '',
  email: '',
  aadhaar: ['', '', '', ''],
  pan: ['', '', '', '', '', '', '', '', '', ''],
  address: '',
  city: '',
  state: 'Karnataka',
  pincode: '',
  qualification: 'SSLC (10th)',
  skills: '',
  experience: '',
  vehicle: 'Two-Wheeler',
  vehicleNo: '',
  license: '',
  sector: 'Industrial',
};

export default function Register() {
  const [form, setForm] = useState(emptyForm);
  const [refCode, setRefCode] = useState(null);
  const [lang, setLang] = useState(() => localStorage.getItem('snp_lang') || 'en');
  const session = getSession();

  const pickLang = (e) => {
    const code = e.target.value;
    setLang(code);
    localStorage.setItem('snp_lang', code);
  };

  /* Localised string helper */
  const ts = (key) => T[key][lang] || T[key].en;
  /* Field label: chosen language (maroon) + English secondary (navy), like the original sheet */
  const FieldLabel = ({ k }) => (
    <label>
      <span className="label-primary">{ts(k)}</span>
      {lang !== 'en' && <span className="label-secondary">{T[k].en}</span>}
    </label>
  );
  /* Section title: chosen language + (English) */
  const SectionTitle = ({ k }) => (
    <div className="sheet-section-title">
      {ts(k)}
      {lang !== 'en' && <span className="sec-en"> ({T[k].en.replace(/^Section [ABC] — /, '')})</span>}
    </div>
  );

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const setChars = (field, index, value) => {
    const chars = [...form[field]];
    chars[index] = value.replace(/[^\w]/g, '').slice(0, 1) || '';
    setForm((f) => ({ ...f, [field]: chars }));
  };

  const submit = (e) => {
    e.preventDefault();
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
      d.getDate()
    ).padStart(2, '0')}`;
    const seq = String(Math.floor(1000 + Math.random() * 9000));

    /* Age from the 8 DOB boxes (DD MM YYYY) */
    const [dd, mm, yy] = [
      form.dob.slice(0, 2).join(''),
      form.dob.slice(2, 4).join(''),
      form.dob.slice(4, 8).join(''),
    ];
    let age = '';
    if (dd && mm && yy) {
      const b = new Date(+yy, +mm - 1, +dd);
      if (!isNaN(b.getTime()) && b.getTime() < d.getTime()) {
        let a = d.getFullYear() - +yy;
        if (d.getMonth() < +mm - 1 || (d.getMonth() === +mm - 1 && d.getDate() < +dd)) a -= 1;
        if (a >= 0 && a < 120) age = a;
      }
    }

    // Persist locally so the tracker on the home page can find it later.
    const code = `SNP-${ymd}-${seq}`;
    addApplication({
      ref: code,
      name: (form.fullName || 'Unnamed Candidate').trim().toUpperCase(),
      meta: age !== '' ? `${form.gender.toUpperCase()} | Age: ${age}` : form.gender.toUpperCase(),
      age,
      mobile: form.mobile ? `+91 ${form.mobile}` : '',
      submittedBy: session ? session.name : 'Direct / Admin',
      submittedByMobile: session ? session.mobile : '',
      designation: (form.skills || form.sector).toUpperCase(),
      dl: form.license || '—',
      vehicleNo: form.vehicleNo || '—',
      payment: 'Pending',
      feesPaid: '₹0',
      feesPending: '₹2,400',
      status: 'Under Review',
      date: new Date().toISOString(),
    });

    setRefCode(code);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ---------- Login guard: the candidate form opens only after login ---------- */
  if (!session) {
    return (
      <div className="auth-wrap">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-icon auth-icon-dark">
            <i className="bi bi-lock-fill"></i>
          </div>
          <h3 className="auth-title">Login Required</h3>
          <p className="auth-sub">
            The Manpower Registration Form is available only to registered staff, recruitment
            officers and WhatsApp-verified applicants. Please log in to continue.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/login" className="btn btn-teal">
              <i className="bi bi-whatsapp"></i> WhatsApp Applicant Login
            </Link>
            <Link to="/login" className="btn btn-dark">
              <i className="bi bi-shield-lock"></i> Admin / Staff Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Submit success screen ---------- */
  if (refCode) {
    return (
      <div className="container">
        <div className="submit-success">
          <div className="auth-success">
            <div className="big">
              <i className="bi bi-check-lg"></i>
            </div>
            <h3 style={{ fontWeight: 800, marginBottom: 6 }}>{ts('successTitle')}</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{ts('successMsg')}</p>
            <div className="ref-chip">{refCode}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18 }}>
            <Link to="/" className="btn btn-outline">
              <i className="bi bi-search"></i> {ts('trackApplication')}
            </Link>
            <Link to="/login" className="btn btn-teal">
              <i className="bi bi-whatsapp"></i> {ts('waLogin')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const dob = form.dob;
  const aadhaar = form.aadhaar;
  const pan = form.pan;

  return (
    <div className="register-wrap">
      {session && (
        <div className="session-ribbon">
          <i className="bi bi-person-badge-fill"></i> Filling as: <strong>{session.name}</strong>
          {session.role === 'admin' ? ' (System Administrator)' : ' (Employee)'}
        </div>
      )}
      <div className="register-intro">
        <span className="section-eyebrow">
          <i className="bi bi-file-earmark-person"></i> {ts('introEyebrow')}
        </span>
        <h2 className="section-title">{ts('introTitle')}</h2>
        <p className="section-sub">{ts('introSub')}</p>
        <div style={{ marginTop: 12 }}>
          <span className="fees-note">
            <i className="bi bi-cash-coin"></i> {ts('feeNote')}
          </span>
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="sheet">
          {/* Spiritual-style header banner, inspired by the original physical sheet */}
          <div className="sheet-banner">
            <span>|| ಶ್ರೀ ||</span>
            <span className="sun">
              <i className="bi bi-sun-fill"></i>
            </span>
            <span>{ts('sheetAllTheBest')}</span>
          </div>

          {/* ---------- LANGUAGE SELECTOR (drives every label below) ---------- */}
          <div className="language-bar">
            <i className="bi bi-translate"></i>
            <span>{ts('selectLanguage')}</span>
            <select value={lang} onChange={pickLang} aria-label="Form language">
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native}
                </option>
              ))}
            </select>
          </div>

          <div className="sheet-header">
            <div className="sheet-logo">SNP</div>
            <div>
              <h2>S.N.P Manpower &amp; Job Services</h2>
              <small>{ts('sheetCompanySmall1')}</small>
              <small>
                <i className="bi bi-telephone-fill"></i> +91 98XXX XXXXX &nbsp;•&nbsp;
                <i className="bi bi-envelope-fill"></i> careers@snpservices.example
              </small>
            </div>
          </div>

          <div className="sheet-highlight">{ts('sheetHighlight')}</div>

          <div className="sheet-body">
            {/* Personal Details */}
            <SectionTitle k="personalDetails" />
            <div className="sheet-grid">
              <div className="sheet-field full">
                <FieldLabel k="fullName" />
                <input
                  name="fullName"
                  required
                  value={form.fullName}
                  onChange={set}
                  placeholder={ts('phName')}
                />
              </div>
              <div className="sheet-field">
                <FieldLabel k="fatherName" />
                <input name="fatherName" required value={form.fatherName} onChange={set} />
              </div>
              <div className="sheet-field">
                <FieldLabel k="gender" />
                <select name="gender" value={form.gender} onChange={set}>
                  <option value="Male">{ts('gMale')}</option>
                  <option value="Female">{ts('gFemale')}</option>
                  <option value="Other">{ts('gOther')}</option>
                </select>
              </div>

              <div className="sheet-field full">
                <FieldLabel k="dob" />
                <div className="char-boxes">
                  {dob.map((c, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {i === 2 && <span className="char-sep">/</span>}
                      {i === 4 && <span className="char-sep">/</span>}
                      <input
                        className="char-box"
                        maxLength={1}
                        value={c}
                        onChange={(e) => setChars('dob', i, e.target.value)}
                      />
                    </span>
                  ))}
                  <span className="char-sep" style={{ marginLeft: 10 }}>
                    DD / MM / YYYY
                  </span>
                </div>
              </div>

              <div className="sheet-field">
                <FieldLabel k="aadhaar" />
                <div className="char-boxes">
                  {aadhaar.map((c, i) => (
                    <span key={i}>
                      {i === 4 || i === 8 ? (
                        <span style={{ color: 'var(--maroon)', fontWeight: 800, padding: '0 3px' }}>
                          —
                        </span>
                      ) : null}
                      <input
                        className="char-box"
                        inputMode="numeric"
                        maxLength={1}
                        value={c}
                        onChange={(e) => setChars('aadhaar', i, e.target.value)}
                      />
                    </span>
                  ))}
                </div>
              </div>

              <div className="sheet-field">
                <FieldLabel k="pan" />
                <div className="char-boxes">
                  {pan.map((c, i) => (
                    <input
                      key={i}
                      className="char-box"
                      maxLength={1}
                      value={c}
                      style={{ width: 28, height: 32 }}
                      onChange={(e) => setChars('pan', i, e.target.value)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <SectionTitle k="contactDetails" />
            <div className="sheet-grid">
              <div className="sheet-field">
                <FieldLabel k="mobile" />
                <input
                  name="mobile"
                  type="tel"
                  required
                  maxLength={10}
                  pattern="[0-9]{10}"
                  placeholder="10-digit number"
                  value={form.mobile}
                  onChange={set}
                />
              </div>
              <div className="sheet-field">
                <FieldLabel k="altMobile" />
                <input
                  name="altMobile"
                  type="tel"
                  maxLength={10}
                  value={form.altMobile}
                  onChange={set}
                />
              </div>
              <div className="sheet-field">
                <FieldLabel k="email" />
                <input name="email" type="email" value={form.email} onChange={set} />
              </div>
              <div className="sheet-field">
                <FieldLabel k="pincode" />
                <input name="pincode" maxLength={6} value={form.pincode} onChange={set} />
              </div>
              <div className="sheet-field full">
                <FieldLabel k="address" />
                <textarea
                  name="address"
                  rows={2}
                  required
                  value={form.address}
                  onChange={set}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="sheet-field">
                <FieldLabel k="city" />
                <input name="city" required value={form.city} onChange={set} />
              </div>
              <div className="sheet-field">
                <FieldLabel k="state" />
                <select name="state" value={form.state} onChange={set}>
                  <option>Karnataka</option>
                  <option>Tamil Nadu</option>
                  <option>Andhra Pradesh</option>
                  <option>Telangana</option>
                  <option>Maharashtra</option>
                  <option>Kerala</option>
                </select>
              </div>
            </div>

            {/* Skills & Placement */}
            <SectionTitle k="skillsPlacement" />
            <div className="sheet-grid">
              <div className="sheet-field">
                <FieldLabel k="qualification" />
                <select name="qualification" value={form.qualification} onChange={set}>
                  <option>Below SSLC</option>
                  <option>SSLC (10th)</option>
                  <option>PUC / ITI / Diploma</option>
                  <option>Graduate (Any)</option>
                  <option>Engineering</option>
                </select>
              </div>
              <div className="sheet-field">
                <FieldLabel k="experience" />
                <input
                  name="experience"
                  type="number"
                  min={0}
                  max={50}
                  placeholder="0 if fresher"
                  value={form.experience}
                  onChange={set}
                />
              </div>
              <div className="sheet-field full">
                <FieldLabel k="skills" />
                <textarea
                  name="skills"
                  rows={2}
                  required
                  placeholder={ts('phSkills')}
                  value={form.skills}
                  onChange={set}
                />
              </div>
              <div className="sheet-field">
                <FieldLabel k="sector" />
                <select name="sector" value={form.sector} onChange={set}>
                  <option>Industrial</option>
                  <option>Manufacturing</option>
                  <option>Corporate</option>
                  <option>Logistics</option>
                  <option>Automotive</option>
                  <option>Retail &amp; FMCG</option>
                </select>
              </div>
              <div className="sheet-field">
                <FieldLabel k="vehicle" />
                <select name="vehicle" value={form.vehicle} onChange={set}>
                  <option>None</option>
                  <option>Two-Wheeler</option>
                  <option>Four-Wheeler</option>
                  <option>Commercial / LMV</option>
                  <option>Heavy Vehicle</option>
                </select>
              </div>
              <div className="sheet-field">
                <FieldLabel k="license" />
                <input name="license" value={form.license} onChange={set} />
              </div>
              <div className="sheet-field">
                <FieldLabel k="vehicleNo" />
                <input name="vehicleNo" value={form.vehicleNo} onChange={set} />
              </div>

              <div className="full">
                <div className="photo-box">
                  <i className="bi bi-person-square" style={{ fontSize: '1.6rem' }}></i>
                  {ts('photoAffix')}
                </div>
              </div>
            </div>

            <div className="sheet-declaration">
              <i className="bi bi-pen-fill" style={{ color: 'var(--maroon)' }}></i> {ts('declaration')}
            </div>
          </div>

          <div className="sheet-actions">
            <span className="ref">
              <i className="bi bi-info-circle"></i> {ts('refNote')}
            </span>
            <button type="submit" className="btn btn-primary btn-lg">
              <i className="bi bi-send-fill"></i> {ts('submitBtn')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
