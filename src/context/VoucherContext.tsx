import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  VoucherRecord, 
  CheckRecord, 
  ActivityLog, 
  UserProfile, 
  SystemSettings, 
  DocumentAttachment,
  LogCategory,
  ArchiveVoucher,
  NumberingSettings,
  CheckHistoryRecord,
  StorageLocation,
  ImportLog,
  GlobalSearchResult
} from '../types';
import { 
  INITIAL_VOUCHERS, 
  INITIAL_CHECKS, 
  INITIAL_LOGS, 
  INITIAL_USERS, 
  INITIAL_SETTINGS,
  INITIAL_ARCHIVED_VOUCHERS,
  INITIAL_NUMBERING_SETTINGS,
  INITIAL_STORAGE_LOCATIONS,
  INITIAL_CHECK_HISTORY
} from '../services/mockInitialData';
import { convertAmountToWords } from '../services/numberToWords';
import { useAuth } from './AuthContext';
import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc
} from 'firebase/firestore';
import JSZip from 'jszip';

interface VoucherContextType {
  // Active Vouchers
  vouchers: VoucherRecord[];
  addVoucher: (data: Omit<VoucherRecord, 'id' | 'voucherNumber' | 'documents' | 'createdAt' | 'updatedAt' | 'amountInWords' | 'createdBy'>, customNumber?: string, overrideDuplicate?: boolean) => { voucher: VoucherRecord; warning?: string };
  updateVoucher: (id: string, updates: Partial<VoucherRecord>) => void;
  deleteVoucher: (id: string) => void;
  archiveVoucher: (id: string) => void;
  getVoucherById: (id: string) => VoucherRecord | undefined;

  // Archived Vouchers
  archivedVouchers: ArchiveVoucher[];
  addArchivedVoucher: (data: Omit<ArchiveVoucher, 'id' | 'encodedBy' | 'encodedByName' | 'encodedDate' | 'documents'>, customDocs?: DocumentAttachment[]) => { voucher: ArchiveVoucher; warning?: string };
  updateArchivedVoucher: (id: string, updates: Partial<ArchiveVoucher>) => void;
  deleteArchivedVoucher: (id: string) => void;
  bulkImportArchivedVouchers: (records: Partial<ArchiveVoucher>[]) => { successCount: number; skippedCount: number; errors: string[] };

  // Documents
  addDocumentToVoucher: (voucherId: string, doc: Omit<DocumentAttachment, 'id' | 'uploadedAt' | 'uploadedBy'>) => void;
  deleteDocumentFromVoucher: (voucherId: string, documentId: string) => void;
  addDocumentToArchive: (archiveId: string, doc: Omit<DocumentAttachment, 'id' | 'uploadedAt' | 'uploadedBy'>) => void;
  deleteDocumentFromArchive: (archiveId: string, documentId: string) => void;
  matchAndAttachZipDocuments: (zipFile: File) => Promise<{ matchedCount: number; unmatchedFiles: string[]; totalFiles: number }>;

  // Numbering & Duplicate Checks
  numberingSettings: NumberingSettings;
  updateNumberingSettings: (newSettings: Partial<NumberingSettings>) => void;
  generateNextVoucherNumber: (department?: string) => string;
  checkDuplicateVoucherNumber: (voucherNum: string) => { exists: boolean; location?: 'Active Vouchers' | 'Archived Vouchers' };

  // Checks & History
  checks: CheckRecord[];
  checkHistory: CheckHistoryRecord[];
  recordPrintedCheck: (checkData: {
    voucherId: string;
    checkNumber: string;
    bankName: string;
    memo: string;
    date: string;
    printerName?: string;
  }) => CheckRecord;
  reprintCheck: (checkId: string, reason: string) => void;
  voidCheck: (checkId: string, reason?: string) => void;

  // Activity Logs & Import Audit Logs
  activityLogs: ActivityLog[];
  importLogs: ImportLog[];
  logActivity: (action: string, details: string, category: LogCategory) => void;

  // Storage Locations
  storageLocations: StorageLocation[];
  addStorageLocation: (location: Omit<StorageLocation, 'id' | 'itemCount'>) => void;

  // Users Management
  usersList: UserProfile[];
  addUser: (userData: Omit<UserProfile, 'uid' | 'createdAt'>) => void;
  updateUser: (uid: string, updates: Partial<UserProfile>) => void;
  toggleUserStatus: (uid: string) => void;

  // Settings & Global Search
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  globalSearch: (query: string) => GlobalSearchResult[];
  isFirestoreConnected: boolean;

  // Storage Analytics
  storageAnalytics: {
    totalSizeBytes: number;
    totalDocumentsCount: number;
    averageFileSizeBytes: number;
    largestFiles: { name: string; size: number; voucherNumber: string; url: string }[];
  };
}

const VoucherContext = createContext<VoucherContextType | undefined>(undefined);

// Clear legacy demo cache keys from browser localStorage
if (typeof window !== 'undefined') {
  ['cpvrms_vouchers', 'cpvrms_vouchers_v2', 'cpvrms_archive', 'cpvrms_archive_v2', 'cpvrms_checks', 'cpvrms_checks_v2', 'cpvrms_check_history', 'cpvrms_check_history_v2', 'cpvrms_logs', 'cpvrms_logs_v2', 'cpvrms_locations', 'cpvrms_locations_v2'].forEach(key => {
    localStorage.removeItem(key);
  });
}

const VOUCHERS_KEY = 'cpvrms_vouchers_v3_production';
const ARCHIVE_KEY = 'cpvrms_archive_v3_production';
const CHECKS_KEY = 'cpvrms_checks_v3_production';
const CHECK_HISTORY_KEY = 'cpvrms_check_history_v3_production';
const LOGS_KEY = 'cpvrms_logs_v3_production';
const USERS_KEY = 'cpvrms_users_v3_production';
const SETTINGS_KEY = 'cpvrms_settings_v3_production';
const NUMBERING_KEY = 'cpvrms_numbering_v3_production';
const LOCATIONS_KEY = 'cpvrms_locations_v3_production';

export const VoucherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(false);

  // States with Local Storage fallback
  const [vouchers, setVouchers] = useState<VoucherRecord[]>(() => {
    const saved = localStorage.getItem(VOUCHERS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_VOUCHERS;
  });

  const [archivedVouchers, setArchivedVouchers] = useState<ArchiveVoucher[]>(() => {
    const saved = localStorage.getItem(ARCHIVE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_ARCHIVED_VOUCHERS;
  });

  const [checks, setChecks] = useState<CheckRecord[]>(() => {
    const saved = localStorage.getItem(CHECKS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_CHECKS;
  });

  const [checkHistory, setCheckHistory] = useState<CheckHistoryRecord[]>(() => {
    const saved = localStorage.getItem(CHECK_HISTORY_KEY);
    return saved ? JSON.parse(saved) : INITIAL_CHECK_HISTORY;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem(LOGS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);

  const [usersList, setUsersList] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(USERS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [numberingSettings, setNumberingSettings] = useState<NumberingSettings>(() => {
    const saved = localStorage.getItem(NUMBERING_KEY);
    return saved ? JSON.parse(saved) : INITIAL_NUMBERING_SETTINGS;
  });

  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>(() => {
    const saved = localStorage.getItem(LOCATIONS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_STORAGE_LOCATIONS;
  });

  // Local Storage persistence
  useEffect(() => { localStorage.setItem(VOUCHERS_KEY, JSON.stringify(vouchers)); }, [vouchers]);
  useEffect(() => { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archivedVouchers)); }, [archivedVouchers]);
  useEffect(() => { localStorage.setItem(CHECKS_KEY, JSON.stringify(checks)); }, [checks]);
  useEffect(() => { localStorage.setItem(CHECK_HISTORY_KEY, JSON.stringify(checkHistory)); }, [checkHistory]);
  useEffect(() => { localStorage.setItem(LOGS_KEY, JSON.stringify(activityLogs)); }, [activityLogs]);
  useEffect(() => { localStorage.setItem(USERS_KEY, JSON.stringify(usersList)); }, [usersList]);
  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem(NUMBERING_KEY, JSON.stringify(numberingSettings)); }, [numberingSettings]);
  useEffect(() => { localStorage.setItem(LOCATIONS_KEY, JSON.stringify(storageLocations)); }, [storageLocations]);

  // Firestore Real-Time Subscriptions
  useEffect(() => {
    let unsubscribes: (() => void)[] = [];

    try {
      // 1. Active Vouchers
      const unsubVouchers = onSnapshot(collection(db, 'voucher_records'), (snapshot) => {
        setIsFirestoreConnected(true);
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as VoucherRecord));
          setVouchers(loaded);
        } else {
          setVouchers([]);
        }
      }, (err) => console.warn("Firestore vouchers sub err:", err));
      unsubscribes.push(unsubVouchers);

      // 2. Archive Vouchers
      const unsubArchive = onSnapshot(collection(db, 'archiveVouchers'), (snapshot) => {
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as ArchiveVoucher));
          setArchivedVouchers(loaded);
        } else {
          setArchivedVouchers([]);
        }
      }, (err) => console.warn("Firestore archive sub err:", err));
      unsubscribes.push(unsubArchive);

      // 3. Checks
      const unsubChecks = onSnapshot(collection(db, 'checks'), (snapshot) => {
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as CheckRecord));
          setChecks(loaded);
        } else {
          setChecks([]);
        }
      }, (err) => console.warn("Firestore checks sub err:", err));
      unsubscribes.push(unsubChecks);

      // 4. Check History
      const unsubCheckHistory = onSnapshot(collection(db, 'checkHistory'), (snapshot) => {
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as CheckHistoryRecord));
          setCheckHistory(loaded);
        } else {
          setCheckHistory([]);
        }
      }, (err) => console.warn("Firestore checkHistory sub err:", err));
      unsubscribes.push(unsubCheckHistory);

      // 5. Activity Logs
      const unsubLogs = onSnapshot(collection(db, 'activity_logs'), (snapshot) => {
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as ActivityLog));
          setActivityLogs(loaded.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        } else {
          setActivityLogs([]);
        }
      }, (err) => console.warn("Firestore logs sub err:", err));
      unsubscribes.push(unsubLogs);

      // 6. Settings & Numbering Config
      const unsubSettings = onSnapshot(doc(db, 'settings', 'system_config'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as SystemSettings;
          setSettings(data);
          if (data.numberingSettings) {
            setNumberingSettings(data.numberingSettings);
          }
        } else {
          setDoc(doc(db, 'settings', 'system_config'), { ...INITIAL_SETTINGS, numberingSettings: INITIAL_NUMBERING_SETTINGS }).catch(() => {});
        }
      }, (err) => console.warn("Firestore settings sub err:", err));
      unsubscribes.push(unsubSettings);

      // 7. Users
      const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map(docSnap => ({ uid: docSnap.id, ...docSnap.data() } as UserProfile));
          setUsersList(loaded);
        } else {
          INITIAL_USERS.forEach(u => setDoc(doc(db, 'users', u.uid), u).catch(() => {}));
        }
      }, (err) => console.warn("Firestore users sub err:", err));
      unsubscribes.push(unsubUsers);

      // 8. Storage Locations
      const unsubLocations = onSnapshot(collection(db, 'storageLocations'), (snapshot) => {
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as StorageLocation));
          setStorageLocations(loaded);
        } else {
          setStorageLocations([]);
        }
      }, (err) => console.warn("Firestore locations sub err:", err));
      unsubscribes.push(unsubLocations);

    } catch (err) {
      console.error("Firestore setup error:", err);
    }

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  // Logger helper
  const logActivity = (action: string, details: string, category: LogCategory) => {
    const logId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newLog: ActivityLog = {
      id: logId,
      userId: user?.uid || 'system',
      userName: user?.displayName || 'System User',
      userRole: user?.role || 'staff',
      action,
      details,
      category,
      timestamp: new Date().toISOString()
    };
    setActivityLogs(prev => [newLog, ...prev]);
    setDoc(doc(db, 'activity_logs', logId), newLog).catch(err => console.warn("Log write err:", err));
  };

  // NUMBERING HELPERS & DUPLICATE CHECKING
  const checkDuplicateVoucherNumber = (voucherNum: string): { exists: boolean; location?: 'Active Vouchers' | 'Archived Vouchers' } => {
    const cleanNum = voucherNum.trim().toUpperCase();
    const activeMatch = vouchers.find(v => v.voucherNumber.trim().toUpperCase() === cleanNum);
    if (activeMatch) return { exists: true, location: 'Active Vouchers' };

    const archiveMatch = archivedVouchers.find(a => a.voucherNumber.trim().toUpperCase() === cleanNum);
    if (archiveMatch) return { exists: true, location: 'Archived Vouchers' };

    return { exists: false };
  };

  const generateNextVoucherNumber = (department?: string): string => {
    const currYear = new Date().getFullYear();
    let prefix = numberingSettings.prefix || 'DV-';
    
    if (department && numberingSettings.departmentPrefixes[department]) {
      prefix = numberingSettings.departmentPrefixes[department];
    }

    const yearPart = numberingSettings.includeYear ? `${currYear}-` : '';
    const seqStr = numberingSettings.nextSequence.toString().padStart(numberingSettings.sequenceLength || 6, '0');

    return `${prefix}${yearPart}${seqStr}`;
  };

  const updateNumberingSettings = (newSettings: Partial<NumberingSettings>) => {
    const updated = { ...numberingSettings, ...newSettings };
    setNumberingSettings(updated);
    setDoc(doc(db, 'settings', 'system_config'), { ...settings, numberingSettings: updated }, { merge: true }).catch(() => {});
    logActivity('SETTINGS_UPDATED', 'Updated Voucher Numbering Format Settings', 'NUMBERING');
  };

  // ACTIVE VOUCHERS CRUD
  const addVoucher = (
    data: Omit<VoucherRecord, 'id' | 'voucherNumber' | 'documents' | 'createdAt' | 'updatedAt' | 'amountInWords' | 'createdBy'>,
    customNumber?: string,
    overrideDuplicate?: boolean
  ): { voucher: VoucherRecord; warning?: string } => {
    let assignedNum = customNumber ? customNumber.trim() : generateNextVoucherNumber(data.department);
    let warningMsg: string | undefined;

    const dupCheck = checkDuplicateVoucherNumber(assignedNum);
    if (dupCheck.exists) {
      if (!overrideDuplicate && !isAdmin) {
        throw new Error(`Duplicate Voucher Number "${assignedNum}" already exists in ${dupCheck.location}. Administrator override required.`);
      }
      warningMsg = `Duplicate Voucher Number "${assignedNum}" was detected in ${dupCheck.location}. Overridden by Administrator ${user?.displayName}.`;
      logActivity('NUMBERING_OVERRIDE', warningMsg, 'NUMBERING');
    }

    const amountInWords = convertAmountToWords(data.amount, 'PHP');
    const now = new Date().toISOString();
    const newId = `vch-${Date.now()}`;

    const newVoucher: VoucherRecord = {
      ...data,
      id: newId,
      voucherNumber: assignedNum,
      amountInWords,
      documents: [],
      checkIssued: false,
      createdBy: user?.uid || 'usr-staff-01',
      createdByName: user?.displayName || 'Staff User',
      createdAt: now,
      updatedAt: now
    };

    setVouchers(prev => [newVoucher, ...prev]);
    setDoc(doc(db, 'voucher_records', newId), newVoucher).catch(err => console.warn("Add voucher err:", err));

    // Increment next auto sequence if using auto generated number
    if (!customNumber) {
      updateNumberingSettings({ nextSequence: numberingSettings.nextSequence + 1 });
    }

    logActivity('VOUCHER_CREATED', `Created Voucher Record #${assignedNum} for ${data.payee} (Amount: ₱${data.amount.toLocaleString()})`, 'VOUCHER');
    return { voucher: newVoucher, warning: warningMsg };
  };

  const updateVoucher = (id: string, updates: Partial<VoucherRecord>) => {
    let updatedObj: VoucherRecord | undefined;

    setVouchers(prev => prev.map(v => {
      if (v.id === id) {
        const amountChanged = updates.amount !== undefined && updates.amount !== v.amount;
        const newAmount = amountChanged ? updates.amount! : v.amount;
        const newWords = amountChanged ? convertAmountToWords(newAmount, 'PHP') : v.amountInWords;
        
        updatedObj = {
          ...v,
          ...updates,
          amountInWords: newWords,
          updatedAt: new Date().toISOString()
        };
        return updatedObj;
      }
      return v;
    }));

    if (updatedObj) {
      setDoc(doc(db, 'voucher_records', id), updatedObj, { merge: true }).catch(err => console.warn("Update voucher err:", err));
      logActivity('VOUCHER_UPDATED', `Updated Voucher #${updatedObj.voucherNumber} (${Object.keys(updates).join(', ')})`, 'VOUCHER');
    }
  };

  const deleteVoucher = (id: string) => {
    const target = vouchers.find(v => v.id === id);
    setVouchers(prev => prev.filter(v => v.id !== id));
    deleteDoc(doc(db, 'voucher_records', id)).catch(err => console.warn("Delete voucher err:", err));

    if (target) {
      logActivity('VOUCHER_DELETED', `Deleted Voucher Record #${target.voucherNumber}`, 'VOUCHER');
    }
  };

  const archiveVoucher = (id: string) => {
    updateVoucher(id, { status: 'Archived' });
  };

  const getVoucherById = (id: string) => vouchers.find(v => v.id === id);

  // ARCHIVED VOUCHERS MODULE
  const addArchivedVoucher = (
    data: Omit<ArchiveVoucher, 'id' | 'encodedBy' | 'encodedByName' | 'encodedDate' | 'documents'>,
    customDocs: DocumentAttachment[] = []
  ): { voucher: ArchiveVoucher; warning?: string } => {
    let warningMsg: string | undefined;
    const dupCheck = checkDuplicateVoucherNumber(data.voucherNumber);
    if (dupCheck.exists) {
      warningMsg = `Note: Voucher number "${data.voucherNumber}" already exists in ${dupCheck.location}.`;
    }

    const newId = `arch-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const now = new Date().toISOString();
    const amountInWords = data.amountInWords || convertAmountToWords(data.amount, 'PHP');

    const newArchive: ArchiveVoucher = {
      ...data,
      id: newId,
      amountInWords,
      encodedBy: user?.uid || 'usr-staff-01',
      encodedByName: user?.displayName || 'Staff Encoder',
      encodedDate: now,
      documents: customDocs,
      createdAt: now,
      updatedAt: now
    };

    setArchivedVouchers(prev => [newArchive, ...prev]);
    setDoc(doc(db, 'archiveVouchers', newId), newArchive).catch(err => console.warn("Write archive err:", err));

    logActivity('ARCHIVE_CREATED', `Encoded Historical Paper Voucher Record #${data.voucherNumber} (${data.payee})`, 'ARCHIVE');
    return { voucher: newArchive, warning: warningMsg };
  };

  const updateArchivedVoucher = (id: string, updates: Partial<ArchiveVoucher>) => {
    setArchivedVouchers(prev => prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a));
    setDoc(doc(db, 'archiveVouchers', id), updates, { merge: true }).catch(err => console.warn("Update archive err:", err));
    logActivity('ARCHIVE_UPDATED', `Updated Archived Record ID ${id}`, 'ARCHIVE');
  };

  const deleteArchivedVoucher = (id: string) => {
    if (!isAdmin) {
      throw new Error("Unauthorized: Only Administrators can delete archived records.");
    }
    const target = archivedVouchers.find(a => a.id === id);
    setArchivedVouchers(prev => prev.filter(a => a.id !== id));
    deleteDoc(doc(db, 'archiveVouchers', id)).catch(err => console.warn("Delete archive err:", err));

    if (target) {
      logActivity('ARCHIVE_DELETED', `Deleted Archived Record #${target.voucherNumber}`, 'ARCHIVE');
    }
  };

  const bulkImportArchivedVouchers = (records: Partial<ArchiveVoucher>[]) => {
    let successCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    records.forEach((rec, idx) => {
      try {
        if (!rec.voucherNumber || !rec.payee || !rec.amount) {
          skippedCount++;
          errors.push(`Row ${idx + 2}: Missing required fields (Voucher Number, Payee, or Amount).`);
          return;
        }

        const vNum = rec.voucherNumber.toString().trim();
        const dup = checkDuplicateVoucherNumber(vNum);
        if (dup.exists) {
          skippedCount++;
          errors.push(`Row ${idx + 2}: Duplicate Voucher Number "${vNum}" skipped.`);
          return;
        }

        const newId = `arch-imp-${Date.now()}-${idx}`;
        const amt = Number(rec.amount) || 0;
        const newArch: ArchiveVoucher = {
          id: newId,
          voucherNumber: vNum,
          date: rec.date ? rec.date.toString() : new Date().toISOString().split('T')[0],
          payee: rec.payee.toString().trim(),
          department: rec.department ? rec.department.toString().trim() : 'General Archive',
          amount: amt,
          amountInWords: convertAmountToWords(amt, 'PHP'),
          purpose: rec.purpose ? rec.purpose.toString() : 'Bulk Digitized Record Import',
          description: rec.description ? rec.description.toString() : 'Imported historical voucher record.',
          remarks: rec.remarks ? rec.remarks.toString() : 'Imported via Excel/CSV',
          status: 'Archived',
          encodedBy: user?.uid || 'system-import',
          encodedByName: user?.displayName || 'Excel Bulk Importer',
          encodedDate: new Date().toISOString(),
          year: rec.year || new Date().getFullYear(),
          source: 'Excel Bulk Import',
          createdFrom: rec.createdFrom || 'Bulk Import Spreadsheet',
          storageBox: rec.storageBox || 'BOX-BULK-IMPORT',
          folderNumber: rec.folderNumber || 'FLD-001',
          shelfLocation: rec.shelfLocation || 'Shelf 1',
          physicalReferenceNumber: rec.physicalReferenceNumber || vNum,
          tags: rec.tags ? (Array.isArray(rec.tags) ? (rec.tags as string[]) : String(rec.tags).split(',')) : ['BulkImport'],
          documents: []
        };

        setArchivedVouchers(prev => [newArch, ...prev]);
        setDoc(doc(db, 'archiveVouchers', newId), newArch).catch(() => {});
        successCount++;
      } catch (err: any) {
        skippedCount++;
        errors.push(`Row ${idx + 2}: ${err?.message || 'Error processing record.'}`);
      }
    });

    logActivity('ARCHIVE_IMPORTED', `Bulk imported ${successCount} archived records (${skippedCount} skipped/failed)`, 'IMPORT');
    return { successCount, skippedCount, errors };
  };

  // ATTACHMENT OPERATIONS
  const addDocumentToVoucher = (voucherId: string, docData: Omit<DocumentAttachment, 'id' | 'uploadedAt' | 'uploadedBy'>) => {
    const newDoc: DocumentAttachment = {
      ...docData,
      id: `doc-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user?.displayName || 'Staff User'
    };

    const target = vouchers.find(v => v.id === voucherId);
    if (!target) return;

    updateVoucher(voucherId, { documents: [...target.documents, newDoc] });
    logActivity('DOCUMENT_UPLOADED', `Attached document "${docData.name}" to Active Voucher #${target.voucherNumber}`, 'DOCUMENT');
  };

  const deleteDocumentFromVoucher = (voucherId: string, documentId: string) => {
    if (!isAdmin) {
      throw new Error("Unauthorized: Only Administrators can delete document attachments.");
    }
    const target = vouchers.find(v => v.id === voucherId);
    if (!target) return;

    const docToDelete = target.documents.find(d => d.id === documentId);
    updateVoucher(voucherId, { documents: target.documents.filter(d => d.id !== documentId) });

    if (docToDelete) {
      logActivity('DOCUMENT_DELETED', `Removed attachment "${docToDelete.name}" from Voucher #${target.voucherNumber}`, 'DOCUMENT');
    }
  };

  const addDocumentToArchive = (archiveId: string, docData: Omit<DocumentAttachment, 'id' | 'uploadedAt' | 'uploadedBy'>) => {
    const newDoc: DocumentAttachment = {
      ...docData,
      id: `doc-arch-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: user?.displayName || 'Staff User'
    };

    const target = archivedVouchers.find(a => a.id === archiveId);
    if (!target) return;

    updateArchivedVoucher(archiveId, { documents: [...(target.documents || []), newDoc] });
    logActivity('DOCUMENT_UPLOADED', `Attached document "${docData.name}" to Archived Voucher #${target.voucherNumber}`, 'DOCUMENT');
  };

  const deleteDocumentFromArchive = (archiveId: string, documentId: string) => {
    if (!isAdmin) {
      throw new Error("Unauthorized: Only Administrators can delete document attachments.");
    }
    const target = archivedVouchers.find(a => a.id === archiveId);
    if (!target) return;

    const updated = (target.documents || []).filter(d => d.id !== documentId);
    updateArchivedVoucher(archiveId, { documents: updated });
    logActivity('DOCUMENT_DELETED', `Deleted attachment from Archived Voucher #${target.voucherNumber}`, 'DOCUMENT');
  };

  // BULK DOCUMENT MATCHING (ZIP IMPORT)
  const matchAndAttachZipDocuments = async (zipFile: File): Promise<{ matchedCount: number; unmatchedFiles: string[]; totalFiles: number }> => {
    const arrayBuffer = await zipFile.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    let matchedCount = 0;
    const unmatchedFiles: string[] = [];
    const files = Object.keys(zip.files).filter(filename => !zip.files[filename].dir && !filename.startsWith('__MACOSX'));

    for (const filename of files) {
      const cleanFileName = filename.split('/').pop() || filename;
      const nameWithoutExt = cleanFileName.replace(/\.[^/.]+$/, '').trim().toUpperCase();

      // Find matching voucher number in active or archived vouchers
      const activeMatch = vouchers.find(v => nameWithoutExt.includes(v.voucherNumber.trim().toUpperCase()) || v.voucherNumber.trim().toUpperCase().includes(nameWithoutExt));
      const archiveMatch = !activeMatch ? archivedVouchers.find(a => nameWithoutExt.includes(a.voucherNumber.trim().toUpperCase()) || a.voucherNumber.trim().toUpperCase().includes(nameWithoutExt)) : undefined;

      if (activeMatch || archiveMatch) {
        const fileData = await zip.files[filename].async('base64');
        const fileExt = cleanFileName.split('.').pop()?.toLowerCase() || 'png';
        const mimeType = fileExt === 'pdf' ? 'application/pdf' : `image/${fileExt}`;
        const dataUrl = `data:${mimeType};base64,${fileData}`;

        const docAttachment: Omit<DocumentAttachment, 'id' | 'uploadedAt' | 'uploadedBy'> = {
          name: cleanFileName,
          size: fileData.length,
          type: mimeType,
          url: dataUrl
        };

        if (activeMatch) {
          addDocumentToVoucher(activeMatch.id, docAttachment);
        } else if (archiveMatch) {
          addDocumentToArchive(archiveMatch.id, docAttachment);
        }
        matchedCount++;
      } else {
        unmatchedFiles.push(cleanFileName);
      }
    }

    logActivity('DOCUMENT_UPLOADED', `Bulk ZIP import processed ${files.length} files (${matchedCount} auto-matched to vouchers, ${unmatchedFiles.length} unmatched)`, 'DOCUMENT');
    return { matchedCount, unmatchedFiles, totalFiles: files.length };
  };

  // CHECK PRINTING & REPRINT HISTORY
  const recordPrintedCheck = (checkData: {
    voucherId: string;
    checkNumber: string;
    bankName: string;
    memo: string;
    date: string;
    printerName?: string;
  }): CheckRecord => {
    const voucher = getVoucherById(checkData.voucherId);
    if (!voucher) throw new Error("Voucher record not found.");

    const checkId = `chk-${Date.now()}`;
    const newCheck: CheckRecord = {
      id: checkId,
      checkNumber: checkData.checkNumber,
      voucherId: voucher.id,
      voucherNumber: voucher.voucherNumber,
      date: checkData.date,
      payee: voucher.payee,
      amount: voucher.amount,
      amountInWords: voucher.amountInWords,
      memo: checkData.memo || `Disbursal for Voucher #${voucher.voucherNumber}`,
      bankName: checkData.bankName || settings.defaultBankName,
      status: 'Printed',
      printedBy: user?.uid || 'usr-staff-01',
      printedByName: user?.displayName || 'Staff User',
      printedAt: new Date().toISOString()
    };

    setChecks(prev => [newCheck, ...prev]);
    setDoc(doc(db, 'checks', checkId), newCheck).catch(() => {});

    // Add entry to detailed check History
    const historyId = `chkh-${Date.now()}`;
    const historyRec: CheckHistoryRecord = {
      id: historyId,
      voucherNumber: voucher.voucherNumber,
      checkNumber: checkData.checkNumber,
      printedBy: user?.uid || 'usr-staff-01',
      printedByName: user?.displayName || 'Staff User',
      printedDate: new Date().toISOString(),
      printerName: checkData.printerName || 'Standard Office Printer',
      alignmentVersion: 'v1.2 Standard Alignment',
      bank: checkData.bankName || settings.defaultBankName,
      cancelled: false,
      reprinted: false,
      printCount: 1
    };

    setCheckHistory(prev => [historyRec, ...prev]);
    setDoc(doc(db, 'checkHistory', historyId), historyRec).catch(() => {});

    updateVoucher(voucher.id, { checkIssued: true, checkNumber: checkData.checkNumber, status: 'Approved' });
    logActivity('CHECK_PRINTED', `Printed Check #${checkData.checkNumber} for Voucher #${voucher.voucherNumber} (₱${voucher.amount.toLocaleString()})`, 'CHECK');

    return newCheck;
  };

  const reprintCheck = (checkId: string, reason: string) => {
    const check = checks.find(c => c.id === checkId);
    if (!check) return;

    const historyId = `chkh-${Date.now()}`;
    const historyRec: CheckHistoryRecord = {
      id: historyId,
      voucherNumber: check.voucherNumber,
      checkNumber: check.checkNumber,
      printedBy: user?.uid || 'usr-staff-01',
      printedByName: user?.displayName || 'Staff User',
      printedDate: new Date().toISOString(),
      printerName: 'Standard Office Printer',
      alignmentVersion: 'v1.2 Standard Alignment',
      bank: check.bankName,
      cancelled: false,
      reprinted: true,
      reason: reason || 'Reprint request',
      printCount: 2
    };

    setCheckHistory(prev => [historyRec, ...prev]);
    setDoc(doc(db, 'checkHistory', historyId), historyRec).catch(() => {});

    logActivity('CHECK_PRINTED', `Reprinted Check #${check.checkNumber} for Voucher #${check.voucherNumber} (Reason: ${reason})`, 'CHECK');
  };

  const voidCheck = (checkId: string, reason?: string) => {
    setChecks(prev => prev.map(c => c.id === checkId ? { ...c, status: 'Void' } : c));
    updateDoc(doc(db, 'checks', checkId), { status: 'Void' }).catch(() => {});

    const target = checks.find(c => c.id === checkId);
    if (target) {
      logActivity('CHECK_VOIDED', `Voided Check #${target.checkNumber} ${reason ? `(Reason: ${reason})` : ''}`, 'CHECK');
    }
  };

  // STORAGE LOCATIONS
  const addStorageLocation = (loc: Omit<StorageLocation, 'id' | 'itemCount'>) => {
    const newId = `loc-${Date.now()}`;
    const newLoc: StorageLocation = { ...loc, id: newId, itemCount: 0 };
    setStorageLocations(prev => [...prev, newLoc]);
    setDoc(doc(db, 'storageLocations', newId), newLoc).catch(() => {});
    logActivity('SETTINGS_UPDATED', `Added physical storage box location "${loc.boxName}"`, 'SETTINGS');
  };

  // USERS MANAGEMENT
  const addUser = (userData: Omit<UserProfile, 'uid' | 'createdAt'>) => {
    const newUid = `usr-${Date.now()}`;
    const newUser: UserProfile = { ...userData, uid: newUid, createdAt: new Date().toISOString() };
    setUsersList(prev => [...prev, newUser]);
    setDoc(doc(db, 'users', newUid), newUser).catch(() => {});
    logActivity('USER_CREATED', `Created user account for ${userData.displayName} (${userData.role})`, 'USER');
  };

  const updateUser = (uid: string, updates: Partial<UserProfile>) => {
    setUsersList(prev => prev.map(u => u.uid === uid ? { ...u, ...updates } : u));
    setDoc(doc(db, 'users', uid), updates, { merge: true }).catch(() => {});
    logActivity('USER_UPDATED', `Updated account credentials for ${uid}`, 'USER');
  };

  const toggleUserStatus = (uid: string) => {
    setUsersList(prev => prev.map(u => {
      if (u.uid === uid) {
        const nextStatus = u.status === 'active' ? 'disabled' : 'active';
        setDoc(doc(db, 'users', uid), { status: nextStatus }, { merge: true }).catch(() => {});
        logActivity('USER_STATUS_CHANGED', `Changed status for ${u.displayName} to ${nextStatus.toUpperCase()}`, 'USER');
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  // SETTINGS
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    const updated = { ...settings, ...newSettings, updatedAt: new Date().toISOString() };
    setSettings(updated);
    setDoc(doc(db, 'settings', 'system_config'), updated, { merge: true }).catch(() => {});
    logActivity('SETTINGS_UPDATED', 'Updated check printing alignment & system preferences', 'SETTINGS');
  };

  // GLOBAL ADVANCED SEARCH
  const globalSearch = (query: string): GlobalSearchResult[] => {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim().toLowerCase();
    const results: GlobalSearchResult[] = [];

    // 1. Search Active Vouchers
    vouchers.forEach(v => {
      let matchedField = '';
      if (v.voucherNumber.toLowerCase().includes(q)) matchedField = 'Voucher Number';
      else if (v.payee.toLowerCase().includes(q)) matchedField = 'Payee';
      else if (v.department.toLowerCase().includes(q)) matchedField = 'Department';
      else if (v.particulars.toLowerCase().includes(q)) matchedField = 'Particulars';
      else if (v.amount.toString().includes(q)) matchedField = 'Amount';

      if (matchedField) {
        results.push({
          type: 'voucher',
          id: v.id,
          title: `Active Voucher #${v.voucherNumber}`,
          subtitle: `${v.payee} — ₱${v.amount.toLocaleString()}`,
          voucherNumber: v.voucherNumber,
          date: v.date,
          amount: v.amount,
          department: v.department,
          matchedField,
          data: v
        });
      }
    });

    // 2. Search Archived Vouchers
    archivedVouchers.forEach(a => {
      let matchedField = '';
      if (a.voucherNumber.toLowerCase().includes(q)) matchedField = 'Voucher Number';
      else if (a.payee.toLowerCase().includes(q)) matchedField = 'Payee';
      else if (a.department.toLowerCase().includes(q)) matchedField = 'Department';
      else if (a.purpose.toLowerCase().includes(q)) matchedField = 'Purpose';
      else if (a.description.toLowerCase().includes(q)) matchedField = 'Description';
      else if (a.storageBox.toLowerCase().includes(q)) matchedField = 'Storage Box';
      else if (a.tags?.some(t => t.toLowerCase().includes(q))) matchedField = 'Tag';

      if (matchedField) {
        results.push({
          type: 'archive',
          id: a.id,
          title: `Archived Record #${a.voucherNumber}`,
          subtitle: `${a.payee} — ₱${a.amount.toLocaleString()} (${a.storageBox})`,
          voucherNumber: a.voucherNumber,
          date: a.date,
          amount: a.amount,
          department: a.department,
          matchedField,
          data: a
        });
      }
    });

    // 3. Search Printed Checks
    checks.forEach(c => {
      let matchedField = '';
      if (c.checkNumber.toLowerCase().includes(q)) matchedField = 'Check Number';
      else if (c.voucherNumber.toLowerCase().includes(q)) matchedField = 'Voucher Number';
      else if (c.payee.toLowerCase().includes(q)) matchedField = 'Payee';
      else if (c.bankName.toLowerCase().includes(q)) matchedField = 'Bank';

      if (matchedField) {
        results.push({
          type: 'check',
          id: c.id,
          title: `Printed Check #${c.checkNumber}`,
          subtitle: `${c.payee} — ₱${c.amount.toLocaleString()} (${c.bankName})`,
          voucherNumber: c.voucherNumber,
          date: c.date,
          amount: c.amount,
          matchedField,
          data: c
        });
      }
    });

    // 4. Search Supporting Documents
    const allAttachments: { doc: DocumentAttachment; vNum: string; source: string }[] = [];
    vouchers.forEach(v => v.documents.forEach(d => allAttachments.push({ doc: d, vNum: v.voucherNumber, source: 'Active Voucher' })));
    archivedVouchers.forEach(a => (a.documents || []).forEach(d => allAttachments.push({ doc: d, vNum: a.voucherNumber, source: 'Archived Record' })));

    allAttachments.forEach(({ doc: d, vNum, source }) => {
      if (d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q)) {
        results.push({
          type: 'document',
          id: d.id,
          title: `Document: ${d.name}`,
          subtitle: `Attached to ${source} #${vNum} (${(d.size/1024).toFixed(1)} KB)`,
          voucherNumber: vNum,
          date: d.uploadedAt.split('T')[0],
          matchedField: 'File Name',
          data: d
        });
      }
    });

    return results;
  };

  // STORAGE ANALYTICS CALCULATIONS
  const storageAnalytics = useMemo(() => {
    let totalSizeBytes = 0;
    let totalDocumentsCount = 0;
    const filesList: { name: string; size: number; voucherNumber: string; url: string }[] = [];

    vouchers.forEach(v => {
      v.documents.forEach(d => {
        totalSizeBytes += d.size || 0;
        totalDocumentsCount++;
        filesList.push({ name: d.name, size: d.size || 0, voucherNumber: v.voucherNumber, url: d.url });
      });
    });

    archivedVouchers.forEach(a => {
      (a.documents || []).forEach(d => {
        totalSizeBytes += d.size || 0;
        totalDocumentsCount++;
        filesList.push({ name: d.name, size: d.size || 0, voucherNumber: a.voucherNumber, url: d.url });
      });
    });

    filesList.sort((a, b) => b.size - a.size);

    return {
      totalSizeBytes,
      totalDocumentsCount,
      averageFileSizeBytes: totalDocumentsCount > 0 ? Math.round(totalSizeBytes / totalDocumentsCount) : 0,
      largestFiles: filesList.slice(0, 5)
    };
  }, [vouchers, archivedVouchers]);

  return (
    <VoucherContext.Provider
      value={{
        vouchers,
        addVoucher,
        updateVoucher,
        deleteVoucher,
        archiveVoucher,
        getVoucherById,
        archivedVouchers,
        addArchivedVoucher,
        updateArchivedVoucher,
        deleteArchivedVoucher,
        bulkImportArchivedVouchers,
        addDocumentToVoucher,
        deleteDocumentFromVoucher,
        addDocumentToArchive,
        deleteDocumentFromArchive,
        matchAndAttachZipDocuments,
        numberingSettings,
        updateNumberingSettings,
        generateNextVoucherNumber,
        checkDuplicateVoucherNumber,
        checks,
        checkHistory,
        recordPrintedCheck,
        reprintCheck,
        voidCheck,
        activityLogs,
        importLogs,
        logActivity,
        storageLocations,
        addStorageLocation,
        usersList,
        addUser,
        updateUser,
        toggleUserStatus,
        settings,
        updateSettings,
        globalSearch,
        isFirestoreConnected,
        storageAnalytics
      }}
    >
      {children}
    </VoucherContext.Provider>
  );
};

export const useVoucher = () => {
  const context = useContext(VoucherContext);
  if (!context) {
    throw new Error('useVoucher must be used within a VoucherProvider');
  }
  return context;
};
