import React, { useState } from 'react';
import { VoucherRecord, DocumentAttachment } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { DocumentUpload } from '../documents/DocumentUpload';
import { DocumentPreview } from '../documents/DocumentPreview';
import { useVoucher } from '../../context/VoucherContext';
import { 
  FileText, 
  Printer, 
  Paperclip, 
  CheckCircle, 
  Archive, 
  Calendar, 
  Building, 
  DollarSign, 
  User, 
  Eye, 
  Trash2,
  Edit
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VoucherDetailProps {
  voucher: VoucherRecord | null;
  onClose: () => void;
  onEdit?: (voucher: VoucherRecord) => void;
}

export const VoucherDetail: React.FC<VoucherDetailProps> = ({
  voucher,
  onClose,
  onEdit
}) => {
  const { addDocumentToVoucher, deleteDocumentFromVoucher, updateVoucher } = useVoucher();
  const navigate = useNavigate();

  const [selectedDoc, setSelectedDoc] = useState<DocumentAttachment | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  if (!voucher) return null;

  const handleDocumentUploaded = (fileData: { name: string; size: number; type: string; url: string }) => {
    addDocumentToVoucher(voucher.id, fileData);
    setShowUpload(false);
  };

  const handleStatusChange = (newStatus: any) => {
    updateVoucher(voucher.id, { status: newStatus });
  };

  const handleGoToPrint = () => {
    onClose();
    navigate(`/checks?voucherId=${voucher.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Status & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <StatusBadge status={voucher.status} />
          {voucher.checkIssued && (
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              Check Issued (#{voucher.checkNumber})
            </span>
          )}
        </div>

        {/* Workflow actions */}
        <div className="flex items-center space-x-2">
          {voucher.status === 'Draft' && (
            <button
              onClick={() => handleStatusChange('Pending')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Submit for Approval
            </button>
          )}

          {voucher.status === 'Pending' && (
            <button
              onClick={() => handleStatusChange('Approved')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Approve Voucher</span>
            </button>
          )}

          <button
            onClick={handleGoToPrint}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Check</span>
          </button>

          {onEdit && (
            <button
              onClick={() => {
                onClose();
                onEdit(voucher);
              }}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Edit Voucher"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disbursal Details</p>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Payee Name:</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{voucher.payee}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Department:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{voucher.department}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Voucher Date:</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">{voucher.date}</span>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Financial Disbursal</p>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Amount:</span>
            <span className="font-extrabold text-blue-600 dark:text-blue-400 text-lg">
              ₱{voucher.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-start justify-between">
            <span className="text-slate-500">In Words:</span>
            <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 text-right max-w-[200px]">
              {voucher.amountInWords}
            </span>
          </div>
        </div>
      </div>

      {/* Particulars & Remarks */}
      <div className="space-y-3">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            Particulars & Breakdown
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {voucher.particulars}
          </p>
        </div>

        {voucher.remarks && (
          <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl text-xs">
            <span className="font-bold text-amber-800 dark:text-amber-400 mr-2">Audit Remarks:</span>
            <span className="text-amber-900 dark:text-amber-200">{voucher.remarks}</span>
          </div>
        )}
      </div>

      {/* Supporting Documents Section (STEP 6) */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Paperclip className="w-4 h-4 text-blue-500" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Supporting Documents ({voucher.documents.length})
            </h4>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
          >
            {showUpload ? 'Hide Upload' : '+ Upload Document'}
          </button>
        </div>

        {showUpload && (
          <DocumentUpload onUploadSuccess={handleDocumentUploaded} />
        )}

        {/* Document list */}
        {voucher.documents.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            No supporting attachments uploaded yet. Attach invoice or receipts above.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {voucher.documents.map((doc) => (
              <div
                key={doc.id}
                className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between group hover:border-blue-400 transition-colors"
              >
                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">
                    {doc.name.endsWith('.pdf') ? 'PDF' : 'IMG'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                      {doc.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {(doc.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Preview Document"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteDocumentFromVoucher(voucher.id, doc.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview modal for documents */}
      <DocumentPreview
        document={selectedDoc}
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onDelete={(docId) => deleteDocumentFromVoucher(voucher.id, docId)}
      />
    </div>
  );
};
