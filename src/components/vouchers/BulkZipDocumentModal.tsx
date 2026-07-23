import React, { useState } from 'react';
import { X, Archive, Upload, FileCheck, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useVoucher } from '../../context/VoucherContext';

interface BulkZipDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BulkZipDocumentModal: React.FC<BulkZipDocumentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { matchAndAttachZipDocuments } = useVoucher();

  const [loading, setLoading] = useState(false);
  const [zipFileName, setZipFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [results, setResults] = useState<{ matchedCount: number; unmatchedFiles: string[]; totalFiles: number } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      alert("Please select a valid .ZIP archive file.");
      return;
    }

    setSelectedFile(file);
    setZipFileName(file.name);
    setResults(null);
  };

  const handleStartMatching = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      const res = await matchAndAttachZipDocuments(selectedFile);
      setResults(res);
      if (onSuccess) onSuccess();
    } catch (err) {
      alert("Error parsing ZIP file or matching documents.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] flex flex-col my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-purple-50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Bulk Document ZIP Import & Auto-Matcher</h2>
              <p className="text-xs text-gray-600">Upload a ZIP file containing scanned PDF/images to auto-attach to vouchers</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Instructions */}
          <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-lg space-y-2">
            <h3 className="font-bold text-purple-900 text-xs">How Filename Auto-Matching Works:</h3>
            <ul className="list-disc list-inside text-gray-600 text-[11px] space-y-1">
              <li>Name your scanned files using the voucher number (e.g. <code className="font-mono text-purple-800 bg-purple-100 px-1 py-0.5 rounded">DV-2025-001245.pdf</code> or <code className="font-mono text-purple-800 bg-purple-100 px-1 py-0.5 rounded">VR-2026-0101.jpg</code>).</li>
              <li>Compress all PDFs and images into a single <code className="font-mono font-bold">.zip</code> archive.</li>
              <li>The system will automatically extract files and match them to active or archived vouchers in Firestore.</li>
            </ul>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 hover:border-purple-500 rounded-xl p-6 text-center bg-gray-50 hover:bg-purple-50/30 transition-all cursor-pointer relative">
            <input
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-800">Click or Drag & Drop Scanned Documents ZIP Archive (.zip)</p>
            <p className="text-[11px] text-gray-400 mt-1">{zipFileName ? `Selected: ${zipFileName}` : 'Supports ZIP files with hundreds of scanned PDFs & images'}</p>
          </div>

          {/* Results Summary */}
          {results && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-3">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Bulk ZIP Matching Completed</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded border border-emerald-200">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">Auto-Matched</span>
                  <p className="text-lg font-bold text-emerald-700">{results.matchedCount} files</p>
                </div>
                <div className="bg-white p-2.5 rounded border border-amber-200">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">Unmatched</span>
                  <p className="text-lg font-bold text-amber-700">{results.unmatchedFiles.length} files</p>
                </div>
                <div className="bg-white p-2.5 rounded border border-gray-200">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">Total Files</span>
                  <p className="text-lg font-bold text-gray-800">{results.totalFiles}</p>
                </div>
              </div>

              {results.unmatchedFiles.length > 0 && (
                <div className="p-3 bg-white rounded border border-amber-200 max-h-32 overflow-y-auto">
                  <p className="font-bold text-xs text-amber-800 mb-1 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Unmatched Filenames (No matching Voucher # found)</span>
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-gray-600 font-mono">
                    {results.unmatchedFiles.map((fn, idx) => (
                      <li key={idx}>{fn}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end space-x-3 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 font-semibold"
          >
            Cancel
          </button>

          {selectedFile && !results && (
            <button
              onClick={handleStartMatching}
              disabled={loading}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded shadow-xs flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
              <span>Extract & Auto-Attach Files</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
