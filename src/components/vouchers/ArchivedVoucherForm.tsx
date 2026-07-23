import React, { useState } from 'react';
import { X, Save, Upload, AlertTriangle, FileText, Tag, Archive } from 'lucide-react';
import { useVoucher } from '../../context/VoucherContext';
import { ArchiveVoucher, DocumentAttachment } from '../../types';

interface ArchivedVoucherFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ArchivedVoucherForm: React.FC<ArchivedVoucherFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const { addArchivedVoucher, checkDuplicateVoucherNumber, storageLocations } = useVoucher();

  const [formData, setFormData] = useState({
    voucherNumber: '',
    date: new Date().toISOString().split('T')[0],
    payee: '',
    department: 'Accounting & Disbursement',
    amount: '',
    purpose: '',
    description: '',
    remarks: '',
    year: new Date().getFullYear().toString(),
    source: 'Digitized Paper Records',
    createdFrom: 'Paper Disbursement Voucher',
    storageBox: 'BOX-2024-PW-012',
    folderNumber: 'FLD-001',
    shelfLocation: 'Rack 1 - Shelf A',
    physicalReferenceNumber: '',
    tags: 'Archive, Historical'
  });

  const [warning, setWarning] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<DocumentAttachment[]>([]);

  if (!isOpen) return null;

  const handleVoucherNumChange = (val: string) => {
    setFormData(prev => ({ ...prev, voucherNumber: val }));
    if (val.trim()) {
      const dup = checkDuplicateVoucherNumber(val.trim());
      if (dup.exists) {
        setWarning(`Warning: Voucher Number "${val.trim()}" already exists in ${dup.location}.`);
      } else {
        setWarning(null);
      }
    } else {
      setWarning(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    (Array.from(files) as File[]).forEach((file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds maximum allowed 10MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const newAttachment: DocumentAttachment = {
          id: `doc-${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/pdf',
          url: uploadEvent.target?.result as string,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'Encoder'
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.voucherNumber.trim() || !formData.payee.trim() || !formData.amount) {
      alert("Please fill in all mandatory fields: Voucher Number, Payee, and Amount.");
      return;
    }

    const numAmt = parseFloat(formData.amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      alert("Please enter a valid positive numeric amount.");
      return;
    }

    const tagsArray = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    addArchivedVoucher({
      voucherNumber: formData.voucherNumber.trim().toUpperCase(),
      date: formData.date,
      payee: formData.payee.trim(),
      department: formData.department,
      amount: numAmt,
      amountInWords: '',
      purpose: formData.purpose || 'Historical Voucher Digitization',
      description: formData.description || 'Digitized paper record.',
      remarks: formData.remarks,
      status: 'Archived',
      year: parseInt(formData.year) || new Date().getFullYear(),
      source: formData.source,
      createdFrom: formData.createdFrom,
      storageBox: formData.storageBox,
      folderNumber: formData.folderNumber,
      shelfLocation: formData.shelfLocation,
      physicalReferenceNumber: formData.physicalReferenceNumber || formData.voucherNumber,
      tags: tagsArray
    }, attachments);

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Digitize Historical Paper Voucher</h2>
              <p className="text-xs text-gray-500">Encode paper voucher archive for legal compliance and searchability</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Duplicate Warning Alert */}
          {warning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-2 text-amber-800">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
              <span className="font-medium">{warning}</span>
            </div>
          )}

          {/* Section 1: Basic Paper Voucher Metadata */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Basic Voucher Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Voucher Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DV-2024-000842"
                  value={formData.voucherNumber}
                  onChange={(e) => handleVoucherNumChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Voucher Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value, year: new Date(e.target.value).getFullYear().toString() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Department / Office <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="Accounting & Disbursement">Accounting & Disbursement</option>
                  <option value="Administrative Services">Administrative Services</option>
                  <option value="Operations">Operations</option>
                  <option value="Human Resource Management">Human Resource Management</option>
                  <option value="Facilities & Security">Facilities & Security</option>
                  <option value="Infrastructure & Public Works">Infrastructure & Public Works</option>
                  <option value="Information Technology">Information Technology</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-gray-700 mb-1">
                  Payee / Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter vendor, contractor, or employee payee name"
                  value={formData.payee}
                  onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Amount (PHP ₱) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Purpose & Description */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Purpose & Particulars</span>
            </h3>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Payment Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Progress Billing #3 for Renovation Project"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Description / Particulars Details</label>
                <textarea
                  rows={2}
                  placeholder="Detailed breakdown of goods, work completed, or services rendered..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Physical Storage Location & Filing Metadata */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100 flex items-center space-x-2">
              <Archive className="w-4 h-4 text-purple-600" />
              <span>Physical Storage & Archival Tracking</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Storage Box ID</label>
                <input
                  type="text"
                  placeholder="e.g. BOX-2024-PW-012"
                  value={formData.storageBox}
                  onChange={(e) => setFormData({ ...formData, storageBox: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Folder Number</label>
                <input
                  type="text"
                  placeholder="e.g. FLD-045"
                  value={formData.folderNumber}
                  onChange={(e) => setFormData({ ...formData, folderNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Shelf Location</label>
                <input
                  type="text"
                  placeholder="e.g. Rack 4 - Shelf B"
                  value={formData.shelfLocation}
                  onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Physical Ref #</label>
                <input
                  type="text"
                  placeholder="e.g. COA-2024-PW-0842"
                  value={formData.physicalReferenceNumber}
                  onChange={(e) => setFormData({ ...formData, physicalReferenceNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Tags & Supporting Documents */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 pb-1 border-b border-gray-100 flex items-center space-x-2">
              <Tag className="w-4 h-4 text-blue-600" />
              <span>Tags & Digital Scanned Documents</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Search Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="Infrastructure, Renovation, Capital Expense, Audit"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Attach Scanned Documents (PDF, JPG, PNG)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-gray-700">Click or drag & drop scanned supporting documents</p>
                  <p className="text-[11px] text-gray-400">PDF, JPG, JPEG, PNG (Max 10MB per file)</p>
                </div>

                {attachments.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-100 rounded-md text-xs">
                        <span className="font-medium text-gray-800 truncate max-w-md">{att.name} ({(att.size/1024).toFixed(1)} KB)</span>
                        <button
                          type="button"
                          onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-600 hover:text-red-800 text-[11px] font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-semibold flex items-center space-x-2 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Archived Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
