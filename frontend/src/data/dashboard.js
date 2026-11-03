/* ============================================================
   Admin Dashboard
   Stat cards + Total Pending Dues + Recent Manpower Applications
   (Demo data — swap with API results when backend is connected)
   ============================================================ */

export const CARDS = [
  { value: 20, label: 'Total Applications', icon: 'bi-file-earmark-person-fill', tone: 'blue' },
  { value: 12, label: 'Paid / Verified Fees', icon: 'bi-cash-coin', tone: 'green' },
  { value: 5, label: 'Pending Payments', icon: 'bi-hourglass-split', tone: 'amber' },
  { value: 3, label: 'Registered Candidates', icon: 'bi-people-fill', tone: 'purple' },
];

export const DUES = { label: 'Total Pending Processing Dues', value: '₹6,050.00' };

export const RECENT = [
  {
    ref: 'SNP-20261103-9920',
    name: 'ANAND RAJ',
    meta: 'MALE | Age: 31',
    mobile: '+91 9988776655',
    filledBy: 'Test Candidate',
    filledByMobile: '+91 9876500001',
    designation: 'CNC MACHINIST',
    dl: 'TN0220160004321',
    vehicleNo: 'TN 02 AB 1234',
    payment: 'Paid',
    feesPaid: '₹2,400',
    feesPending: '₹0',
    date: '03 Nov 2026',
  },
  {
    ref: 'SNP-20261103-7907',
    name: 'ANAND RAJ',
    meta: 'MALE | Age: 31',
    mobile: '+91 9988776655',
    filledBy: 'Test Candidate',
    filledByMobile: '+91 9876500001',
    designation: 'CNC MACHINIST',
    dl: 'TN0220160004321',
    vehicleNo: 'TN 02 AB 1234',
    payment: 'Paid',
    feesPaid: '₹2,400',
    feesPending: '₹0',
    date: '03 Nov 2026',
  },
  {
    ref: 'SNP-20261103-2075',
    name: 'ANAND RAJ',
    meta: 'MALE | Age: 31',
    mobile: '+91 9876500001',
    filledBy: 'Direct / Admin',
    filledByMobile: '',
    designation: 'CNC MACHINIST',
    dl: 'KA0520190001234',
    vehicleNo: '—',
    payment: 'Partial',
    feesPaid: '₹1,300',
    feesPending: '₹1,100',
    date: '03 Nov 2026',
  },
];
