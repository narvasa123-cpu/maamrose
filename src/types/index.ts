export type UserRole = 'admin' | 'staff';
export type UserStatus = 'active' | 'disabled';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department?: string;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string;
}

export type VoucherStatus = 'Draft' | 'Pending' | 'Approved' | 'Archived';

export interface DocumentAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface VoucherRecord {
  id: string;
  voucherNumber: string;
  date: string;
  payee: string;
  department: string;
  particulars: string;
  amount: number;
  amountInWords: string;
  remarks?: string;
  status: VoucherStatus;
  documents: DocumentAttachment[];
  checkIssued?: boolean;
  checkNumber?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export type CheckStatus = 'Printed' | 'Void' | 'Cancelled';

export interface CheckRecord {
  id: string;
  checkNumber: string;
  voucherId: string;
  voucherNumber: string;
  date: string;
  payee: string;
  amount: number;
  amountInWords: string;
  memo: string;
  bankName: string;
  accountNumber?: string;
  status: CheckStatus;
  printedBy: string;
  printedByName?: string;
  printedAt: string;
}

export type LogCategory = 'AUTH' | 'VOUCHER' | 'CHECK' | 'DOCUMENT' | 'USER' | 'SETTINGS' | 'ARCHIVE' | 'IMPORT' | 'NUMBERING';

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  category: LogCategory;
  timestamp: string;
  ipAddress?: string;
}

export interface ArchiveVoucher {
  id: string;
  voucherNumber: string;
  date: string;
  payee: string;
  department: string;
  amount: number;
  amountInWords: string;
  purpose: string;
  description: string;
  remarks?: string;
  status: 'Archived' | 'Approved' | 'Paid' | 'Closed';
  encodedBy: string;
  encodedByName?: string;
  encodedDate: string;
  year: number | string;
  source: string;
  createdFrom: string;
  storageBox: string;
  folderNumber: string;
  shelfLocation: string;
  physicalReferenceNumber: string;
  tags: string[];
  documents: DocumentAttachment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface NumberingSettings {
  mode: 'manual' | 'auto' | 'hybrid';
  prefix: string;
  departmentPrefixes: Record<string, string>;
  includeYear: boolean;
  sequenceLength: number;
  nextSequence: number;
  allowDuplicateWithOverride: boolean;
}

export interface CheckHistoryRecord {
  id: string;
  voucherNumber: string;
  checkNumber: string;
  printedBy: string;
  printedByName?: string;
  printedDate: string;
  printerName?: string;
  alignmentVersion?: string;
  bank: string;
  cancelled: boolean;
  reprinted: boolean;
  reason?: string;
  printCount: number;
}

export interface ImportLog {
  id: string;
  fileName: string;
  importedAt: string;
  importedBy: string;
  totalRows: number;
  successCount: number;
  skippedCount: number;
  errorCount: number;
  errorDetails: string[];
}

export interface StorageLocation {
  id: string;
  boxName: string;
  shelf: string;
  room: string;
  capacity: number;
  itemCount: number;
}

export interface GlobalSearchResult {
  type: 'voucher' | 'archive' | 'check' | 'document';
  id: string;
  title: string;
  subtitle: string;
  voucherNumber: string;
  date: string;
  amount?: number;
  department?: string;
  matchedField: string;
  data: any;
}

export interface CheckAlignmentConfig {
  checkWidthMm: number;
  checkHeightMm: number;
  dateX: number;
  dateY: number;
  payeeX: number;
  payeeY: number;
  amountNumX: number;
  amountNumY: number;
  amountWordsLine1X: number;
  amountWordsLine1Y: number;
  amountWordsLine2X: number;
  amountWordsLine2Y: number;
  memoX: number;
  memoY: number;
  showGridLines: boolean;
  fontSizePt: number;
  fontFamily: string;
}

export interface WordCheckTemplate {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
  base64Data?: string; // Stored docx template file as base64 string
  detectedTags: string[];
  fieldMappings: {
    check_number?: string;
    date?: string;
    payee?: string;
    amount?: string;
    amount_in_words?: string;
    bank_name?: string;
    memo?: string;
    voucher_number?: string;
    [customTag: string]: string | undefined;
  };
  isDefault?: boolean;
}

export interface SystemSettings {
  id: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  defaultBankName: string;
  checkAlignment: CheckAlignmentConfig;
  savedWordTemplates?: WordCheckTemplate[];
  activeWordTemplateId?: string;
  numberingSettings?: NumberingSettings;
  updatedAt: string;
}
