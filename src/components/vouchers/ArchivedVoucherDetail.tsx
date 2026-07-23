import React, { useState } from 'react';
import { X, Archive, Download, Eye, FileText, MapPin, Tag, Trash2, Calendar, User, Upload, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { useVoucher } from '../../context/VoucherContext';
import { useAuth } from '../../context/AuthContext';
import { ArchiveVoucher, DocumentAttachment } from '../../types';

interface ArchivedVoucherDetailProps {
  voucher: ArchiveVoucher | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ArchivedVoucherDetail: React.FC<ArchivedVoucherDetailProps> = ({ voucher, isOpen, onClose }) => {
  const { addDocumentToArchive, deleteDocumentFromArchive, deleteArchivedVoucher } = useVoucher();
  const { isAdmin } = useAuth();

  const [activeDocument, setActiveDocument] = useState<DocumentAttachment | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !voucher) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    (Array.from(files) as File[]).forEach((file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 10MB limit.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        addDocumentToArchive(voucher.id, {
          name: file.name,
          size: file.size,
          type: file.type || 'application/pdf',
          url: uploadEvent.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteRecord = () => {
    if (!isAdmin) {
      alert("Only Administrators can delete archived records.");
      return;
    }
    if (confirm(`Are you sure you want to PERMANENTLY DELETE Archived Voucher #${voucher.voucherNumber}? This operation cannot be undone.`)) {
      deleteArchivedVoucher(voucher.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-amber-50/80 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-gray-900">{voucher.voucherNumber}</h2>
                <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                  Archived Paper Record
                </span>
              </div>
              <p className="text-xs text-gray-600">Encoded by {voucher.encodedByName || 'Staff'} on {new Date(voucher.encodedDate).toLocaleDateString()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Top Banner Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Voucher Date</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{voucher.date}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Amount</p>
              <p className="text-base font-bold text-emerald-700 mt-0.5">₱{voucher.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Department</p>
              <p className="text-xs font-semibold text-gray-800 mt-0.5 truncate">{voucher.department}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Storage Box</p>
              <p className="text-xs font-mono font-bold text-purple-700 mt-0.5">{voucher.storageBox}</p>
            </div>
          </div>

          {/* Payee & Particulars */}
          <div className="space-y-3 bg-white p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payee / Vendor</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{voucher.payee}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount in Words</p>
              <p className="text-xs font-serif font-semibold text-gray-700 mt-0.5 italic bg-amber-50/50 p-2 rounded border border-amber-100">
                {voucher.amountInWords}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Purpose & Particulars</p>
              <p className="text-xs text-gray-800 mt-0.5 leading-relaxed">{voucher.purpose || voucher.description}</p>
            </div>
            {voucher.remarks && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Remarks / Notes</p>
                <p className="text-xs text-gray-600 mt-0.5">{voucher.remarks}</p>
              </div>
            )}
          </div>

          {/* Physical Storage Location */}
          <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-lg">
            <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-purple-700" />
              <span>Physical Archival Location</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-gray-500 font-medium">Box Number:</span>
                <p className="font-mono font-bold text-purple-800">{voucher.storageBox}</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Folder #:</span>
                <p className="font-mono font-bold text-purple-800">{voucher.folderNumber}</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Shelf / Rack:</span>
                <p className="font-semibold text-purple-800">{voucher.shelfLocation}</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">COA Physical Ref #:</span>
                <p className="font-semibold text-purple-800">{voucher.physicalReferenceNumber}</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {voucher.tags && voucher.tags.length > 0 && (
            <div className="flex items-center space-x-2">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {voucher.tags.map((tag, idx) => (
                  <span key={idx} className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200 font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Scanned Supporting Documents Section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Supporting Scanned Documents ({voucher.documents?.length || 0})</span>
              </h3>

              <label className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-semibold cursor-pointer flex items-center space-x-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Attachment</span>
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {(!voucher.documents || voucher.documents.length === 0) ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400">
                <p className="text-xs font-medium">No digital documents attached to this archived record.</p>
                <p className="text-[11px] text-gray-400 mt-1">Upload scanned PDFs or images using the button above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {voucher.documents.map((doc) => (
                  <div key={doc.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-xs text-gray-900 truncate max-w-[180px]">{doc.name}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-mono">{(doc.size/1024).toFixed(0)} KB</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                    </div>

                    <div className="mt-3 flex items-center space-x-2 border-t border-gray-200 pt-2">
                      <button
                        onClick={() => setActiveDocument(doc)}
                        className="flex-1 py-1 px-2 bg-blue-600 text-white text-[11px] font-semibold rounded flex items-center justify-center space-x-1 hover:bg-blue-700"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </button>
                      <a
                        href={doc.url}
                        download={doc.name}
                        className="p-1 text-gray-600 hover:text-blue-600 hover:bg-gray-200 rounded"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      {isAdmin && (
                        <button
                          onClick={() => deleteDocumentFromArchive(voucher.id, doc.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete File"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between rounded-b-xl">
          {isAdmin ? (
            <button
              onClick={handleDeleteRecord}
              className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-200 flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Archived Record</span>
            </button>
          ) : <div />}

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded shadow-xs"
          >
            Close Viewer
          </button>
        </div>
      </div>

      {/* Document Fullscreen Preview Modal */}
      {activeDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col">
            <div className="px-4 py-3 bg-gray-900 text-white rounded-t-xl flex items-center justify-between">
              <span className="font-bold text-xs truncate max-w-md">{activeDocument.name}</span>
              <div className="flex items-center space-x-2">
                <button onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))} className="p-1 hover:bg-gray-800 rounded">
                  <ZoomOut className="w-4 h-4 text-gray-300" />
                </button>
                <span className="text-xs font-mono text-gray-300">{zoomLevel}%</span>
                <button onClick={() => setZoomLevel(prev => Math.min(200, prev + 25))} className="p-1 hover:bg-gray-800 rounded">
                  <ZoomIn className="w-4 h-4 text-gray-300" />
                </button>
                <button onClick={() => setRotation(prev => (prev + 90) % 360)} className="p-1 hover:bg-gray-800 rounded">
                  <RotateCw className="w-4 h-4 text-gray-300" />
                </button>
                <button onClick={() => setActiveDocument(null)} className="p-1 hover:bg-gray-800 rounded ml-2">
                  <X className="w-5 h-5 text-gray-300" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-gray-900 overflow-auto p-4 flex items-center justify-center">
              {activeDocument.type.includes('pdf') ? (
                <iframe src={activeDocument.url} title={activeDocument.name} className="w-full h-full rounded bg-white" />
              ) : (
                <img
                  src={activeDocument.url}
                  alt={activeDocument.name}
                  style={{ transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`, transition: 'transform 0.2s' }}
                  className="max-h-full object-contain rounded shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
