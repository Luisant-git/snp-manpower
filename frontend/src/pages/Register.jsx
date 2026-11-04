import { useState, useRef, useEffect } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { LANGUAGES, T } from '../data/translations.js';
import { getSession, getApplications, addApplication, listActiveBranches } from '../data/mockDb.js';
import SearchableSelect from '../components/SearchableSelect.jsx';
import MultiSearchableSelect from '../components/MultiSearchableSelect.jsx';

const BLOOD_GROUPS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'O+',
  'O-',
  'AB+',
  'AB-',
  'Bombay Blood Group (hh)',
  "Don't Know / Unspecified",
];

const NATIONALITIES = [
  'INDIAN',
  'NEPALESE',
  'BHUTANESE',
  'BANGLADESHI',
  'SRI LANKAN',
  'TIBETAN',
  'MALDIVIAN',
  'AFGHAN',
  'AMERICAN',
  'BRITISH',
  'CANADIAN',
  'AUSTRALIAN',
  'EMIRATI (UAE)',
  'SAUDI',
  'OTHER NATIONALITY',
];

const RELIGIONS = [
  'HINDU',
  'MUSLIM',
  'CHRISTIAN',
  'SIKH',
  'BUDDHIST',
  'JAIN',
  'ZOROASTRIAN (PARSI)',
  'JEWISH',
  'OTHER / NON-RELIGIOUS',
];

const ALL_LANGUAGES = [
  'KANNADA',
  'ENGLISH',
  'HINDI',
  'TELUGU',
  'TAMIL',
  'MALAYALAM',
  'MARATHI',
  'BENGALI',
  'GUJARATI',
  'ODIA',
  'PUNJABI',
  'URDU',
  'ASSAMESE',
  'KONKANI',
  'TULU',
  'KODAVA',
  'SANSKRIT',
  'ARABIC',
  'FRENCH',
  'GERMAN',
  'SPANISH',
];

const ALL_QUALIFICATIONS = [
  'BELOW 10TH / 7TH / 8TH PASS',
  'SSLC / 10TH PASS',
  'SSLC / 10TH FAIL',
  'PUC (ARTS / HEPS)',
  'PUC (COMMERCE / EBAC / CEBA)',
  'PUC (SCIENCE / PCMB / PCMC)',
  'ITI - FITTER',
  'ITI - ELECTRICIAN',
  'ITI - WELDER',
  'ITI - DIESEL MECHANIC',
  'ITI - MOTOR VEHICLE MECHANIC (MMV)',
  'ITI - TURNER / MACHINIST',
  'ITI - ELECTRONICS MECHANIC',
  'ITI - REFRIGERATION & AC (RAC)',
  'ITI - ALL OTHER TRADES',
  'DIPLOMA - MECHANICAL ENGINEERING',
  'DIPLOMA - ELECTRICAL & ELECTRONICS (EEE)',
  'DIPLOMA - CIVIL ENGINEERING',
  'DIPLOMA - AUTOMOBILE ENGINEERING',
  'DIPLOMA - ELECTRONICS & COMMUNICATION (ECE)',
  'DIPLOMA - COMPUTER SCIENCE (CS)',
  'DIPLOMA - COMMERCIAL PRACTICE / SECRETARIAL',
  'D.PHARM (DIPLOMA IN PHARMACY)',
  'B.A (BACHELOR OF ARTS)',
  'B.COM (BACHELOR OF COMMERCE)',
  'B.SC (BACHELOR OF SCIENCE)',
  'B.SC - NURSING / ALLIED HEALTH',
  'BBA / BBM (BUSINESS ADMINISTRATION)',
  'BCA (COMPUTER APPLICATIONS)',
  'B.E / B.TECH - MECHANICAL',
  'B.E / B.TECH - ELECTRICAL & ELECTRONICS',
  'B.E / B.TECH - CIVIL',
  'B.E / B.TECH - COMPUTER SCIENCE / IT',
  'B.E / B.TECH - ALL OTHER BRANCHES',
  'B.PHARM (BACHELOR OF PHARMACY)',
  'BHM (HOTEL MANAGEMENT)',
  'BSW / MSW (SOCIAL WORK)',
  'ANY GRADUATE / DEGREE HOLDER',
  'POST GRADUATE - M.A / M.COM / M.SC',
  'MBA (MARKETING / HR / FINANCE)',
  'MCA (MASTER OF COMPUTER APPLICATIONS)',
  'M.TECH / M.E',
  'OTHER QUALIFICATION',
];

const ALL_HOBBIES = [
  'DRIVING',
  'CRICKET',
  'FOOTBALL / SOCCER',
  'KABADDI / VOLLEYBALL',
  'READING BOOKS / NEWSPAPER',
  'SINGING / MUSIC',
  'LISTENING TO MUSIC',
  'FITNESS / GYM / BODYBUILDING',
  'YOGA / MEDITATION',
  'COOKING',
  'TRAVELING / BIKING',
  'GARDENING / FARMING',
  'PHOTOGRAPHY / VIDEOGRAPHY',
  'DRAWING / PAINTING',
  'SWIMMING',
  'CYCLING',
  'BADMINTON',
  'CHESS / CARROM / INDOOR GAMES',
  'SOCIAL SERVICE',
  'WATCHING MOVIES',
];

const ALL_OTHER_SKILLS = [
  'WELDING (ARC / MIG / TIG)',
  'COMPUTER BASICS / MS OFFICE',
  'TYPING & DATA ENTRY',
  'CNC / VMC MACHINE OPERATOR',
  'FORKLIFT OPERATOR',
  'ELECTRICAL WIRING / WIREMAN',
  'PLUMBING & SANITARY',
  'CARPENTRY',
  'MASONRY / CONSTRUCTION WORK',
  'HOUSEKEEPING & CLEANING',
  'PACKAGING & ASSEMBLY LINE',
  'MATERIAL HANDLING / LOADER',
  'STORE KEEPING & WAREHOUSE INVENTORY',
  'QUALITY CHECK / INSPECTOR',
  'TAILORING & SEWING',
  'SECURITY GUARD / SURVEILLANCE',
  'TWO-WHEELER DELIVERY / COURIER',
  'HEAVY VEHICLE DRIVING (TRUCK/BUS)',
  'LIGHT VEHICLE DRIVING (CAB/CAR)',
  'MECHANIC / AUTO REPAIR',
  'AC & REFRIGERATION TECHNICIAN',
  'CUSTOMER SERVICE & TELECALLING',
  'SALES & MARKETING',
  'COOKING / CATERING HELPER',
  'HOTEL / RESTAURANT SERVICE',
  'FIRST AID & SAFETY PROTOCOLS',
];

const TAXI_SEATER_OPTIONS = [
  '4+1 Seater (Sedan - Dzire / Etios / Amaze / Aura / Accent)',
  '4+1 Seater (Hatchback - Swift / WagonR / Tiago / i10)',
  '6+1 Seater (MUV - Ertiga / XL6 / Rumion / Carens)',
  '7+1 Seater (SUV / MUV - Innova / Crysta / Hycross / Marazzo)',
  '8+1 Seater / 9 Seater (Bolero / Cruiser / Scorpio / Sumo / Xylo)',
  '12+1 Seater (Tempo Traveller / Force Urbania / Cruiser)',
  '17 Seater (Tempo Traveller / Mini Van)',
  '20+ Seater (Mini Bus / Executive Coach)',
  'Luxury Car (Camry / Mercedes / BMW / Audi)',
  'Other Passenger Car / Taxi',
];

const DEFAULT_STAFF = [
  {
    name: 'SURESH GOWDA',
    mobile: '9817508855',
    role: 'Senior Recruitment Officer',
    branch: 'BANGALORE - HEAD OFFICE (MAHALAKSHMI LAYOUT)',
  },
  {
    name: 'RAMESH KUMAR',
    mobile: '9449847768',
    role: 'Branch Manager & Dispatch Lead',
    branch: 'BANGALORE - RAJAJINAGAR BRANCH',
  },
  {
    name: 'CHETHAN KUMAR',
    mobile: '9019655120',
    role: 'Operations & Field Verification',
    branch: 'BANGALORE - PEENYA INDUSTRIAL AREA',
  },
  {
    name: 'HARSHITHA M',
    mobile: '9591971282',
    role: 'HR & Document Verification Executive',
    branch: 'MYSORE - CITY BRANCH',
  },
  {
    name: 'KENCHE GOWDA',
    mobile: '9535847768',
    role: 'Fleet & Manpower Supervisor',
    branch: 'BANGALORE - YESHWANTHPUR BRANCH',
  },
  {
    name: 'ANAND MURTHY',
    mobile: '9876543210',
    role: 'System Administrator & Central Dispatch',
    branch: 'BANGALORE - HEAD OFFICE (MAHALAKSHMI LAYOUT)',
  },
];

const emptyForm = {
  // Page 1 Meta
  formDate: new Date().toISOString().split('T')[0],
  state: 'KARNATAKA',
  regNo: `SNP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
  mobile: '',
  policeCertDate: '',
  policeCertNo: '',
  photoUrl: null,

  // Page 1 Main Fields (1 to 24)
  refCandidate: 'Online / Direct',
  refOtherDetail: '',
  fullName: '',
  fatherName: '',
  motherName: '',
  dob: '',
  age: '',
  pan: '',
  bloodGroup: 'B+',
  gender: 'MALE',
  nationality: 'INDIAN',
  religion: 'HINDU',
  languages: 'KANNADA, ENGLISH, HINDI',
  maritalStatus: 'UN MARRIED',
  qualification: 'SSLC / PUC / ITI / DIPLOMA / DEGREE',
  aadhaar: '',
  hobbies: '',
  otherSkills: '',
  jobType: 'DRIVER',
  designation: 'DRIVER',
  workExperience: '',
  hasLicense: 'YES',
  dlNumber: '',
  dlValidityDate: '',
  dlExperience: '',
  hasBadge: 'NO',
  badgeNumber: '',
  badgeDate: '',
  altMobile1: '',
  altMobile2: '',
  altMobile3: '',
  hasSangha: 'NO',
  sangha: '',
  vehicleName: '',
  vehicleRegNo: '',
  taxiSeaterType: '7+1 Seater (Innova / Crysta / Carens / Hycross)',
  vehicleModel: '',
  taxiFcNo: '',
  taxiFcExpiryDate: '',
  taxiInsuranceNo: '',
  taxiInsuranceExpiryDate: '',
  taxiEmissionNo: '',
  taxiEmissionExpiryDate: '',

  // Page 2
  presentAddress: '#25, HOUSE / NILAYA, STREET, AREA, TALUK, BENGALURU - 560074',
  permanentAddress: '',
  sameAddress: false,
  addressProofUrl: null,
  addressProofName: '',
  bankProofUrl: null,
  bankProofName: '',
  employeeBranch: 'BANGALORE - HEAD OFFICE (MAHALAKSHMI LAYOUT)',
  employeeMobile: '',
  employeeName: '',
  employeeRole: '',
  registrationFeePaid: '1300',
  bankName: 'STATE BANK OF INDIA',
  accountNumber: '',
  ifscCode: 'SBIN0001911',
  upiMobile: '',
  fam1Name: '',
  fam1Mobile: '',
  fam2Name: '',
  fam2Mobile: '',
  fam3Name: '',
  fam3Mobile: '',
  fam4Name: '',
  fam4Mobile: '',
  prevCustomer: '',
  confirmed: true,
};

export default function Register({ readOnly = false }) {
  const { ref: applicationRef } = useParams();
  const location = useLocation();
  const [branches] = useState(listActiveBranches);
  const [viewApplication] = useState(() => {
    if (!readOnly) return null;
    return getApplications().find((application) => application.ref === applicationRef)
      || location.state?.application
      || null;
  });
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    employeeBranch: branches[0] || emptyForm.employeeBranch,
    ...(viewApplication ? {
      fullName: viewApplication.name || '',
      mobile: (viewApplication.mobile || '').replace(/^\+91\s*/, ''),
      designation: viewApplication.designation || '',
      employeeName: viewApplication.submittedBy || viewApplication.filledBy || '',
      employeeMobile: (viewApplication.submittedByMobile || viewApplication.filledByMobile || '')
        .replace(/^\+91\s*/, ''),
      employeeBranch: viewApplication.branch || branches[0] || emptyForm.employeeBranch,
      dlNumber: viewApplication.dl === '—' ? '' : viewApplication.dl || '',
      vehicleRegNo: viewApplication.vehicleNo === '—' ? '' : viewApplication.vehicleNo || '',
      bankProofUrl: viewApplication.bankProofUrl || null,
      bankProofName: viewApplication.bankProofName || '',
      registrationFeePaid: String(
        Number(String(viewApplication.feesPaid || '1300').replace(/[^\d.]/g, '')) || 0
      ),
      ...(viewApplication.registrationData || {}),
    } : {}),
  }));
  const [refCode, setRefCode] = useState(null);
  const [toast, setToast] = useState(null);
  const [lang, setLang] = useState(() => localStorage.getItem('snp_lang') || 'kn'); // Default to Kannada as in physical sheet
  const session = getSession();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const proofFileInputRef = useRef(null);
  const bankProofFileRef = useRef(null);

  // Dual OTP state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [candidateSentOtp, setCandidateSentOtp] = useState('');
  const [employeeSentOtp, setEmployeeSentOtp] = useState('');
  const [candidateInputOtp, setCandidateInputOtp] = useState('');
  const [employeeInputOtp, setEmployeeInputOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (type, message) => {
    setToast({ type, message, id: Date.now() });
  };

  const handleBankProofUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setForm((f) => ({
        ...f,
        bankProofUrl: url,
        bankProofName: file.name,
      }));
    }
  };

  const handleEmployeeMobileChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setForm((f) => {
      const found = val.length === 10
        ? DEFAULT_STAFF.find((staff) => staff.mobile === val)
        : null;
      const previousEmployeeValue = f.employeeName && f.employeeMobile
        ? `${f.employeeName} - ${f.employeeMobile}`
        : '';
      const previousCustomerWasEmployee = f.prevCustomer === previousEmployeeValue;

      return {
        ...f,
        employeeMobile: val,
        employeeName: found?.name || '',
        employeeBranch: found?.branch && branches.includes(found.branch)
          ? found.branch
          : (branches.includes(f.employeeBranch) ? f.employeeBranch : branches[0] || ''),
        employeeRole: found?.role || '',
        prevCustomer: found
          ? (!f.prevCustomer || previousCustomerWasEmployee
            ? `${found.name} - ${found.mobile}`
            : f.prevCustomer)
          : (previousCustomerWasEmployee ? '' : f.prevCustomer),
      };
    });
  };

  const handleProofUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setForm((f) => ({
        ...f,
        addressProofUrl: url,
        addressProofName: file.name,
      }));
    }
  };

  const pickLang = (e) => {
    const code = e.target.value;
    setLang(code);
    localStorage.setItem('snp_lang', code);
  };

  /* Localised string helper */
  const ts = (key) => {
    const entry = T[key];
    if (!entry) return key;
    return entry[lang] || entry.kn || entry.en || key;
  };

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDobChange = (e) => {
    const val = e.target.value;
    let calculatedAge = '';
    if (val) {
      const birthDate = new Date(val);
      const today = new Date();
      let a = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        a--;
      }
      if (a >= 0 && a <= 120) calculatedAge = String(a);
    }
    setForm((f) => ({ ...f, dob: val, age: calculatedAge }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setForm((f) => ({ ...f, photoUrl: url }));
    }
  };

  const submit = (e) => {
    e.preventDefault();

    const formElement = e.currentTarget;
    if (!formElement.checkValidity()) {
      const invalidField = formElement.querySelector(':invalid');
      const fieldName = invalidField?.name
        ? invalidField.name.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())
        : 'a required field';
      showToast('error', `Please complete or correct: ${fieldName}.`);
      invalidField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      invalidField?.focus({ preventScroll: true });
      return;
    }

    // Check candidate mobile
    if (!/^\d{10}$/.test(form.mobile)) {
      showToast('error', 'Please enter a valid 10-digit job seeker mobile number.');
      document.querySelector('[name="mobile"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Check employee mobile
    if (!/^\d{10}$/.test(form.employeeMobile)) {
      showToast('error', 'Choose a branch and enter a valid 10-digit employee mobile number.');
      const el = document.querySelector('.branch-verification-card');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (!form.addressProofUrl) {
      showToast('error', 'Upload an address proof document before submitting.');
      document.querySelector('.address-proof-upload-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const paidAmount = Number(form.registrationFeePaid);
    if (!Number.isInteger(paidAmount) || paidAmount < 0 || paidAmount > 2400) {
      showToast('error', 'Enter a whole-rupee paid amount between ₹0 and ₹2,400.');
      document.querySelector('[name="registrationFeePaid"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setCandidateSentOtp('1234');
    setEmployeeSentOtp('1234');
    setCandidateInputOtp('1234');
    setEmployeeInputOtp('1234');
    setOtpError('');
    setShowOtpModal(true);
  };

  const handleVerifyBothOtps = () => {
    if (candidateInputOtp !== candidateSentOtp) {
      setOtpError(`Candidate OTP is incorrect. Please enter ${candidateSentOtp}`);
      return;
    }
    if (employeeInputOtp !== employeeSentOtp) {
      setOtpError(`Employee OTP is incorrect. Please enter ${employeeSentOtp}`);
      return;
    }

    setShowOtpModal(false);
    const paidAmount = Number(form.registrationFeePaid);

    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
      d.getDate()
    ).padStart(2, '0')}`;
    const seq = String(Math.floor(1000 + Math.random() * 9000));
    const code = form.regNo || `SNP-${ymd}-${seq}`;

    // Persist locally so the tracker can find it
    addApplication({
      ref: code,
      name: (form.fullName || 'Unnamed Candidate').trim().toUpperCase(),
      meta: form.age ? `${form.gender} | Age: ${form.age}` : form.gender,
      age: form.age,
      mobile: form.mobile ? `+91 ${form.mobile}` : '',
      submittedBy: form.employeeName || (session ? session.name : 'Authorized Staff'),
      submittedByMobile: form.employeeMobile || form.mobile,
      branch: form.employeeBranch,
      designation: (form.designation || 'General Staff').toUpperCase(),
      dl: form.hasLicense === 'NO' ? 'NO LICENCE' : (form.dlNumber || '—'),
      vehicleNo: form.vehicleRegNo || '—',
      payment: paidAmount === 0 ? 'Pending' : paidAmount >= 2400 ? 'Paid' : 'Partial',
      feesPaid: `₹${paidAmount.toLocaleString('en-IN')}`,
      feesPending: `₹${(2400 - paidAmount).toLocaleString('en-IN')}`,
      status: 'Under Review',
      date: new Date().toISOString(),
      candidateOtpVerified: true,
      employeeOtpVerified: true,
      registrationData: { ...form },
      photo: form.photoUrl,
      bankProofUrl: form.bankProofUrl,
      bankProofName: form.bankProofName,
    });

    setRefCode(code);
    showToast('success', 'Registration submitted successfully.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* Helper component to render bilingual label cells matching the uploaded images */
  const FormLabelCell = ({ k, enSecondary, required = false }) => {
    let primary = ts(k);
    let secondary = enSecondary || T[k]?.en || '';

    // Check if required and clean any existing asterisks to guarantee exactly 1 asterisk
    const isRequired = required || primary.includes('*') || secondary.includes('*');
    primary = primary.replace(/\s*\*+\s*$/, '').trim();
    secondary = secondary.replace(/\s*\*+\s*$/, '').trim();

    const showSecondary = lang !== 'en' && secondary && secondary.toLowerCase() !== primary.toLowerCase();

    return (
      <td className="field-label-cell">
        <span className="field-label-primary">
          {primary} {isRequired && <span className="text-danger">*</span>}
        </span>
        {showSecondary && (
          <span className="field-label-secondary">
            {secondary} {isRequired && '*'}
          </span>
        )}
      </td>
    );
  };

  if (readOnly && !viewApplication) {
    return <Navigate to="/admin/applications" replace />;
  }

  /* ---------- Login Guard ---------- */
  if (!session) {
    return (
      <div className="auth-wrap">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-icon auth-icon-dark">
            <i className="bi bi-lock-fill"></i>
          </div>
          <h3 className="auth-title">Login Required</h3>
          <p className="auth-sub">
            The Manpower Registration Form is available to registered staff, recruitment officers,
            and applicants. Please log in to continue.
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

  /* ---------- Submit Success Screen ---------- */
  if (refCode) {
    return (
      <div className="container" style={{ padding: '40px 15px' }}>
        {toast && (
          <div className={`register-toast ${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'} aria-live="polite">
            <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
            <span>{toast.message}</span>
            <button type="button" onClick={() => setToast(null)} aria-label="Dismiss message">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        )}
        <div className="submit-success">
          <div className="auth-success">
            <div className="big">
              <i className="bi bi-check-lg"></i>
            </div>
            <h3 style={{ fontWeight: 800, marginBottom: 8, color: '#0f172a' }}>{ts('successTitle')}</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.92rem' }}>{ts('successMsg')}</p>
            <div className="ref-chip">{refCode}</div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 22, flexWrap: 'wrap' }}>
            <Link to="/" className="btn btn-outline">
              <i className="bi bi-search"></i> {ts('trackApplication')}
            </Link>
            <button type="button" className="btn btn-dark" onClick={() => window.print()}>
              <i className="bi bi-printer"></i> {ts('printBtn')}
            </button>
            <button
              type="button"
              className="btn btn-teal"
              onClick={() => {
                setRefCode(null);
                setForm(emptyForm);
              }}
            >
              <i className="bi bi-plus-circle"></i> New Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`register-wrap${readOnly ? ' registration-view-mode' : ''}`}>
      {toast && (
        <div className={`register-toast ${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'} aria-live="polite">
          <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss message">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      )}
      {readOnly ? (
        <div className="registration-record-toolbar no-print">
          <div>
            <span className="section-eyebrow"><i className="bi bi-file-earmark-person"></i> Application Record</span>
            <h2>{viewApplication.name || 'Candidate Application'}</h2>
            <small>Reference: {viewApplication.ref}</small>
          </div>
          <div className="registration-record-actions">
            <Link to="/admin/applications" className="btn btn-outline">
              <i className="bi bi-arrow-left"></i> Back to Applications
            </Link>
            <button type="button" className="btn btn-primary" onClick={() => window.print()}>
              <i className="bi bi-printer"></i> Print
            </button>
          </div>
        </div>
      ) : session && (
        <div className="session-ribbon no-print">
          <i className="bi bi-person-badge-fill"></i> Filling as: <strong>{session.name}</strong>
          {session.role === 'admin' ? ' (System Administrator)' : ' (Employee)'}
        </div>
      )}

      {/* ============================================================
          LANGUAGE SELECTOR ON TOP (REQUESTED BY USER)
          Changes all form labels dynamically to chosen language
          ============================================================ */}
      {!readOnly && <div className="language-bar-container no-print">
        <div className="language-bar-inner">
          <div className="lang-icon-title">
            <i className="bi bi-translate"></i>
            <span>{ts('selectLanguage')}:</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <select
              value={lang}
              onChange={pickLang}
              className="form-select lang-dropdown-select"
              aria-label="Select form language"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native} ({l.name})
                </option>
              ))}
            </select>
          </div>
          <span className="lang-hint-text">
            <i className="bi bi-check2-circle text-success me-1"></i>
            {ts('langNote')}
          </span>
        </div>
      </div>}

      <form noValidate onSubmit={readOnly ? (event) => event.preventDefault() : submit}>
        <fieldset className="registration-view-fieldset" disabled={readOnly}>
        <div className="physical-form-wrapper">
          {/* ============================================================
              PAGE 1 / SHEET 1: Job Interview Application Form
              ============================================================ */}
          <div className="physical-sheet" id="sheet1">
            {/* Top Spiritual Line */}
            <div className="spiritual-banner">
              <span>{ts('sairam')}</span>
              <span className="spiritual-sun">
                <i className="bi bi-sun-fill"></i>
              </span>
              <span>{ts('omShanthi')}</span>
            </div>

            {/* Company Header */}
            <div className="sheet-main-header">
              <div className="sheet-title-row">
                <div className="sheet-logo">SNP</div>
                <div>
                  <h1 className="sheet-company-name mb-0">{ts('companyName')}</h1>
                </div>
              </div>
              <div className="sheet-contact-line">
                {ts('companySub')}
              </div>
            </div>

            {/* Navy Ribbon 1 */}
            <div className="sheet-navy-banner">
              {ts('navyBanner1')}
            </div>

            {/* Form Title Box */}
            <div className="sheet-title-box">
              <div className="title-p1">{ts('formTitleKn')}</div>
              <div className="title-p2">{ts('formTitleEn')}</div>
            </div>

            {/* Top Meta Container: Photo Affix Box + Meta Grid Table */}
            <div className="form-meta-container">
              {/* Photo Box */}
              <div className="photo-affix-box">
                {form.photoUrl ? (
                  <>
                    <img src={form.photoUrl} alt="Candidate Passport" />
                    <div className="photo-overlay-bottom no-print">
                      <button
                        type="button"
                        className="btn-change-photo"
                        title="Upload a different photo"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <i className="bi bi-arrow-repeat"></i> {ts('changePhoto')}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <i className="bi bi-camera" style={{ fontSize: '1.8rem', color: '#991b1b', marginBottom: 2 }}></i>
                    <div className="photo-affix-label">{ts('photoAffix')}</div>
                    <div className="d-flex gap-1 mt-2 no-print" style={{ zIndex: 2 }}>
                      <button
                        type="button"
                        className="btn-photo-action"
                        title="Take photo from camera"
                        onClick={() => cameraInputRef.current?.click()}
                      >
                        <i className="bi bi-camera-fill"></i> {ts('openCamera')}
                      </button>
                      <button
                        type="button"
                        className="btn-photo-action"
                        title="Upload file from device"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <i className="bi bi-folder-fill"></i> {ts('browseFile')}
                      </button>
                    </div>
                  </>
                )}
                {/* Hidden File & Camera Inputs */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  capture="user"
                  style={{ display: 'none' }}
                />
              </div>

              {/* Meta Grid Table */}
              <table className="meta-grid-table">
                <tbody>
                  {/* Meta Row 1: Date | State | Registration No */}
                  <tr>
                    <td className="meta-cell-label" style={{ width: '13%' }}>
                      <div>{ts('metaDate')}</div>
                      <small style={{ fontSize: '0.68rem', color: '#1e3a8a' }}>Date</small>
                    </td>
                    <td style={{ width: '22%' }}>
                      <input
                        type="date"
                        name="formDate"
                        value={form.formDate}
                        onChange={set}
                        required
                        style={{ border: 'none', background: 'transparent', fontWeight: 700, width: '100%', fontSize: '0.85rem' }}
                      />
                    </td>
                    <td className="meta-cell-label" style={{ width: '12%' }}>
                      <div>{ts('metaState')}</div>
                      <small style={{ fontSize: '0.68rem', color: '#1e3a8a' }}>State</small>
                    </td>
                    <td style={{ width: '18%' }}>
                      <input
                        type="text"
                        name="state"
                        value={form.state}
                        onChange={set}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          fontWeight: 800,
                          color: '#0f172a',
                          textTransform: 'uppercase',
                          fontSize: '0.85rem',
                          width: '100%',
                        }}
                      />
                    </td>
                    <td className="meta-cell-label" style={{ width: '17%' }}>
                      <div>{ts('metaRegNo')}</div>
                      <small style={{ fontSize: '0.68rem', color: '#1e3a8a' }}>Registration No</small>
                    </td>
                    <td style={{ width: '18%' }}>
                      <input
                        type="text"
                        name="regNo"
                        value={form.regNo}
                        onChange={set}
                        placeholder="SNP-2026-0001"
                        style={{
                          border: 'none',
                          background: 'transparent',
                          fontWeight: 800,
                          color: '#0f172a',
                          textTransform: 'uppercase',
                          fontSize: '0.85rem',
                          width: '100%',
                        }}
                      />
                    </td>
                  </tr>

                  {/* Job Seeker Mobile Row - Matches other fields like Candidate Name */}
                  <tr>
                    <td className="meta-cell-label">
                      <div>{ts('metaMobile')}</div>
                      <small style={{ fontSize: '0.68rem', color: '#1e3a8a' }}>Mobile No *</small>
                    </td>
                    <td colSpan="5">
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ fontWeight: 800, color: '#881337', fontSize: '0.88rem' }}>+91</span>
                        <input
                          type="tel"
                          name="mobile"
                          required
                          maxLength={10}
                          value={form.mobile}
                          onChange={set}
                          placeholder="JOB SEEKER'S 10-DIGIT MOBILE"
                          style={{
                            border: '1px solid transparent',
                            background: 'transparent',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            color: '#0f172a',
                            width: '100%',
                            padding: '4px 6px',
                            textTransform: 'uppercase',
                          }}
                        />
                      </div>
                    </td>
                  </tr>

                  {/* Police Verification Certificate Row with Proper Labels */}
                  <tr>
                    <td className="meta-cell-label" colSpan="2" style={{ width: '35%' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#881337', lineHeight: 1.3 }}>
                        {ts('metaPoliceCert')}
                      </div>
                      {lang !== 'en' && (
                        <small style={{ fontSize: '0.66rem', color: '#1e3a8a', display: 'block', fontWeight: 700 }}>
                          POLICE VERIFICATION CERTIFICATE NO & EXPIRY DATE
                        </small>
                      )}
                    </td>
                    <td colSpan="4" style={{ width: '65%' }}>
                      <div className="d-flex align-items-center gap-3 w-100">
                        <div className="d-flex align-items-center gap-2" style={{ whiteSpace: 'nowrap' }}>
                          <span className="inline-label" style={{ fontSize: '0.76rem', fontWeight: 800, color: '#881337' }}>
                            {ts('metaCertExpiryDate')}:
                          </span>
                          <input
                            type="date"
                            name="policeCertDate"
                            value={form.policeCertDate}
                            onChange={set}
                            style={{
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              padding: '3px 6px',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              width: '135px',
                            }}
                          />
                        </div>
                        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ minWidth: 0 }}>
                          <span className="inline-label" style={{ fontSize: '0.76rem', fontWeight: 800, color: '#881337', whiteSpace: 'nowrap' }}>
                            {ts('metaCertNo')}:
                          </span>
                          <input
                            type="text"
                            name="policeCertNo"
                            value={form.policeCertNo}
                            onChange={set}
                            placeholder="POLICE VERIFICATION CERTIFICATE NO"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              color: '#0f172a',
                              textTransform: 'uppercase',
                              width: '100%',
                              padding: '4px 6px',
                              flex: 1,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Main Fields Table (Page 1 - 24 Rows) */}
            <table className="physical-table">
              <tbody>
                {/* 1. Reference Candidate - Dropdown */}
                <tr>
                  <FormLabelCell k="refCandidate" enSecondary="Reference Candidate" />
                  <td className="field-input-cell">
                    <select
                      name="refCandidate"
                      value={form.refCandidate}
                      onChange={set}
                      className="form-select"
                      style={{
                        fontWeight: 800,
                        color: '#0f172a',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <option value="Online / Direct">{ts('refOnline')}</option>
                      <option value="Friends">{ts('refFriends')}</option>
                      <option value="Relatives">{ts('refRelatives')}</option>
                      <option value="Social Media">{ts('refSocialMedia')}</option>
                      <option value="Job Portal">{ts('refJobPortal')}</option>
                      <option value="Newspaper / Advertisement">{ts('refNewspaper')}</option>
                      <option value="Others">{ts('refOthers')}</option>
                    </select>
                    {form.refCandidate === 'Others' && (
                      <input
                        name="refOtherDetail"
                        value={form.refOtherDetail || ''}
                        onChange={set}
                        placeholder="Please specify referral source / person name"
                        className="form-control form-control-sm mt-2"
                        style={{ border: '1.5px solid #cbd5e1', fontWeight: 700 }}
                      />
                    )}
                  </td>
                </tr>

                {/* 2. Candidate Name * */}
                <tr>
                  <FormLabelCell k="candidateName" enSecondary="Candidate Name *" required />
                  <td className="field-input-cell">
                    <input
                      name="fullName"
                      required
                      value={form.fullName}
                      onChange={set}
                      placeholder="FULL NAME AS PER AADHAAR / CERTIFICATES"
                    />
                  </td>
                </tr>

                {/* 3. Father Name */}
                <tr>
                  <FormLabelCell k="fatherName" enSecondary="Father Name" />
                  <td className="field-input-cell">
                    <input
                      name="fatherName"
                      value={form.fatherName}
                      onChange={set}
                      placeholder="FATHER'S FULL NAME"
                    />
                  </td>
                </tr>

                {/* 4. Mother Name */}
                <tr>
                  <FormLabelCell k="motherName" enSecondary="Mother Name" />
                  <td className="field-input-cell">
                    <input
                      name="motherName"
                      value={form.motherName}
                      onChange={set}
                      placeholder="MOTHER'S FULL NAME"
                    />
                  </td>
                </tr>

                {/* 5. Date Of Birth + Age */}
                <tr>
                  <FormLabelCell k="dob" enSecondary="Date Of Birth" />
                  <td className="field-input-cell">
                    <div className="inline-split-row">
                      <div className="inline-split-col">
                        <input
                          type="date"
                          name="dob"
                          value={form.dob}
                          onChange={handleDobChange}
                          style={{ flex: 1 }}
                        />
                      </div>
                      <div className="inline-split-col" style={{ maxWidth: 220 }}>
                        <span className="inline-label">{lang === 'en' ? 'Age:' : `${ts('age')} Age:`}</span>
                        <input
                          name="age"
                          value={form.age}
                          onChange={set}
                          placeholder="AGE"
                          style={{ width: 80, textAlign: 'center', background: '#f8fafc' }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>

                {/* 6. Pan Card */}
                <tr>
                  <FormLabelCell k="panCard" enSecondary="Pan Card" />
                  <td className="field-input-cell">
                    <input
                      name="pan"
                      maxLength={10}
                      value={form.pan}
                      onChange={set}
                      placeholder="E.G. CAAPCS211A"
                    />
                  </td>
                </tr>

                {/* 7. Blood Group - Searchable Dropdown */}
                <tr>
                  <FormLabelCell k="bloodGroup" enSecondary="Blood Group" />
                  <td className="field-input-cell">
                    <SearchableSelect
                      name="bloodGroup"
                      value={form.bloodGroup}
                      onChange={set}
                      options={BLOOD_GROUPS}
                      placeholder="SELECT BLOOD GROUP"
                    />
                  </td>
                </tr>

                {/* 8. Gender M/F */}
                <tr>
                  <FormLabelCell k="gender" enSecondary="Gender M/F" />
                  <td className="field-input-cell">
                    <div className="radio-options-row">
                      <label className="radio-option-item">
                        <input
                          type="radio"
                          name="gender"
                          value="MALE"
                          checked={form.gender === 'MALE'}
                          onChange={set}
                        />
                        <span>MALE</span>
                      </label>
                      <label className="radio-option-item">
                        <input
                          type="radio"
                          name="gender"
                          value="FEMALE"
                          checked={form.gender === 'FEMALE'}
                          onChange={set}
                        />
                        <span>FEMALE</span>
                      </label>
                      <label className="radio-option-item">
                        <input
                          type="radio"
                          name="gender"
                          value="OTHER"
                          checked={form.gender === 'OTHER'}
                          onChange={set}
                        />
                        <span>OTHER</span>
                      </label>
                    </div>
                  </td>
                </tr>

                {/* 9. Nationality - Searchable Dropdown */}
                <tr>
                  <FormLabelCell k="nationality" enSecondary="Nationality" />
                  <td className="field-input-cell">
                    <SearchableSelect
                      name="nationality"
                      value={form.nationality}
                      onChange={set}
                      options={NATIONALITIES}
                      placeholder="SELECT NATIONALITY"
                    />
                  </td>
                </tr>

                {/* 10. Religion - Searchable Dropdown */}
                <tr>
                  <FormLabelCell k="religion" enSecondary="Religion" />
                  <td className="field-input-cell">
                    <SearchableSelect
                      name="religion"
                      value={form.religion}
                      onChange={set}
                      options={RELIGIONS}
                      placeholder="SELECT RELIGION"
                    />
                  </td>
                </tr>

                {/* 11. Language Known - Multi-select search & select */}
                <tr>
                  <FormLabelCell k="languagesKnown" enSecondary="Language Known" />
                  <td className="field-input-cell">
                    <MultiSearchableSelect
                      name="languages"
                      value={form.languages}
                      onChange={set}
                      options={ALL_LANGUAGES}
                      placeholder="Search and select languages known..."
                    />
                  </td>
                </tr>

                {/* 12. Married Or Un Married */}
                <tr>
                  <FormLabelCell k="maritalStatus" enSecondary="Married Or Un Married" />
                  <td className="field-input-cell">
                    <div className="radio-options-row">
                      <label className="radio-option-item">
                        <input
                          type="radio"
                          name="maritalStatus"
                          value="UN MARRIED"
                          checked={form.maritalStatus === 'UN MARRIED'}
                          onChange={set}
                        />
                        <span>UN MARRIED</span>
                      </label>
                      <label className="radio-option-item">
                        <input
                          type="radio"
                          name="maritalStatus"
                          value="MARRIED"
                          checked={form.maritalStatus === 'MARRIED'}
                          onChange={set}
                        />
                        <span>MARRIED</span>
                      </label>
                    </div>
                  </td>
                </tr>

                {/* 13. Education Qualification - Search & select */}
                <tr>
                  <FormLabelCell k="education" enSecondary="Education Qualification" />
                  <td className="field-input-cell">
                    <SearchableSelect
                      name="qualification"
                      value={form.qualification}
                      onChange={set}
                      options={ALL_QUALIFICATIONS}
                      placeholder="SELECT EDUCATION QUALIFICATION"
                    />
                  </td>
                </tr>

                {/* 14. Aadhaar Card Number */}
                <tr>
                  <FormLabelCell k="aadhaar" enSecondary="Aadhaar Card Number" />
                  <td className="field-input-cell">
                    <input
                      name="aadhaar"
                      maxLength={14}
                      value={form.aadhaar}
                      onChange={set}
                      placeholder="12 DIGIT AADHAAR (E.G. 546546201002)"
                    />
                  </td>
                </tr>

                {/* 15. Hobbies - Multi-select search & select */}
                <tr>
                  <FormLabelCell k="hobbies" enSecondary="Hobbies" />
                  <td className="field-input-cell">
                    <MultiSearchableSelect
                      name="hobbies"
                      value={form.hobbies}
                      onChange={set}
                      options={ALL_HOBBIES}
                      placeholder="Search and select hobbies..."
                    />
                  </td>
                </tr>

                {/* 16. Other Skills - Multi-select search & select */}
                <tr>
                  <FormLabelCell k="otherSkills" enSecondary="Other Skills" />
                  <td className="field-input-cell">
                    <MultiSearchableSelect
                      name="otherSkills"
                      value={form.otherSkills}
                      onChange={set}
                      options={ALL_OTHER_SKILLS}
                      placeholder="Search and select other skills..."
                    />
                  </td>
                </tr>

                {/* 17. Types of Jobs * (Placed BEFORE Designation) */}
                <tr>
                  <FormLabelCell k="jobType" enSecondary="Types of Jobs *" required />
                  <td className="field-input-cell">
                    <div className="radio-options-row">
                      <label className="radio-option-item">
                        <input
                          type="radio"
                          name="jobType"
                          value="TAXI"
                          checked={form.jobType === 'TAXI'}
                          onChange={() => {
                            setForm((f) => ({
                              ...f,
                              jobType: 'TAXI',
                              designation: 'TAXI',
                              hasLicense: 'YES',
                            }));
                          }}
                        />
                        <span>{ts('taxi')}</span>
                      </label>
                      <label className="radio-option-item">
                        <input
                          type="radio"
                          name="jobType"
                          value="DRIVER"
                          checked={form.jobType === 'DRIVER'}
                          onChange={() => {
                            setForm((f) => ({
                              ...f,
                              jobType: 'DRIVER',
                              designation: 'DRIVER',
                              hasLicense: 'YES',
                            }));
                          }}
                        />
                        <span>{ts('driver')}</span>
                      </label>
                      <label className="radio-option-item">
                        <input
                          type="radio"
                          name="jobType"
                          value="OTHERS"
                          checked={form.jobType === 'OTHERS'}
                          onChange={() => {
                            setForm((f) => ({
                              ...f,
                              jobType: 'OTHERS',
                              designation:
                                f.designation === 'TAXI' || f.designation === 'DRIVER'
                                  ? ''
                                  : f.designation,
                            }));
                          }}
                        />
                        <span>{ts('others')}</span>
                      </label>
                    </div>
                  </td>
                </tr>

                {/* 18. Designation * (Shown right after Types of Jobs; if Others chosen, candidate types designation) */}
                <tr>
                  <FormLabelCell k="designation" enSecondary="Designation *" required />
                  <td className="field-input-cell">
                    {form.jobType === 'OTHERS' ? (
                      <input
                        name="designation"
                        required
                        autoFocus
                        value={form.designation}
                        onChange={set}
                        placeholder={ts('specifyDesignationPlaceholder')}
                        style={{
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          color: '#0f172a',
                          border: '1.5px solid #0284c7',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          backgroundColor: '#f0f9ff',
                          width: '100%',
                        }}
                      />
                    ) : (
                      <div className="d-flex align-items-center gap-2">
                        <input
                          name="designation"
                          readOnly
                          value={form.designation}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            fontWeight: 800,
                            fontSize: '0.88rem',
                            color: '#0f172a',
                            padding: '4px 6px',
                            width: 'auto',
                          }}
                        />
                        <span
                          className="badge bg-light text-secondary border px-2 py-1"
                          style={{ fontSize: '0.74rem', fontWeight: 600 }}
                        >
                          (Selected from Types of Jobs: {form.jobType})
                        </span>
                      </div>
                    )}
                  </td>
                </tr>

                {/* 18. Before Work Experience */}
                <tr>
                  <FormLabelCell k="workExperience" enSecondary="Before Work Experience" />
                  <td className="field-input-cell">
                    <input
                      name="workExperience"
                      value={form.workExperience}
                      onChange={set}
                      placeholder="E.G. 2 YEAR EXPERIENCE FOR DRIVING / PAST COMPANY"
                    />
                  </td>
                </tr>

                {/* 19. Do you have a Driving Licence? - Dedicated Separate Row */}
                <tr>
                  <FormLabelCell k="hasDrivingLicenceQuestion" enSecondary="Do you have a Driving Licence? *" required />
                  <td className="field-input-cell">
                    <div className="radio-options-row">
                      <label className="radio-option-item">
                        <input
                          type="radio"
                          name="hasLicense"
                          value="YES"
                          checked={form.hasLicense === 'YES'}
                          onChange={() =>
                            setForm((f) => ({
                              ...f,
                              hasLicense: 'YES',
                              dlNumber:
                                f.dlNumber === 'NO LICENCE' || f.dlNumber === 'NOT APPLICABLE'
                                  ? ''
                                  : f.dlNumber,
                            }))
                          }
                        />
                        <span>{ts('yes')}</span>
                      </label>
                      <label className="radio-option-item">
                        <input
                          type="radio"
                          name="hasLicense"
                          value="NO"
                          checked={form.hasLicense === 'NO'}
                          onChange={() =>
                            setForm((f) => ({
                              ...f,
                              hasLicense: 'NO',
                              dlNumber: 'NO LICENCE',
                              dlValidityDate: '',
                              dlExperience: '',
                              badgeNumber: '',
                              badgeDate: '',
                            }))
                          }
                        />
                        <span>{ts('no')}</span>
                      </label>
                    </div>
                  </td>
                </tr>

                {/* 20. Driving Licence Number (Shown ONLY when Driving Licence is YES) */}
                {form.hasLicense === 'YES' && (
                  <tr>
                    <FormLabelCell
                      k="drivingLicence"
                      enSecondary="Driving Licence Number *"
                      required={form.jobType === 'DRIVER' || form.jobType === 'TAXI'}
                    />
                    <td className="field-input-cell">
                      <input
                        name="dlNumber"
                        required={form.jobType === 'DRIVER' || form.jobType === 'TAXI'}
                        value={form.dlNumber === 'NO LICENCE' ? '' : form.dlNumber}
                        onChange={set}
                        placeholder="E.G. KA4220220003519"
                        style={{ fontWeight: 700 }}
                      />
                    </td>
                  </tr>
                )}

                {/* 21. Validity Date (Shown ONLY when Driving Licence is YES) */}
                {form.hasLicense === 'YES' && (
                  <tr>
                    <FormLabelCell k="validityDate" enSecondary="Validity Date" />
                    <td className="field-input-cell">
                      <input
                        type="date"
                        name="dlValidityDate"
                        value={form.dlValidityDate}
                        onChange={set}
                        style={{ maxWidth: 260 }}
                      />
                    </td>
                  </tr>
                )}

                {/* 22. FOR DRIVER: Do you have a Commercial Badge? */}
                {form.hasLicense === 'YES' && form.jobType === 'DRIVER' && (
                  <tr>
                    <FormLabelCell k="hasBadgeQuestion" enSecondary="Do you have a Badge? *" required />
                    <td className="field-input-cell">
                      <div className="radio-options-row">
                        <label className="radio-option-item">
                          <input
                            type="radio"
                            name="hasBadge"
                            value="YES"
                            checked={form.hasBadge === 'YES'}
                            onChange={() =>
                              setForm((f) => ({
                                ...f,
                                hasBadge: 'YES',
                              }))
                            }
                          />
                          <span>{ts('yes')}</span>
                        </label>
                        <label className="radio-option-item">
                          <input
                            type="radio"
                            name="hasBadge"
                            value="NO"
                            checked={form.hasBadge === 'NO'}
                            onChange={() =>
                              setForm((f) => ({
                                ...f,
                                hasBadge: 'NO',
                                badgeNumber: '',
                                badgeDate: '',
                              }))
                            }
                          />
                          <span>{ts('no')}</span>
                        </label>
                      </div>
                    </td>
                  </tr>
                )}

                {/* 23. FOR DRIVER: Badge Number & Expiry Date (Shown ONLY if hasBadge is YES) */}
                {form.hasLicense === 'YES' &&
                  form.jobType === 'DRIVER' &&
                  form.hasBadge === 'YES' && (
                    <tr>
                      <FormLabelCell k="badgeNumber" enSecondary="Badge Number & Expiry Date *" required />
                      <td className="field-input-cell">
                        <div className="inline-split-row">
                          <div className="inline-split-col">
                            <input
                              name="badgeNumber"
                              required
                              value={form.badgeNumber}
                              onChange={set}
                              placeholder="COMMERCIAL BADGE NO"
                              style={{ fontWeight: 700 }}
                            />
                          </div>
                          <div className="inline-split-col">
                            <span
                              className="inline-label"
                              style={{
                                fontSize: '0.76rem',
                                fontWeight: 800,
                                color: '#881337',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {ts('metaCertExpiryDate') || 'Expiry Date'}:
                            </span>
                            <input
                              type="date"
                              name="badgeDate"
                              required
                              value={form.badgeDate}
                              onChange={set}
                              style={{ flex: 1 }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                {/* TAXI VEHICLE DETAILS (Shown INSTEAD of Badge when Type of Job is TAXI) */}
                {form.hasLicense === 'YES' && form.jobType === 'TAXI' && (
                  <>
                    {/* A. Vehicle Type (Seater Capacity Dropdown) */}
                    <tr>
                      <FormLabelCell k="taxiVehicleType" enSecondary="Vehicle Type (Seating Capacity) *" required />
                      <td className="field-input-cell">
                        <select
                          name="taxiSeaterType"
                          value={form.taxiSeaterType}
                          onChange={set}
                          className="form-select"
                          style={{
                            fontWeight: 800,
                            color: '#0f172a',
                            border: '1.5px solid #cbd5e1',
                            borderRadius: '4px',
                            padding: '6px 10px',
                            backgroundColor: '#ffffff',
                          }}
                        >
                          {TAXI_SEATER_OPTIONS.map((opt, i) => (
                            <option key={i} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>

                    {/* B. Vehicle Number & Model */}
                    <tr>
                      <FormLabelCell k="taxiRegAndModel" enSecondary="Vehicle Number & Model *" required />
                      <td className="field-input-cell">
                        <div className="row g-2">
                          <div className="col-md-6">
                            <input
                              name="vehicleRegNo"
                              required
                              value={form.vehicleRegNo}
                              onChange={set}
                              placeholder="VEHICLE NO (E.G. KA 04 MZ 1610)"
                              style={{ fontWeight: 700, textTransform: 'uppercase' }}
                            />
                          </div>
                          <div className="col-md-6">
                            <input
                              name="vehicleModel"
                              required
                              value={form.vehicleModel}
                              onChange={set}
                              placeholder="MODEL (E.G. TOYOTA INNOVA 2024)"
                              style={{ fontWeight: 700, textTransform: 'uppercase' }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* C. FC No & FC Expiry Date */}
                    <tr>
                      <FormLabelCell k="taxiFc" enSecondary="FC Number & Expiry Date *" required />
                      <td className="field-input-cell">
                        <div className="inline-split-row">
                          <div className="inline-split-col">
                            <input
                              name="taxiFcNo"
                              required
                              value={form.taxiFcNo}
                              onChange={set}
                              placeholder="FC NO (E.G. KA04/FC/2024/991)"
                              style={{ fontWeight: 700, textTransform: 'uppercase' }}
                            />
                          </div>
                          <div className="inline-split-col">
                            <span
                              className="inline-label"
                              style={{
                                fontSize: '0.76rem',
                                fontWeight: 800,
                                color: '#881337',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {ts('metaCertExpiryDate') || 'Expiry Date'}:
                            </span>
                            <input
                              type="date"
                              name="taxiFcExpiryDate"
                              required
                              value={form.taxiFcExpiryDate}
                              onChange={set}
                              style={{ flex: 1 }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* D. Insurance No & Expiry Date */}
                    <tr>
                      <FormLabelCell k="taxiInsurance" enSecondary="Insurance No & Expiry Date *" required />
                      <td className="field-input-cell">
                        <div className="inline-split-row">
                          <div className="inline-split-col">
                            <input
                              name="taxiInsuranceNo"
                              required
                              value={form.taxiInsuranceNo}
                              onChange={set}
                              placeholder="INSURANCE POLICY NO"
                              style={{ fontWeight: 700, textTransform: 'uppercase' }}
                            />
                          </div>
                          <div className="inline-split-col">
                            <span
                              className="inline-label"
                              style={{
                                fontSize: '0.76rem',
                                fontWeight: 800,
                                color: '#881337',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {ts('metaCertExpiryDate') || 'Expiry Date'}:
                            </span>
                            <input
                              type="date"
                              name="taxiInsuranceExpiryDate"
                              required
                              value={form.taxiInsuranceExpiryDate}
                              onChange={set}
                              style={{ flex: 1 }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* E. Emission Certificate No & Expiry Date */}
                    <tr>
                      <FormLabelCell k="taxiEmission" enSecondary="Emission Cert No & Expiry Date *" required />
                      <td className="field-input-cell">
                        <div className="inline-split-row">
                          <div className="inline-split-col">
                            <input
                              name="taxiEmissionNo"
                              required
                              value={form.taxiEmissionNo}
                              onChange={set}
                              placeholder="EMISSION CERT / PUCC NO"
                              style={{ fontWeight: 700, textTransform: 'uppercase' }}
                            />
                          </div>
                          <div className="inline-split-col">
                            <span
                              className="inline-label"
                              style={{
                                fontSize: '0.76rem',
                                fontWeight: 800,
                                color: '#881337',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {ts('metaCertExpiryDate') || 'Expiry Date'}:
                            </span>
                            <input
                              type="date"
                              name="taxiEmissionExpiryDate"
                              required
                              value={form.taxiEmissionExpiryDate}
                              onChange={set}
                              style={{ flex: 1 }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  </>
                )}

                {/* 22. Alternate Mobile NO (3 slots) */}
                <tr>
                  <FormLabelCell k="alternateMobile" enSecondary="Alternate Mobile NO" />
                  <td className="field-input-cell">
                    <div className="row g-2">
                      <div className="col-md-4">
                        <input
                          name="altMobile1"
                          maxLength={10}
                          value={form.altMobile1}
                          onChange={set}
                          placeholder="MOBILE 1 (E.G. 9019655120)"
                        />
                      </div>
                      <div className="col-md-4">
                        <input
                          name="altMobile2"
                          maxLength={10}
                          value={form.altMobile2}
                          onChange={set}
                          placeholder="MOBILE 2 (E.G. 9591971282)"
                        />
                      </div>
                      <div className="col-md-4">
                        <input
                          name="altMobile3"
                          maxLength={10}
                          value={form.altMobile3}
                          onChange={set}
                          placeholder="MOBILE 3 (E.G. 9535847768)"
                        />
                      </div>
                    </div>
                  </td>
                </tr>

                {/* 23. Any Sangha / Union Membership */}
                <tr>
                  <FormLabelCell k="sangha" enSecondary="Any Sangha" />
                  <td className="field-input-cell">
                    <div className="d-flex flex-column gap-2">
                      <div className="d-flex align-items-center gap-3">
                        <span style={{ fontSize: '0.80rem', fontWeight: 800, color: '#881337', whiteSpace: 'nowrap' }}>
                          {ts('hasSanghaQuestion')}:
                        </span>
                        <div className="radio-options-row m-0">
                          <label className="radio-option-item m-0">
                            <input
                              type="radio"
                              name="hasSangha"
                              value="YES"
                              checked={form.hasSangha === 'YES'}
                              onChange={() =>
                                setForm((f) => ({
                                  ...f,
                                  hasSangha: 'YES',
                                }))
                              }
                            />
                            <span>{ts('yes')}</span>
                          </label>
                          <label className="radio-option-item m-0">
                            <input
                              type="radio"
                              name="hasSangha"
                              value="NO"
                              checked={form.hasSangha === 'NO'}
                              onChange={() =>
                                setForm((f) => ({
                                  ...f,
                                  hasSangha: 'NO',
                                  sangha: '',
                                }))
                              }
                            />
                            <span>{ts('no')}</span>
                          </label>
                        </div>
                      </div>

                      {/* If YES: Show that field Any Sangha */}
                      {form.hasSangha === 'YES' && (
                        <div className="mt-1">
                          <input
                            name="sangha"
                            required
                            autoFocus
                            value={form.sangha}
                            onChange={set}
                            placeholder="UNION / ASSOCIATION / SANGHA MEMBERSHIP DETAILS"
                            style={{
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              color: '#0f172a',
                              border: '1.5px solid #0284c7',
                              borderRadius: '4px',
                              padding: '6px 10px',
                              backgroundColor: '#f0f9ff',
                              width: '100%',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>

                {/* 24. Any Vehicle Name No (Shown for Non-Taxi candidates) */}
                {form.jobType !== 'TAXI' && (
                  <tr>
                    <FormLabelCell k="vehicleNameNo" enSecondary="Any Vehicle Name No" />
                    <td className="field-input-cell">
                      <div className="row g-2">
                        <div className="col-md-6">
                          <input
                            name="vehicleName"
                            value={form.vehicleName}
                            onChange={set}
                            placeholder="VEHICLE NAME / MODEL"
                          />
                        </div>
                        <div className="col-md-6">
                          <input
                            name="vehicleRegNo"
                            value={form.vehicleRegNo}
                            onChange={set}
                            placeholder="REGISTRATION NO (E.G. KA 04 MZ 1610)"
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Bottom Yellow Fee Strip (Page 1) */}
            <div className="fee-yellow-bar">
              <div className="registration-fee-summary">
                <i className="bi bi-receipt-cutoff me-1"></i>
                <span>
                  {ts('registrationFeePaidLabel')}: ₹{Number(form.registrationFeePaid || 0).toLocaleString('en-IN')}
                  {' | '}{ts('registrationFeePendingLabel')}: ₹{Math.max(0, 2400 - Number(form.registrationFeePaid || 0)).toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ color: '#78350f' }}>{ts('page1Of2')}</div>
            </div>
          </div>

          {/* ============================================================
              PAGE 2 / SHEET 2: Address, Banking, Family & Declaration
              ============================================================ */}
          <div className="physical-sheet" id="sheet2">
            {/* Top Spiritual Line */}
            <div className="spiritual-banner">
              <span>{ts('sairam')}</span>
              <span className="spiritual-sun">
                <i className="bi bi-sun-fill"></i>
              </span>
              <span>{ts('omShanthi')}</span>
            </div>

            {/* Company Header */}
            <div className="sheet-main-header">
              <div className="sheet-title-row">
                <div className="sheet-logo">SNP</div>
                <div>
                  <h1 className="sheet-company-name mb-0">{ts('companyName')}</h1>
                </div>
              </div>
              <div className="sheet-contact-line">
                MOB : 98175 08855, 9449847768
              </div>
            </div>

            {/* Navy Ribbon 2 */}
            <div className="sheet-navy-banner">
              {ts('navyBanner2')}
            </div>

            {/* Main Table (Page 2) */}
            <table className="physical-table">
              <tbody>
                {/* 1. Present Address */}
                <tr>
                  <FormLabelCell k="presentAddress" enSecondary="Present Address (With Proof) *" required />
                  <td className="field-input-cell">
                    <textarea
                      name="presentAddress"
                      rows={2}
                      required
                      value={form.presentAddress}
                      onChange={set}
                      placeholder="#25, HOUSE / NILAYA, STREET, AREA, TALUK, BENGALURU - 560074"
                    />
                  </td>
                </tr>

                {/* 2. Permanent Address with Responsive & Neat 'Same as Present' Button */}
                <tr>
                  <FormLabelCell k="permanentAddress" enSecondary="Permanent Address (With Proof) *" required />
                  <td className="field-input-cell">
                    <textarea
                      name="permanentAddress"
                      rows={2}
                      required
                      value={form.sameAddress ? form.presentAddress : form.permanentAddress}
                      onChange={set}
                      placeholder="PERMANENT HOMETOWN ADDRESS, VILLAGE, TALUK, DISTRICT, PINCODE"
                    />
                    <div className="d-flex align-items-center justify-content-between mt-2 pt-1">
                      <button
                        type="button"
                        className={`same-as-present-btn ${form.sameAddress ? 'checked' : ''}`}
                        onClick={() => {
                          const nextState = !form.sameAddress;
                          setForm((f) => ({
                            ...f,
                            sameAddress: nextState,
                            permanentAddress: nextState ? f.presentAddress : '',
                          }));
                        }}
                      >
                        <i className={`bi bi-${form.sameAddress ? 'check-square-fill' : 'square'}`}></i>
                        <span>{ts('sameAsPresent')}</span>
                      </button>
                    </div>
                  </td>
                </tr>

                {/* 3. Address Proof Document Upload (Image / PDF Upload) */}
                <tr>
                  <FormLabelCell k="addressProofDoc" enSecondary="Address Proof Document *" required />
                  <td className="field-input-cell">
                    <input
                      type="file"
                      ref={proofFileInputRef}
                      style={{ display: 'none' }}
                      accept="image/*,.pdf"
                      onChange={handleProofUpload}
                    />
                    {form.addressProofUrl ? (
                      <div className="address-proof-preview-card">
                        <div className="d-flex align-items-center gap-3">
                          <img
                            src={form.addressProofUrl}
                            alt="Address Proof Preview"
                            className="address-proof-thumb"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <div>
                            <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                              <i className="bi bi-file-earmark-check-fill text-success me-1"></i>
                              {form.addressProofName || 'Address_Proof_Document'}
                            </div>
                            <span className="badge bg-success-subtle text-success border border-success px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                              ✓ Address Proof Uploaded
                            </span>
                          </div>
                        </div>
                        <div className="address-proof-actions no-print">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary fw-bold"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => proofFileInputRef.current?.click()}
                          >
                            <i className="bi bi-arrow-repeat me-1"></i> {ts('changeDoc')}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger fw-bold"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                addressProofUrl: null,
                                addressProofName: '',
                              }))
                            }
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="address-proof-upload-box">
                        <div className="address-proof-content">
                          <div className="address-proof-description">
                            <i className="bi bi-card-text"></i>
                            <div>
                              <div className="address-proof-title">
                                {ts('uploadAddressProof')}
                              </div>
                              <small className="address-proof-hint">
                                Aadhaar Card, Voter ID, Rental Agreement, Gas Bill or Electricity Bill (JPG, PNG, PDF)
                              </small>
                            </div>
                          </div>
                          <div className="address-proof-actions no-print">
                            <button
                              type="button"
                              className="upload-browse-button"
                              onClick={() => proofFileInputRef.current?.click()}
                            >
                              <i className="bi bi-folder-fill"></i> {ts('browseFile')}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>

                {/* 3. Bank Account Details / UPI & Bank Document Proof */}
                <tr>
                  <FormLabelCell k="bankAccountDetails" enSecondary="Bank Account Details OR Google Pay, PhonePe & Paytm Mobile Number" />
                  <td className="field-input-cell p-0">
                    <table className="bank-grid-subtable">
                      <tbody>
                        <tr>
                          <td>
                            <span className="bank-sublabel">{ts('bankName')}</span>
                            <input
                              name="bankName"
                              value={form.bankName}
                              onChange={set}
                              placeholder="E.G. STATE BANK OF INDIA"
                            />
                          </td>
                          <td>
                            <span className="bank-sublabel">{ts('accountNumber')}</span>
                            <input
                              name="accountNumber"
                              value={form.accountNumber}
                              onChange={set}
                              placeholder="AC NO* E.G. 45298822702"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <span className="bank-sublabel">{ts('ifscCode')}</span>
                            <input
                              name="ifscCode"
                              value={form.ifscCode}
                              onChange={set}
                              placeholder="IFSC* E.G. SBIN0001911"
                            />
                          </td>
                          <td>
                            <span className="bank-sublabel">{ts('upiMobile')}</span>
                            <input
                              name="upiMobile"
                              maxLength={10}
                              value={form.upiMobile}
                              onChange={set}
                              placeholder="UPI MOBILE (10 DIGITS)"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Bank Passbook / Cheque / QR Image Upload (Requested by user) */}
                    <div className="bank-proof-upload-box">
                      <input
                        type="file"
                        ref={bankProofFileRef}
                        style={{ display: 'none' }}
                        accept="image/*,.pdf"
                        onChange={handleBankProofUpload}
                      />
                      {form.bankProofUrl ? (
                        <div className="address-proof-preview-card">
                          <div className="d-flex align-items-center gap-2">
                            <img
                              src={form.bankProofUrl}
                              alt="Bank Document Preview"
                              className="address-proof-thumb"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <div>
                              <div className="fw-bold text-dark" style={{ fontSize: '0.82rem' }}>
                                <i className="bi bi-file-earmark-check-fill text-success me-1"></i>
                                {form.bankProofName || 'Bank_Passbook_Document'}
                              </div>
                              <span className="badge bg-success-subtle text-success border border-success px-2 py-0.5" style={{ fontSize: '0.70rem' }}>
                                ✓ Passbook / Cheque / QR Attached
                              </span>
                            </div>
                          </div>
                          <div className="address-proof-actions no-print">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary py-0 px-2 fw-bold"
                              style={{ fontSize: '0.72rem' }}
                              onClick={() => bankProofFileRef.current?.click()}
                            >
                              <i className="bi bi-arrow-repeat"></i> Change
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger py-0 px-2 fw-bold"
                              style={{ fontSize: '0.72rem' }}
                              onClick={() => setForm((f) => ({ ...f, bankProofUrl: null, bankProofName: '' }))}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bank-proof-content">
                          <div className="bank-proof-description">
                            <i className="bi bi-bank"></i>
                            <span>
                              {ts('bankProofUploadTitle')}
                            </span>
                          </div>
                          <div className="address-proof-actions no-print">
                            <button
                              type="button"
                              className="upload-browse-button"
                              onClick={() => bankProofFileRef.current?.click()}
                            >
                              <i className="bi bi-folder-fill"></i> {ts('browseFile')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Registration fee payment amount */}
                <tr>
                  <FormLabelCell
                    k="registrationFeePaidLabel"
                    enSecondary="Registration Fee Paid (₹)"
                    required
                  />
                  <td className="field-input-cell">
                    <div className="registration-fee-field">
                      <span className="registration-fee-currency">₹</span>
                      <input
                        className="registration-fee-input"
                        type="number"
                        name="registrationFeePaid"
                        min="0"
                        max="2400"
                        step="1"
                        inputMode="numeric"
                        value={form.registrationFeePaid}
                        onChange={set}
                        aria-label="Registration fee paid in rupees"
                        required
                      />
                      <small>Enter the amount received (maximum ₹2,400).</small>
                    </div>
                  </td>
                </tr>

                {/* 4. Family Background Information (4 rows) */}
                <tr>
                  <FormLabelCell k="familyBackground" enSecondary="Family Background Information & Name & Mobile Number" />
                  <td className="field-input-cell p-0">
                    <table className="family-subtable-grid">
                      <tbody>
                        <tr>
                          <td>
                            <input
                              name="fam1Name"
                              value={form.fam1Name}
                              onChange={set}
                              placeholder="1. NAME (E.G. KENCHE GOWDA)"
                            />
                          </td>
                          <td>
                            <input
                              name="fam1Mobile"
                              maxLength={10}
                              value={form.fam1Mobile}
                              onChange={set}
                              placeholder="MOBILE NO (E.G. 9535015697)"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <input
                              name="fam2Name"
                              value={form.fam2Name}
                              onChange={set}
                              placeholder="2. NAME (E.G. KAVITHA)"
                            />
                          </td>
                          <td>
                            <input
                              name="fam2Mobile"
                              maxLength={10}
                              value={form.fam2Mobile}
                              onChange={set}
                              placeholder="MOBILE NO (E.G. 9591971282)"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <input
                              name="fam3Name"
                              value={form.fam3Name}
                              onChange={set}
                              placeholder="3. NAME (E.G. HARSHITHA)"
                            />
                          </td>
                          <td>
                            <input
                              name="fam3Mobile"
                              maxLength={10}
                              value={form.fam3Mobile}
                              onChange={set}
                              placeholder="MOBILE NO (E.G. 9019655120)"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <input
                              name="fam4Name"
                              value={form.fam4Name}
                              onChange={set}
                              placeholder="4. NAME (E.G. CHETHAN)"
                            />
                          </td>
                          <td>
                            <input
                              name="fam4Mobile"
                              maxLength={10}
                              value={form.fam4Mobile}
                              onChange={set}
                              placeholder="MOBILE NO (E.G. 7022921615)"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>

                {/* 5. Previous Customer Name No */}
                <tr>
                  <FormLabelCell k="previousCustomer" enSecondary="Previous Customer Name No" />
                  <td className="field-input-cell">
                    <input
                      name="prevCustomer"
                      autoComplete="off"
                      value={form.prevCustomer}
                      onChange={set}
                      placeholder="E.G. KRISHNAN, RAGAAN - 9881727970"
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Declaration */}
            <div className="sheet-declaration">
              <strong>{ts('declaration')}</strong>
            </div>

            {/* Authorized Branch & Employee Dispatch Verification (Requested by user after Declaration) */}
            <div className="branch-verification-card">
              <div className="branch-verification-header">
                <div className="branch-verification-heading">
                  <i className="bi bi-shield-check"></i>
                  <span>
                    {ts('branchSectionTitle')}
                  </span>
                </div>
                <span className="branch-verification-badge">
                  Branch Verification
                </span>
              </div>

              <div className="branch-verification-fields">
                <div className="branch-verification-field">
                  <label>
                    {ts('chooseBranch')}
                  </label>
                  <select
                    name="employeeBranch"
                    value={form.employeeBranch}
                    onChange={(e) => {
                      const branch = e.target.value;
                      setForm((f) => ({ ...f, employeeBranch: branch }));
                    }}
                    className="branch-verification-control"
                  >
                    {branches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="branch-verification-field">
                  <label>
                    {ts('employeeMobileLabel')}
                  </label>
                  <div className="branch-verification-phone">
                    <span>+91</span>
                    <input
                      type="text"
                      maxLength={10}
                      name="employeeMobile"
                      autoComplete="off"
                      value={form.employeeMobile}
                      onChange={handleEmployeeMobileChange}
                      placeholder="ENTER EMPLOYEE 10-DIGIT MOBILE"
                      className="branch-verification-control"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Verified Employee Information Card */}
              {form.employeeName ? (
                <div className="branch-employee-card branch-employee-verified">
                  <div className="branch-employee-details">
                    <i className="bi bi-person-check-fill"></i>
                    <div>
                      <div className="branch-employee-name">
                        {form.employeeName}
                        {form.employeeRole && (
                          <span className="branch-employee-role">
                            {form.employeeRole}
                          </span>
                        )}
                      </div>
                      <small className="branch-employee-meta">
                        Verified From: {form.employeeBranch}
                      </small>
                    </div>
                  </div>
                  <span className="branch-employee-status">
                    ✓ Verified Employee
                  </span>
                </div>
              ) : form.employeeMobile && form.employeeMobile.length === 10 ? (
                <div className="branch-employee-card branch-employee-pending">
                  <div className="branch-employee-pending-header">
                    <small>
                      <i className="bi bi-info-circle me-1"></i> Employee details not in default registry. Enter full name:
                    </small>
                    <span className="branch-employee-role">
                      Branch: {form.employeeBranch}
                    </span>
                  </div>
                  <input
                    name="employeeName"
                    autoComplete="off"
                    value={form.employeeName}
                    onChange={set}
                    placeholder="ENTER EMPLOYEE FULL NAME"
                    className="branch-verification-control"
                    required
                  />
                </div>
              ) : (
                <div className="branch-verification-help">
                  <i className="bi bi-info-circle"></i>
                  Select the branch and enter employee's 10-digit mobile number (e.g. <code>9817508855</code>, <code>9449847768</code>, <code>9019655120</code>). Their name and branch will automatically populate.
                </div>
              )}
            </div>

            <div className="sheet-thanking">
              {ts('thankingYou')}
            </div>

            {/* Signatures & Footer */}
            <div className="signature-grid">
              <div className="sig-left">
                <div className="sig-title">{ts('proprietor')}</div>
                <div className="sig-meta">
                  {ts('dateLabel')} : {new Date().toLocaleDateString('en-GB')}
                </div>
              </div>
              <div className="sig-right">
                <div className="sig-title">{ts('placeBangalore')}</div>
                <div className="sig-meta">
                  {ts('candidateSignature')}
                </div>
              </div>
            </div>

            <div className="text-end text-muted small mt-3">
              {ts('page2Of2')}
            </div>
          </div>

          {/* ============================================================
              BOTTOM DISPATCH ACTIONS (OUTSIDE PRINT)
              ============================================================ */}
          {!readOnly && <div className="text-center mt-4 mb-5 no-print">
            <div className="form-check d-inline-block text-start mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="confirmDispatchCheck"
                name="confirmed"
                checked={form.confirmed}
                onChange={set}
                required
              />
              <label className="form-check-label small fw-bold text-dark" htmlFor="confirmDispatchCheck">
                {ts('confirmCheck')}
              </label>
            </div>
            <br />
            <button type="submit" className="btn-submit-app">
              <i className="bi bi-cloud-arrow-up-fill" style={{ fontSize: '1.2rem' }}></i>
              <span>{ts('submitApp')}</span>
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-lg ms-3"
              onClick={() => window.print()}
            >
              <i className="bi bi-printer me-2"></i> {ts('printBtn')}
            </button>
          </div>}
        </div>
        </fieldset>
      </form>

      {showOtpModal && (
        <div className="modal-overlay" onClick={() => setShowOtpModal(false)}>
          <div
            className="modal-card registration-otp-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="registrationOtpTitle"
          >
            <div className="modal-head">
              <div className="add-user-icon">
                <i className="bi bi-shield-check"></i>
              </div>
              <div>
                <h4 id="registrationOtpTitle">Confirm Registration</h4>
                <small>Enter the candidate and employee OTPs to submit this application.</small>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowOtpModal(false)}
                aria-label="Close verification"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="modal-body">
              {otpError && (
                <div className="track-result track-error" role="alert" style={{ marginBottom: 14 }}>
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <div>{otpError}</div>
                </div>
              )}
              <p className="registration-otp-hint">
                Both verification codes are preset to <strong>1234</strong>.
              </p>
              <div className="field-block full">
                <label className="input-label" htmlFor="candidateOtp">Candidate OTP</label>
                <input
                  id="candidateOtp"
                  className="auth-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="one-time-code"
                  value={candidateInputOtp}
                  onChange={(event) => setCandidateInputOtp(event.target.value.replace(/\D/g, '').slice(0, 4))}
                />
              </div>
              <div className="field-block full">
                <label className="input-label" htmlFor="employeeOtp">Employee OTP</label>
                <input
                  id="employeeOtp"
                  className="auth-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={employeeInputOtp}
                  onChange={(event) => setEmployeeInputOtp(event.target.value.replace(/\D/g, '').slice(0, 4))}
                />
              </div>
            </div>

            <div className="modal-foot">
              <button type="button" className="btn btn-outline" onClick={() => setShowOtpModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn add-user-btn modal-submit" onClick={handleVerifyBothOtps}>
                <i className="bi bi-check-lg"></i> Verify &amp; Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
