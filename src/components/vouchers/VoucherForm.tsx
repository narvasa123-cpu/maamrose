import React, { useState, useEffect } from 'react';
import { VoucherRecord } from '../../types';
import { convertAmountToWords } from '../../services/numberToWords';
import { DollarSign, FileText, Building, Calendar, Tag } from 'lucide-react';

interface VoucherFormProps {
  initialValues?: VoucherRecord | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const DEPARTMENTS = [
  'Administrative Services',
  'Accounting & Disbursement',
  'Executive / Finance',
  'Operations',
  'Facilities & Security',
  'Information Technology',
  'Procurement',
  'Human Resources',
  'Logistics & Freight'
];

export const VoucherForm: React.FC<VoucherFormProps> = ({
  initialValues,
  onSubmit,
  onCancel
}) => {
  const [payee, setPayee] = useState(initialValues?.payee || '');
  const [department, setDepartment] = useState(initialValues?.department || DEPARTMENTS[0]);
  const [date, setDate] = useState(initialValues?.date || new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number | ''>(initialValues?.amount ?? '');
  const [particulars, setParticulars] = useState(initialValues?.particulars || '');
  const [remarks, setRemarks] = useState(initialValues?.remarks || '');
  const [status, setStatus] = useState<any>(initialValues?.status || 'Draft');

  const [wordsPreview, setWordsPreview] = useState('');

  useEffect(() => {
    const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount as string) || 0;
    setWordsPreview(convertAmountToWords(numericAmount, 'PHP'));
  }, [amount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount as string) || 0;
    
    if (!payee.trim() || numericAmount <= 0 || !particulars.trim()) {
      alert("Please fill in all required fields (Payee, Valid Amount, Particulars).");
      return;
    }

    onSubmit({
      payee: payee.trim(),
      department,
      date,
      amount: numericAmount,
      particulars: particulars.trim(),
      remarks: remarks.trim(),
      status
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Payee & Date */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
            <span>Payee / Beneficiary Name</span>
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Acme Office Supplies Inc."
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Voucher Date</span>
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Department & Amount */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>Department</span>
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            <span>Disbursement Amount (₱)</span>
            <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Realtime Amount in Words Banner */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60 text-xs">
        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-0.5">
          Auto Amount in Words (Check Text Preview):
        </p>
        <p className="font-mono font-bold text-blue-900 dark:text-blue-200 tracking-tight">
          {wordsPreview}
        </p>
      </div>

      {/* Particulars */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>Particulars / Payment Details</span>
          <span className="text-rose-500">*</span>
        </label>
        <textarea
          rows={3}
          required
          placeholder="Detailed description of invoice, PO items, services rendered..."
          value={particulars}
          onChange={(e) => setParticulars(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Remarks & Initial Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Internal Remarks / Audit Notes
          </label>
          <input
            type="text"
            placeholder="e.g. PO #8812 approved by Manager"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>Workflow Status</span>
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="Draft">Draft</option>
            <option value="Pending">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
        >
          {initialValues ? 'Save Voucher Updates' : 'Create Voucher Record'}
        </button>
      </div>
    </form>
  );
};
