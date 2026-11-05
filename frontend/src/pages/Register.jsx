import { useState, useRef, useEffect } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { LANGUAGES, T } from '../data/translations.js';
import { getSession } from '../data/session.js';
import { registrationApi } from '../api/registrationApi.js';
import { branchApi } from '../api/branchApi.js';
import { employeeApi } from '../api/employeeApi.js';
import { uploadRegistrationFile } from '../api/uploadApi.js';
import { whatsappApi } from '../api/whatsappApi.js';
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

const INDIAN_STATES = [
  'ANDHRA PRADESH',
  'ARUNACHAL PRADESH',
  'ASSAM',
  'BIHAR',
  'CHHATTISGARH',
  'GOA',
  'GUJARAT',
  'HARYANA',
  'HIMACHAL PRADESH',
  'JHARKHAND',
  'KARNATAKA',
  'KERALA',
  'MADHYA PRADESH',
  'MAHARASHTRA',
  'MANIPUR',
  'MEGHALAYA',
  'MIZORAM',
  'NAGALAND',
  'ODISHA',
  'PUNJAB',
  'RAJASTHAN',
  'SIKKIM',
  'TAMIL NADU',
  'TELANGANA',
  'TRIPURA',
  'UTTAR PRADESH',
  'UTTARAKHAND',
  'WEST BENGAL',
  'ANDAMAN AND NICOBAR ISLANDS',
  'CHANDIGARH',
  'DADRA AND NAGAR HAVELI AND DAMAN AND DIU',
  'DELHI',
  'JAMMU AND KASHMIR',
  'LADAKH',
  'LAKSHADWEEP',
  'PUDUCHERRY',
];

const emptyForm = {
  // Page 1 Meta
  formDate: new Date().toISOString().split('T')[0],
  state: 'KARNATAKA',
  regNo: '',
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
  taxiPermitType: '',
  vehicleModel: '',
  taxiFcNo: '',
  taxiFcExpiryDate: '',
  taxiInsuranceNo: '',
  taxiInsuranceExpiryDate: '',
  taxiEmissionNo: '',
  taxiEmissionExpiryDate: '',

  // Page 2
  presentAddress: '',
  permanentAddress: '',
  sameAddress: false,
  addressProofUrl: null,
  addressProofName: '',
  addressProofs: [],
  bankProofUrl: null,
  bankProofName: '',
  employeeBranch: '',
  employeeMobile: '',
  employeeName: '',
  employeeRole: '',
  registrationFeePaid: '1300',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
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

function validateUpload(file, acceptedTypes) {
  if (!acceptedTypes.includes(file.type)) {
    throw new Error('Choose a JPG, PNG, or PDF file.');
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Each uploaded document must be 2 MB or smaller.');
  }
}

function normalizeAadhaar(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 12);
}

function formatAadhaar(value) {
  return normalizeAadhaar(value).match(/\d{1,4}/g)?.join(' ') || '';
}

function isValidPan(value) {
  return /^[A-Z]{5}\d{4}[A-Z]$/.test(String(value || '').trim().toUpperCase());
}

export default function Register({ readOnly = false, editable = false }) {
  const navigate = useNavigate();
  const { ref: applicationRef } = useParams();
  const recordMode = readOnly || editable;
  const [branches, setBranches] = useState([]);
  const [branchLoadError, setBranchLoadError] = useState('');
  const [viewApplication, setViewApplication] = useState(null);
  const [recordLoading, setRecordLoading] = useState(recordMode);
  const [recordError, setRecordError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [refCode, setRefCode] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [lang, setLang] = useState(() => localStorage.getItem('snp_lang') || 'en');
  const session = getSession();
  const fileInputRef = useRef(null);
  const proofFileInputRef = useRef(null);
  const bankProofFileRef = useRef(null);

  const [candidateOtpSent, setCandidateOtpSent] = useState(false);
  const [employeeOtpSent, setEmployeeOtpSent] = useState(false);
  const [candidateInputOtp, setCandidateInputOtp] = useState('');
  const [employeeInputOtp, setEmployeeInputOtp] = useState('');
  const [candidateOtpError, setCandidateOtpError] = useState('');
  const [employeeOtpError, setEmployeeOtpError] = useState('');
  const [candidateOtpSending, setCandidateOtpSending] = useState(false);
  const [employeeOtpSending, setEmployeeOtpSending] = useState(false);
  const [candidateOtpVerifying, setCandidateOtpVerifying] = useState(false);
  const [employeeOtpVerifying, setEmployeeOtpVerifying] = useState(false);
  const [candidateVerified, setCandidateVerified] = useState(false);
  const [employeeVerified, setEmployeeVerified] = useState(false);
  const [employeeLookupError, setEmployeeLookupError] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const employeeLookupRef = useRef(0);

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, cameraOpen]);

  useEffect(() => () => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    branchApi.list()
      .then((rows) => setBranches(rows.map((branch) => branch.name)))
      .catch((error) => setBranchLoadError(error.message));
  }, []);

  useEffect(() => {
    if (!recordMode) return;
    let active = true;
    setRecordLoading(true);
    setRecordError('');
    setViewApplication(null);
    registrationApi.get(applicationRef)
      .then((row) => {
        if (!active) return;
        const details = row.details || {};
        setViewApplication({
          ...row,
          branch: row.branch?.name || '',
          submittedBy: row.submittedBy?.name || row.submittedByName || '',
          submittedByMobile: row.submittedBy?.mobile || row.submittedByMobile || '',
          registrationData: details,
        });
      })
      .catch((error) => {
        if (active) setRecordError(error.message);
      })
      .finally(() => {
        if (active) setRecordLoading(false);
      });
    return () => { active = false; };
  }, [applicationRef, recordMode]);

  useEffect(() => {
    if (!viewApplication) {
      if (branches.length) setForm((current) => ({ ...current, employeeBranch: branches[0] }));
      return;
    }
    const details = viewApplication.registrationData || {};
    const storedProofs = Array.isArray(details.addressProofs) ? details.addressProofs : [];
    const primaryProofUrl = viewApplication.addressProofUrl || details.addressProofUrl || null;
    const primaryProofName = viewApplication.addressProofName || details.addressProofName || '';
    const addressProofs = storedProofs.length
      ? storedProofs
      : primaryProofUrl
        ? [{ url: primaryProofUrl, name: primaryProofName }]
        : [];
    setForm((current) => ({
      ...current,
      ...details,
      addressProofs,
      pan: String(details.pan || '').toUpperCase(),
      aadhaar: formatAadhaar(details.aadhaar),
      fullName: viewApplication.name || details.fullName || '',
      mobile: String(viewApplication.mobile || details.mobile || '').replace(/^\+91\s*/, ''),
      designation: viewApplication.designation || details.designation || '',
      employeeName: viewApplication.submittedBy || details.employeeName || '',
      employeeMobile: String(viewApplication.submittedByMobile || details.employeeMobile || '').replace(/^\+91\s*/, ''),
      employeeBranch: viewApplication.branch || details.employeeBranch || branches[0] || '',
      registrationFeePaid: String(viewApplication.feesPaid ?? details.registrationFeePaid ?? 0),
      addressProofUrl: viewApplication.addressProofUrl || details.addressProofUrl || null,
      bankProofUrl: viewApplication.bankProofUrl || details.bankProofUrl || null,
      photoUrl: viewApplication.photoUrl || details.photoUrl || null,
    }));
  }, [viewApplication, branches]);

  useEffect(() => {
    if (recordMode || !branches.length) return;
    setForm((current) => ({
      ...current,
      employeeBranch: branches.includes(current.employeeBranch) ? current.employeeBranch : branches[0],
    }));
  }, [branches, recordMode]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (type, message) => {
    setToast({ type, message, id: Date.now() });
  };

  const downloadProof = async (url, name) => {
    try {
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error(`Download failed (${response.status}).`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = name || 'uploaded-proof';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      showToast('error', error.message || 'Could not download the uploaded proof.');
    }
  };

  const handleCandidateMobileChange = (e) => {
    const mobile = e.target.value.replace(/\D/g, '').slice(0, 10);
    setForm((f) => ({ ...f, mobile }));
    setCandidateOtpSent(false);
    setCandidateInputOtp('');
    setCandidateOtpError('');
    setCandidateVerified(false);
  };

  const handleBankProofUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      validateUpload(file, ['image/jpeg', 'image/png', 'application/pdf']);
      uploadRegistrationFile('bank-proof', file)
        .then((uploaded) => setForm((f) => ({ ...f, bankProofUrl: uploaded.url, bankProofName: uploaded.name })))
        .catch((error) => showToast('error', error.message));
    } catch (error) {
      showToast('error', error.message);
    }
  };

  const handleEmployeeMobileChange = async (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    const lookupId = ++employeeLookupRef.current;
    setEmployeeLookupError('');
    setForm((f) => {
      const previousEmployeeValue = f.employeeName && f.employeeMobile
        ? `${f.employeeName} - ${f.employeeMobile}`
        : '';
      return {
        ...f,
        employeeMobile: val,
        employeeName: '',
        employeeRole: '',
        prevCustomer: f.prevCustomer === previousEmployeeValue ? '' : f.prevCustomer,
      };
    });
    setEmployeeOtpSent(false);
    setEmployeeInputOtp('');
    setEmployeeOtpError('');
    setEmployeeVerified(false);
    if (val.length !== 10) return;

    try {
      const found = await employeeApi.getByMobile(val);
      if (lookupId !== employeeLookupRef.current) return;
      setForm((f) => {
        const previousEmployeeValue = f.employeeName && f.employeeMobile
          ? `${f.employeeName} - ${f.employeeMobile}`
          : '';
        const previousCustomerWasEmployee = f.prevCustomer === previousEmployeeValue;
        return {
          ...f,
          employeeName: found.name,
          employeeBranch: found.branch && branches.includes(found.branch) ? found.branch : f.employeeBranch,
          employeeRole: 'Employee',
          prevCustomer: !f.prevCustomer || previousCustomerWasEmployee
            ? `${found.name} - ${found.mobile}`
            : f.prevCustomer,
        };
      });
    } catch (error) {
      if (lookupId === employeeLookupRef.current) setEmployeeLookupError(error.message);
    }
  };

  const sendOtp = async (person) => {
    const isCandidate = person === 'candidate';
    const mobile = isCandidate ? form.mobile : form.employeeMobile;
    const setSending = isCandidate ? setCandidateOtpSending : setEmployeeOtpSending;
    const setSent = isCandidate ? setCandidateOtpSent : setEmployeeOtpSent;
    const setInputOtp = isCandidate ? setCandidateInputOtp : setEmployeeInputOtp;
    const setError = isCandidate ? setCandidateOtpError : setEmployeeOtpError;
    const setVerified = isCandidate ? setCandidateVerified : setEmployeeVerified;

    if (!/^\d{10}$/.test(mobile)) {
      setError('Enter a valid 10-digit mobile number first.');
      return;
    }
    if (!isCandidate && !form.employeeName) {
      setError(employeeLookupError || 'Enter a registered employee mobile number first.');
      return;
    }

    setSending(true);
    setError('');
    try {
      await whatsappApi.requestOtp(mobile, isCandidate ? 'CANDIDATE' : 'EMPLOYEE');
      setSent(true);
      setInputOtp('');
      setVerified(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async (person) => {
    const isCandidate = person === 'candidate';
    const mobile = isCandidate ? form.mobile : form.employeeMobile;
    const code = isCandidate ? candidateInputOtp : employeeInputOtp;
    const otpSent = isCandidate ? candidateOtpSent : employeeOtpSent;
    const setVerifying = isCandidate ? setCandidateOtpVerifying : setEmployeeOtpVerifying;
    const setError = isCandidate ? setCandidateOtpError : setEmployeeOtpError;
    const setVerified = isCandidate ? setCandidateVerified : setEmployeeVerified;

    if (!otpSent) {
      setError('Send an OTP to this mobile number first.');
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit OTP sent to WhatsApp.');
      return;
    }

    setVerifying(true);
    setError('');
    try {
      await whatsappApi.verifyOtp(mobile, isCandidate ? 'CANDIDATE' : 'EMPLOYEE', code);
      setVerified(true);
    } catch (error) {
      setVerified(false);
      setError(error.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleProofUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    const currentProofs = form.addressProofs?.length
      ? form.addressProofs
      : form.addressProofUrl
        ? [{ url: form.addressProofUrl, name: form.addressProofName }]
        : [];
    const remaining = 3 - currentProofs.length;
    if (remaining <= 0) {
      showToast('error', 'You can upload a maximum of 3 address proof documents.');
      return;
    }

    const selected = files.slice(0, remaining);
    if (files.length > remaining) {
      showToast('error', `Only ${remaining} more address proof document(s) can be added.`);
    }

    try {
      selected.forEach((file) => validateUpload(file, ['image/jpeg', 'image/png', 'application/pdf']));
      for (const file of selected) {
        const uploaded = await uploadRegistrationFile('address-proof', file);
        setForm((f) => {
          const existing = f.addressProofs?.length
            ? f.addressProofs
            : f.addressProofUrl
              ? [{ url: f.addressProofUrl, name: f.addressProofName }]
              : [];
          if (existing.length >= 3) return f;
          const next = [...existing, { url: uploaded.url, name: uploaded.name }];
          return {
            ...f,
            addressProofs: next,
            addressProofUrl: next[0]?.url || null,
            addressProofName: next[0]?.name || '',
          };
        });
      }
    } catch (error) {
      showToast('error', error.message);
    }
  };

  const removeAddressProof = (index) => {
    setForm((f) => {
      const existing = f.addressProofs?.length
        ? f.addressProofs
        : f.addressProofUrl
          ? [{ url: f.addressProofUrl, name: f.addressProofName }]
          : [];
      const next = existing.filter((_, i) => i !== index);
      return {
        ...f,
        addressProofs: next,
        addressProofUrl: next[0]?.url || null,
        addressProofName: next[0]?.name || '',
      };
    });
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

  const handlePanChange = (e) => {
    const pan = e.target.value.replace(/[^a-z\d]/gi, '').slice(0, 10).toUpperCase();
    setForm((current) => ({ ...current, pan }));
  };

  const handleAadhaarChange = (e) => {
    const aadhaar = formatAadhaar(e.target.value);
    setForm((current) => ({ ...current, aadhaar }));
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

  const uploadPhoto = (file) => {
    if (!file) return;
    try {
      validateUpload(file, ['image/jpeg', 'image/png']);
      uploadRegistrationFile('photo', file)
        .then((uploaded) => setForm((f) => ({ ...f, photoUrl: uploaded.url })))
        .catch((error) => showToast('error', error.message));
    } catch (error) {
      showToast('error', error.message);
    }
  };

  const handlePhotoUpload = (e) => {
    uploadPhoto(e.target.files?.[0]);
    e.target.value = '';
  };

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      showToast('error', 'Camera access requires a supported browser and a secure HTTPS connection. Use Browse File instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user' },
      });
      cameraStreamRef.current = stream;
      setCameraStream(stream);
      setCameraOpen(true);
    } catch (error) {
      showToast('error', error.name === 'NotAllowedError'
        ? 'Camera permission was denied. Allow camera access in your browser settings and try again.'
        : `Unable to open the camera: ${error.message}`);
    }
  };

  const closeCamera = () => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    setCameraStream(null);
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) {
      showToast('error', 'Camera is not ready yet. Please try again.');
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not prepare the photo capture.');
      context.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) {
          showToast('error', 'Could not capture the photo. Please try again.');
          return;
        }
        uploadPhoto(new File([blob], `candidate-photo-${Date.now()}.jpg`, { type: 'image/jpeg' }));
        closeCamera();
      }, 'image/jpeg', 0.9);
    } catch (error) {
      showToast('error', error.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    if (form.pan.trim() && !isValidPan(form.pan)) {
      showToast('error', 'Enter a valid PAN number in the format ABCDE1234F.');
      document.querySelector('[name="pan"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.querySelector('[name="pan"]')?.focus({ preventScroll: true });
      return;
    }

    if (form.aadhaar && normalizeAadhaar(form.aadhaar).length !== 12) {
      showToast('error', 'Aadhaar number must contain exactly 12 digits.');
      document.querySelector('[name="aadhaar"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.querySelector('[name="aadhaar"]')?.focus({ preventScroll: true });
      return;
    }

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

    if (!editable && !candidateVerified) {
      showToast('error', 'Verify the candidate mobile number using the OTP before submitting.');
      document.querySelector('[name="mobile"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!editable && !employeeVerified) {
      showToast('error', 'Verify the employee mobile number using the OTP before submitting.');
      document.querySelector('.branch-verification-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!form.addressProofs?.length && !form.addressProofUrl) {
      showToast('error', 'Upload at least one address proof document before submitting.');
      document.querySelector('.address-proof-upload-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const paidAmount = Number(form.registrationFeePaid);
    if (!Number.isInteger(paidAmount) || paidAmount < 0 || paidAmount > 2400) {
      showToast('error', 'Enter a whole-rupee paid amount between ₹0 and ₹2,400.');
      document.querySelector('[name="registrationFeePaid"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    await completeRegistration();
  };

  const completeRegistration = async () => {
    const paidAmount = Number(form.registrationFeePaid);
    setSubmitting(true);
    try {
      const registrationData = {
        ...form,
        pan: form.pan.trim().toUpperCase(),
        aadhaar: normalizeAadhaar(form.aadhaar),
        regNo: applicationRef || form.regNo,
        ...(editable ? { registrationFeePaid: String(viewApplication.feesPaid) } : {}),
      };
      const payload = {
        name: (form.fullName || '').trim().toUpperCase(),
        mobile: form.mobile,
        designation: (form.designation || 'General Staff').toUpperCase(),
        registrationData,
      };
      const registration = editable
        ? await registrationApi.update(applicationRef, payload)
        : await registrationApi.create({
          ...payload,
          feesPaid: paidAmount,
          registrationData,
        });
      if (editable) {
        navigate('/admin/applications', { replace: true });
        return;
      }
      setRefCode(registration.ref);
      showToast('success', 'Registration submitted successfully.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      showToast('error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isOwnedByCurrentUser = () => {
    if (!viewApplication || !session) return false;
    if (session.role === 'admin') return true;
    if (viewApplication.submittedByUserId) {
      return viewApplication.submittedByUserId === session.id;
    }
    if (viewApplication.submittedByLoginMobile) {
      return viewApplication.submittedByLoginMobile.replace(/\D/g, '')
        === String(session.mobile || '').replace(/\D/g, '');
    }
    const ownerMobile = session.role === 'applicant'
      ? viewApplication.mobile
      : viewApplication.submittedByMobile || viewApplication.filledByMobile;
    return String(ownerMobile || '').replace(/\D/g, '')
      === String(session.mobile || '').replace(/\D/g, '');
  };

  if (recordMode && recordLoading) {
    return <div className="container py-5 text-center">Loading application record…</div>;
  }

  if (recordMode && recordError) {
    return <div className="container py-5"><div className="track-result track-error" role="alert">{recordError}</div></div>;
  }

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

  if (readOnly && (!viewApplication || !isOwnedByCurrentUser())) {
    return <Navigate to={session?.role === 'admin' ? '/admin/applications' : '/my-submissions'} replace />;
  }
  if (editable && (!viewApplication || session?.role !== 'admin')) {
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
            <Link to="/track" className="btn btn-outline">
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

  const addressProofDocs = form.addressProofs?.length
    ? form.addressProofs
    : form.addressProofUrl
      ? [{ url: form.addressProofUrl, name: form.addressProofName }]
      : [];

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
      {!recordMode && (
        <header className="registration-welcome-bar no-print">
          <span className="registration-welcome-mark" aria-hidden="true">
            <i className="bi bi-file-earmark-person"></i>
          </span>
          <div className="registration-welcome-copy">
            <span className="registration-welcome-eyebrow">Candidate Registration</span>
            <h2 className="registration-welcome-title">Job Interview Application Form</h2>
            <p>Complete the form to submit a manpower application.</p>
          </div>
        </header>
      )}
      {recordMode ? (
        <div className="registration-record-toolbar no-print">
          <div>
            <span className="section-eyebrow"><i className="bi bi-file-earmark-person"></i> {editable ? 'Edit Application' : 'Application Record'}</span>
            <h2>{viewApplication.name || 'Candidate Application'}</h2>
            <small>Reference: {viewApplication.ref}</small>
          </div>
          <div className="registration-record-actions">
            <Link to="/admin/applications" className="btn btn-outline">
              <i className="bi bi-arrow-left"></i> Back to Applications
            </Link>
            {readOnly && session?.role === 'admin' && (
              <Link to={`/admin/application/${encodeURIComponent(viewApplication.ref)}/edit`} className="btn btn-primary">
                <i className="bi bi-pencil"></i> Edit
              </Link>
            )}
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
      {!recordMode && <div className="language-bar-container no-print">
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
        {branchLoadError && <div className="track-result track-error" role="alert">{branchLoadError}</div>}
        <fieldset className="registration-view-fieldset" disabled={readOnly || submitting}>
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
                <img
                  src="/assets/brand-logo.png"
                  alt={ts('companyName')}
                  className="sheet-brand-logo"
                />
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
                    <img
                      src={form.photoUrl}
                      alt="Candidate Passport"
                      crossOrigin={form.photoUrl.startsWith('http') ? 'use-credentials' : undefined}
                    />
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
                        onClick={openCamera}
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
                      <SearchableSelect
                        name="state"
                        value={form.state}
                        onChange={set}
                        options={INDIAN_STATES}
                        placeholder="SEARCH STATE"
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
                        readOnly
                        placeholder="Assigned after submission"
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
                          onChange={handleCandidateMobileChange}
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
                      {form.mobile.length === 10 && (
                        <div className="mobile-otp-controls">
                          {candidateVerified ? (
                            <span className="mobile-otp-verified">
                              <i className="bi bi-check-circle-fill"></i> Candidate mobile verified
                            </span>
                          ) : (
                            <div className="mobile-otp-verification">
                              <button type="button" className="mobile-otp-send" onClick={() => sendOtp('candidate')} disabled={candidateOtpSending}>
                                <i className="bi bi-send"></i> {candidateOtpSending ? 'Sending...' : candidateOtpSent ? 'Resend OTP' : 'Send OTP'}
                              </button>
                              {candidateOtpSent && (
                                <div className="mobile-otp-entry">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    aria-label="Candidate mobile OTP"
                                    placeholder="Enter 6-digit OTP"
                                    value={candidateInputOtp}
                                    onChange={(event) => {
                                      setCandidateInputOtp(event.target.value.replace(/\D/g, '').slice(0, 6));
                                      setCandidateOtpError('');
                                    }}
                                  />
                                  <button type="button" className="mobile-otp-verify" onClick={() => verifyOtp('candidate')} disabled={candidateOtpVerifying}>
                                    {candidateOtpVerifying ? 'Verifying...' : 'Verify'}
                                  </button>
                                </div>
                              )}
                              {candidateOtpError && <small className="mobile-otp-error">{candidateOtpError}</small>}
                            </div>
                          )}
                        </div>
                      )}
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
                      onChange={handlePanChange}
                      placeholder="E.G. ABCDE1234F"
                      autoCapitalize="characters"
                      spellCheck={false}
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
                      inputMode="numeric"
                      value={form.aadhaar}
                      onChange={handleAadhaarChange}
                      placeholder="E.G. 1234 5678 9123"
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
                              taxiPermitType: '',
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
                              taxiPermitType: '',
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

                    {/* Vehicle Name */}
                    <tr>
                      <FormLabelCell k="vehicleName" enSecondary="Vehicle Name *" required />
                      <td className="field-input-cell">
                        <input
                          name="vehicleName"
                          required
                          value={form.vehicleName}
                          onChange={set}
                          placeholder="VEHICLE NAME (E.G. TOYOTA INNOVA CRYSTA)"
                          style={{ fontWeight: 700, textTransform: 'uppercase' }}
                        />
                      </td>
                    </tr>

                    <tr>
                      <FormLabelCell k="taxiPermitType" enSecondary="Taxi Permit Type *" required />
                      <td className="field-input-cell">
                        <select
                          name="taxiPermitType"
                          value={form.taxiPermitType}
                          onChange={set}
                          required
                          className="form-select"
                        >
                          <option value="">Select taxi permit type</option>
                          <option value="State Permit">State Permit</option>
                          <option value="All India Permit">All India Permit</option>
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

            {/* Bottom Yellow Strip (Page 1) */}
            <div className="fee-yellow-bar">
              <div style={{ color: '#78350f', width: '100%', textAlign: 'center' }}>{ts('page1Of2')}</div>
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
                <img
                  src="/assets/brand-logo.png"
                  alt={ts('companyName')}
                  className="sheet-brand-logo"
                />
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

                {/* 3. Address Proof Documents Upload (up to 3, multiple browse) */}
                <tr>
                  <FormLabelCell k="addressProofDoc" enSecondary="Address Proof Documents * (Up to 3)" required />
                  <td className="field-input-cell">
                    <input
                      type="file"
                      ref={proofFileInputRef}
                      style={{ display: 'none' }}
                      accept="image/*,.pdf"
                      multiple
                      onChange={handleProofUpload}
                    />
                    {addressProofDocs.length ? (
                      <div className="address-proof-list">
                        {addressProofDocs.map((proof, index) => (
                          <div className="address-proof-preview-card" key={`${proof.url}-${index}`}>
                            <div className="d-flex align-items-center gap-3">
                              {proof.name?.toLowerCase().endsWith('.pdf') ? (
                                <a href={proof.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                                  <i className="bi bi-file-earmark-pdf"></i> View PDF
                                </a>
                              ) : (
                                <a
                                  href={proof.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`Open address proof ${index + 1} in a new tab`}
                                >
                                  <img
                                    src={proof.url}
                                    alt={`Address Proof ${index + 1} Preview`}
                                    className="address-proof-thumb"
                                    crossOrigin={proof.url?.startsWith('http') ? 'use-credentials' : undefined}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                </a>
                              )}
                              <div>
                                <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                                  <i className="bi bi-file-earmark-check-fill text-success me-1"></i>
                                  {proof.name || `Address_Proof_Document_${index + 1}`}
                                </div>
                                <span className="badge bg-success-subtle text-success border border-success px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                                  ✓ Document {index + 1} uploaded
                                </span>
                              </div>
                            </div>
                            <div className="address-proof-actions no-print">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => downloadProof(proof.url, proof.name || `address-proof-${index + 1}`)}
                              >
                                <i className="bi bi-download"></i> Download
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger fw-bold"
                                style={{ fontSize: '0.75rem' }}
                                onClick={() => removeAddressProof(index)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                          <small className="address-proof-hint">
                            {addressProofDocs.length < 3
                              ? `You can add ${3 - addressProofDocs.length} more document(s). JPG, PNG or PDF, max 2 MB each.`
                              : 'Maximum of 3 address proof documents added.'}
                          </small>
                          {addressProofDocs.length < 3 && (
                            <button
                              type="button"
                              className="upload-browse-button no-print"
                              onClick={() => proofFileInputRef.current?.click()}
                            >
                              <i className="bi bi-plus-lg"></i> Add More
                            </button>
                          )}
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
                                Aadhaar Card, Voter ID, Rental Agreement, Gas Bill or Electricity Bill. Browse up to 3 documents (JPG, PNG, PDF, max 2 MB each).
                              </small>
                            </div>
                          </div>
                          <div className="address-proof-actions no-print">
                            <button
                              type="button"
                              className="upload-browse-button"
                              onClick={() => proofFileInputRef.current?.click()}
                            >
                              <i className="bi bi-folder-fill"></i> Browse Documents
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
                            {form.bankProofName?.toLowerCase().endsWith('.pdf') ? (
                              <a href={form.bankProofUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                                <i className="bi bi-file-earmark-pdf"></i> View PDF
                              </a>
                            ) : (
                              <a
                                href={form.bankProofUrl}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Open bank proof in a new tab"
                              >
                                <img
                                  src={form.bankProofUrl}
                                  alt="Bank Document Preview"
                                  className="address-proof-thumb"
                                  crossOrigin={form.bankProofUrl.startsWith('http') ? 'use-credentials' : undefined}
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              </a>
                            )}
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
                              onClick={() => downloadProof(form.bankProofUrl, form.bankProofName || 'bank-proof')}
                            >
                              <i className="bi bi-download"></i> Download
                            </button>
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
                    disabled={Boolean(form.employeeName)}
                    required
                  >
                    {branches.length === 0 && <option value="">Loading branches…</option>}
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
                  {employeeLookupError && <small className="mobile-otp-error">{employeeLookupError}</small>}
                  {form.employeeMobile.length === 10 && (
                    <div className="mobile-otp-controls">
                      {employeeVerified ? (
                        <span className="mobile-otp-verified">
                          <i className="bi bi-check-circle-fill"></i> Employee mobile verified
                        </span>
                      ) : (
                        <div className="mobile-otp-verification">
                          <button type="button" className="mobile-otp-send" onClick={() => sendOtp('employee')} disabled={employeeOtpSending}>
                            <i className="bi bi-send"></i> {employeeOtpSending ? 'Sending...' : employeeOtpSent ? 'Resend OTP' : 'Send OTP'}
                          </button>
                          {employeeOtpSent && (
                            <div className="mobile-otp-entry">
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                aria-label="Employee mobile OTP"
                                placeholder="Enter 6-digit OTP"
                                value={employeeInputOtp}
                                onChange={(event) => {
                                  setEmployeeInputOtp(event.target.value.replace(/\D/g, '').slice(0, 6));
                                  setEmployeeOtpError('');
                                }}
                              />
                              <button type="button" className="mobile-otp-verify" onClick={() => verifyOtp('employee')} disabled={employeeOtpVerifying}>
                                {employeeOtpVerifying ? 'Verifying...' : 'Verify'}
                              </button>
                            </div>
                          )}
                          {employeeOtpError && <small className="mobile-otp-error">{employeeOtpError}</small>}
                        </div>
                      )}
                    </div>
                  )}
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
            <button type="submit" className="btn-submit-app" disabled={submitting}>
              <i className="bi bi-cloud-arrow-up-fill" style={{ fontSize: '1.2rem' }}></i>
              <span>{submitting ? 'Submitting…' : ts('submitApp')}</span>
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
      {cameraOpen && (
        <div className="camera-overlay" role="dialog" aria-modal="true" aria-label="Take candidate photo">
          <div className="camera-dialog">
            <div className="camera-dialog-head">
              <h2>Take Candidate Photo</h2>
              <button type="button" className="camera-close" onClick={closeCamera} aria-label="Close camera">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <video ref={videoRef} className="camera-preview" autoPlay playsInline muted />
            <div className="camera-dialog-actions">
              <button type="button" className="btn btn-outline" onClick={closeCamera}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={capturePhoto}>
                <i className="bi bi-camera-fill"></i> Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
