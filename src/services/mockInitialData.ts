import { VoucherRecord, CheckRecord, ActivityLog, UserProfile, SystemSettings, ArchiveVoucher, NumberingSettings, StorageLocation, CheckHistoryRecord } from '../types';

export const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'usr-admin-01',
    email: 'admin@office.gov.ph',
    displayName: 'Government Administrator',
    role: 'admin',
    department: 'Executive / Finance Division',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  },
  {
    uid: 'usr-staff-01',
    email: 'staff@office.gov.ph',
    displayName: 'Disbursement Officer',
    role: 'staff',
    department: 'Accounting & Disbursement',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  }
];

export const INITIAL_ARCHIVED_VOUCHERS: ArchiveVoucher[] = [];

export const INITIAL_NUMBERING_SETTINGS: NumberingSettings = {
  mode: 'hybrid',
  prefix: 'DV-',
  departmentPrefixes: {
    'Administrative Services': 'ADM-',
    'Accounting & Disbursement': 'DV-',
    'Operations': 'OPS-',
    'Human Resource Management': 'HR-',
    'Facilities & Security': 'FAC-',
    'Infrastructure & Public Works': 'PW-',
    'Information Technology': 'IT-'
  },
  includeYear: true,
  sequenceLength: 6,
  nextSequence: 1, // Start from 000001
  allowDuplicateWithOverride: true
};

export const INITIAL_STORAGE_LOCATIONS: StorageLocation[] = [];

export const INITIAL_CHECK_HISTORY: CheckHistoryRecord[] = [];

export const INITIAL_VOUCHERS: VoucherRecord[] = [];

export const INITIAL_CHECKS: CheckRecord[] = [];

export const INITIAL_LOGS: ActivityLog[] = [];

export const INITIAL_SETTINGS: SystemSettings = {
  id: 'system_settings',
  companyName: 'Government Office - Disbursement & Accounting Division',
  companyAddress: 'Government Center, Main Administrative Building',
  companyPhone: '(02) 8900-1000',
  defaultBankName: 'Land Bank of the Philippines',
  checkAlignment: {
    checkWidthMm: 210,
    checkHeightMm: 95,
    dateX: 162,
    dateY: 14,
    payeeX: 25,
    payeeY: 28,
    amountNumX: 160,
    amountNumY: 28,
    amountWordsLine1X: 25,
    amountWordsLine1Y: 38,
    amountWordsLine2X: 25,
    amountWordsLine2Y: 46,
    memoX: 25,
    memoY: 65,
    showGridLines: false,
    fontSizePt: 10,
    fontFamily: 'Courier New, monospace'
  },
  updatedAt: new Date().toISOString()
};
