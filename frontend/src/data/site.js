/* Site-wide content data — edit here to update text used across components */

export const BRAND = {
  short: 'SNP',
  name: 'Manpower Services',
  tagline: 'Driver Registration & Placement',
  fullName: 'SNP Manpower & Job Services',
};

export const NAV_LINKS = [
  { label: 'Home', to: '/', icon: 'bi-house-door' },
  { label: 'Driver Registration', to: '/register', icon: 'bi-file-earmark-person' },
];

export const TRUST_POINTS = [
  'WhatsApp-Verified Registration',
  'Instant Registration Reference',
  'Verified Driver Profiles',
];

export const STATS = [
  { value: '12,500+', label: 'Drivers Placed', icon: 'bi-people-fill', tone: 'blue' },
  { value: '480+', label: 'Transport & Fleet Partners', icon: 'bi-building', tone: 'green' },
  { value: '6', label: 'Driver Opportunity Types', icon: 'bi-grid-3x3-gap-fill', tone: 'purple' },
  { value: '96%', label: 'Verified Driver Profiles', icon: 'bi-patch-check-fill', tone: 'amber' },
];

export const FEATURES = [
  {
    icon: 'bi-whatsapp',
    tone: 'green',
    title: 'Secure Driver Verification',
    text: 'Verify your mobile number with a WhatsApp OTP and keep your driver registration linked to a secure, trackable account.',
  },
  {
    icon: 'bi-ui-checks-grid',
    tone: 'blue',
    title: 'Complete Driver Profile',
    text: 'Submit your driving licence, experience, vehicle details, skills and required documents in one convenient registration form.',
  },
  {
    icon: 'bi-speedometer2',
    tone: 'purple',
    title: 'Track Your Registration',
    text: 'Use your reference number to check your registration status and follow updates as your profile is reviewed for suitable driving roles.',
  },
  {
    icon: 'bi-truck',
    tone: 'amber',
    title: 'Driver Placement Support',
    text: 'Connect with suitable driver openings through transport, logistics and fleet employers, with support for placement and onboarding.',
  },
];

export const SECTORS = [
  { icon: 'bi-truck', label: 'Goods Transport' },
  { icon: 'bi-box-seam', label: 'Logistics & Delivery' },
  { icon: 'bi-bus-front', label: 'Passenger Transport' },
  { icon: 'bi-buildings', label: 'Company & Fleet Drivers' },
  { icon: 'bi-gear-wide-connected', label: 'Industrial Drivers' },
  { icon: 'bi-car-front', label: 'Light Motor Vehicles' },
];

export const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Register as a Driver',
    text: 'Complete the driver registration form with your contact details, licence information, experience and preferred work.',
  },
  {
    step: '02',
    title: 'Verify Your Details',
    text: 'Confirm your mobile number with a WhatsApp OTP and receive a reference number to track your registration.',
  },
  {
    step: '03',
    title: 'Profile Review & Role Matching',
    text: 'Your driving profile is reviewed for suitable openings with transport, logistics and fleet employers.',
  },
  {
    step: '04',
    title: 'Placement & Onboarding',
    text: 'Get support as you move into a suitable driving role and complete the employer’s onboarding requirements.',
  },
];
