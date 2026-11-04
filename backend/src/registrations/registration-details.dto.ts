import { BadRequestException } from '@nestjs/common';

export interface RegistrationDetails {
  formDate?: string;
  state?: string;
  regNo?: string;
  mobile?: string;
  policeCertDate?: string;
  policeCertNo?: string;
  photoUrl?: string | null;
  refCandidate?: string;
  refOtherDetail?: string;
  fullName?: string;
  fatherName?: string;
  motherName?: string;
  dob?: string;
  age?: string;
  pan?: string;
  bloodGroup?: string;
  gender?: string;
  nationality?: string;
  religion?: string;
  languages?: string;
  maritalStatus?: string;
  qualification?: string;
  aadhaar?: string;
  hobbies?: string;
  otherSkills?: string;
  jobType?: string;
  designation?: string;
  workExperience?: string;
  hasLicense?: string;
  dlNumber?: string;
  dlValidityDate?: string;
  dlExperience?: string;
  hasBadge?: string;
  badgeNumber?: string;
  badgeDate?: string;
  altMobile1?: string;
  altMobile2?: string;
  altMobile3?: string;
  hasSangha?: string;
  sangha?: string;
  vehicleName?: string;
  vehicleRegNo?: string;
  taxiSeaterType?: string;
  vehicleModel?: string;
  taxiFcNo?: string;
  taxiFcExpiryDate?: string;
  taxiInsuranceNo?: string;
  taxiInsuranceExpiryDate?: string;
  taxiEmissionNo?: string;
  taxiEmissionExpiryDate?: string;
  presentAddress?: string;
  permanentAddress?: string;
  sameAddress?: boolean;
  addressProofUrl?: string | null;
  addressProofName?: string;
  bankProofUrl?: string | null;
  bankProofName?: string;
  employeeBranch?: string;
  employeeMobile?: string;
  employeeName?: string;
  employeeRole?: string;
  registrationFeePaid?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiMobile?: string;
  fam1Name?: string;
  fam1Mobile?: string;
  fam2Name?: string;
  fam2Mobile?: string;
  fam3Name?: string;
  fam3Mobile?: string;
  fam4Name?: string;
  fam4Mobile?: string;
  prevCustomer?: string;
  confirmed?: boolean;
}

const stringFields: Array<keyof RegistrationDetails> = [
  'formDate', 'state', 'regNo', 'mobile', 'policeCertDate', 'policeCertNo',
  'refCandidate', 'refOtherDetail', 'fullName', 'fatherName', 'motherName',
  'dob', 'age', 'pan', 'bloodGroup', 'gender', 'nationality', 'religion',
  'languages', 'maritalStatus', 'qualification', 'aadhaar', 'hobbies',
  'otherSkills', 'jobType', 'designation', 'workExperience', 'hasLicense',
  'dlNumber', 'dlValidityDate', 'dlExperience', 'hasBadge', 'badgeNumber',
  'badgeDate', 'altMobile1', 'altMobile2', 'altMobile3', 'hasSangha',
  'sangha', 'vehicleName', 'vehicleRegNo', 'taxiSeaterType', 'vehicleModel',
  'taxiFcNo', 'taxiFcExpiryDate', 'taxiInsuranceNo', 'taxiInsuranceExpiryDate',
  'taxiEmissionNo', 'taxiEmissionExpiryDate', 'presentAddress',
  'permanentAddress', 'addressProofName', 'bankProofName', 'employeeBranch',
  'employeeMobile', 'employeeName', 'employeeRole', 'registrationFeePaid',
  'bankName', 'accountNumber', 'ifscCode', 'upiMobile', 'fam1Name',
  'fam1Mobile', 'fam2Name', 'fam2Mobile', 'fam3Name', 'fam3Mobile',
  'fam4Name', 'fam4Mobile', 'prevCustomer',
];

const nullableStringFields: Array<keyof RegistrationDetails> = [
  'photoUrl',
  'addressProofUrl',
  'bankProofUrl',
];

export function parseRegistrationDetails(value: unknown): RegistrationDetails {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('registrationData must be an object containing the registration form fields.');
  }

  const details = value as Record<string, unknown>;
  for (const field of stringFields) {
    if (details[field] !== undefined && typeof details[field] !== 'string') {
      throw new BadRequestException(`${field} must be a string.`);
    }
  }
  for (const field of nullableStringFields) {
    if (details[field] !== undefined && details[field] !== null && typeof details[field] !== 'string') {
      throw new BadRequestException(`${field} must be a string or null.`);
    }
  }
  for (const field of ['sameAddress', 'confirmed'] as const) {
    if (details[field] !== undefined && typeof details[field] !== 'boolean') {
      throw new BadRequestException(`${field} must be a boolean.`);
    }
  }

  return details as RegistrationDetails;
}
