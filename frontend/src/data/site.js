/* Site-wide content data — edit here to update text used across components */

export const BRAND = {
  short: 'SNP',
  name: 'Manpower Services',
  tagline: 'Workforce & Recruitment Solutions',
  fullName: 'SNP Manpower & Job Services',
};

export const NAV_LINKS = [
  { label: 'Home', to: '/', icon: 'bi-house-door' },
  { label: 'Registration Form', to: '/register', icon: 'bi-file-earmark-person' },
];

export const TRUST_POINTS = [
  '100% WhatsApp Verified',
  'Instant Reference Code',
  'Verified Candidate Database',
];

export const STATS = [
  { value: '12,500+', label: 'Candidates Placed', icon: 'bi-people-fill', tone: 'blue' },
  { value: '480+', label: 'Hiring Partners', icon: 'bi-building', tone: 'green' },
  { value: '22', label: 'Industry Sectors', icon: 'bi-grid-3x3-gap-fill', tone: 'purple' },
  { value: '96%', label: 'Verified Profiles', icon: 'bi-patch-check-fill', tone: 'amber' },
];

export const FEATURES = [
  {
    icon: 'bi-whatsapp',
    tone: 'green',
    title: 'WhatsApp OTP Authentication',
    text: 'Log in effortlessly with your 10-digit mobile number. Cryptographically generated 6-digit OTPs delivered straight to WhatsApp — no passwords to remember, no email chains.',
  },
  {
    icon: 'bi-ui-checks-grid',
    tone: 'blue',
    title: 'Complete Manpower Dossier',
    text: 'Personal details, driving licence, vehicle information, bank accounts, family background, skills and address proofs — captured in one intuitive, responsive registration form.',
  },
  {
    icon: 'bi-speedometer2',
    tone: 'purple',
    title: 'Enterprise Admin Panel',
    text: 'A powerful administrative dashboard with candidate search and filters, payment tracking, printable interview dossiers, user permissions and notification audit trails.',
  },
  {
    icon: 'bi-mic-fill',
    tone: 'amber',
    title: 'Direct Interview Drives',
    text: 'Skip endless resume rounds. Candidates shortlisted by our recruiters face hiring managers directly — walk-in drives scheduled every week across our partner network.',
  },
];

export const SECTORS = [
  { icon: 'bi-gear-wide-connected', label: 'Industrial' },
  { icon: 'bi-tools', label: 'Manufacturing' },
  { icon: 'bi-briefcase-fill', label: 'Corporate' },
  { icon: 'bi-truck', label: 'Logistics' },
  { icon: 'bi-ev-front-fill', label: 'Automotive' },
  { icon: 'bi-shop-window', label: 'Retail & FMCG' },
];

export const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Register Your Dossier',
    text: 'Fill the manpower registration form and receive an instant reference code like SNP-20261103-1042.',
  },
  {
    step: '02',
    title: 'WhatsApp Verification',
    text: 'Verify your mobile number via WhatsApp OTP and log in anytime to track or update your application.',
  },
  {
    step: '03',
    title: 'Shortlist & Interview',
    text: 'Our recruiters match your skills with open requirements and schedule direct interviews at partner sites.',
  },
  {
    step: '04',
    title: 'Placement & Support',
    text: 'Get placed with verified employers, with salary processing, ESIC/PF support and document assistance.',
  },
];
