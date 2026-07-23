import React, { useState } from 'react';
import { X, FileSpreadsheet, Download, Upload, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useVoucher } from '../../context/VoucherContext';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { bulkImportArchivedVouchers } = useVoucher();

  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ successCount: number; skippedCount: number; errors: string[] } | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Voucher Number': 'DV-2025-001001',
        'Date': '2025-01-15',
        'Payee Name': 'Apex Infrastructure & Heavy Equipment',
        'Department': 'Infrastructure & Public Works',
        'Amount': 150000.00,
        'Purpose': 'Heavy Machinery Rental for Drainage Clearing Project',
        'Description': 'Excavator and dump truck operational billing for Q1 flood mitigation works.',
        'Storage Box': 'BOX-2025-PW-001',
        'Folder Number': 'FLD-010',
        'Shelf Location': 'Rack 1 - Shelf A',
        'Physical Ref': 'COA-2025-PW-01001',
        'Tags': 'Equipment, Maintenance, Infrastructure'
      },
      {
        'Voucher Number': 'HR-2025-002040',
        'Date': '2025-03-31',
        'Payee Name': 'Municipal Staff Health Care Fund',
        'Department': 'Human Resource Management',
        'Amount': 88400.50,
        'Purpose': 'Quarterly Staff HMO Medical Benefit Subsidy',
        'Description': 'Q1 Health Insurance municipal share disbursement.',
        'Storage Box': 'BOX-2025-HR-002',
        'Folder Number': 'FLD-004',
        'Shelf Location': 'Rack 2 - Shelf B',
        'Physical Ref': 'HR-MED-2025-1',
        'Tags': 'Payroll, Benefits, Health'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Archived Vouchers Template");
    XLSX.writeFile(workbook, "Archived_Vouchers_Import_Template.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Normalize Excel header keys
        const mappedData = data.map((row: any) => ({
          voucherNumber: row['Voucher Number'] || row['VoucherNumber'] || row['voucher_number'] || row['VOUCHER NUMBER'] || row['DV Number'] || '',
          date: row['Date'] || row['Voucher Date'] || row['date'] || new Date().toISOString().split('T')[0],
          payee: row['Payee Name'] || row['Payee'] || row['payee'] || row['Vendor'] || '',
          department: row['Department'] || row['department'] || 'General Archive',
          amount: parseFloat(row['Amount'] || row['amount'] || 0),
          purpose: row['Purpose'] || row['purpose'] || '',
          description: row['Description'] || row['description'] || row['Particulars'] || '',
          storageBox: row['Storage Box'] || row['Box'] || 'BOX-BULK-IMPORT',
          folderNumber: row['Folder Number'] || row['Folder'] || 'FLD-001',
          shelfLocation: row['Shelf Location'] || row['Shelf'] || 'Shelf 1',
          physicalReferenceNumber: row['Physical Ref'] || row['Ref'] || '',
          tags: row['Tags'] || 'BulkImport'
        }));

        setParsedRows(mappedData);
      } catch (err) {
        alert("Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv spreadsheet.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCommitImport = () => {
    if (parsedRows.length === 0) {
      alert("No rows loaded for import.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = bulkImportArchivedVouchers(parsedRows);
      setImportResult(res);
      setLoading(false);
      if (onSuccess) onSuccess();
    }, 500);
  };

  const handleDownloadErrorReport = () => {
    if (!importResult || importResult.errors.length === 0) return;
    const errorText = importResult.errors.join('\n');
    const blob = new Blob([errorText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Import_Error_Report_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-emerald-50 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Bulk Import Archived Records (Excel / CSV)</h2>
              <p className="text-xs text-gray-600">Import thousands of historical paper voucher records at once</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Step 1: Download Template */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-start space-x-3">
              <Download className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-bold text-gray-900 text-xs">Need an Excel template?</h3>
                <p className="text-gray-600 text-[11px] mt-0.5">Download our standardized Excel template formatted with exact column headers.</p>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs flex items-center space-x-1 shadow-xs"
            >
              <span>Download Excel Template</span>
            </button>
          </div>

          {/* Step 2: Upload Area */}
          <div className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-xl p-6 text-center bg-gray-50 hover:bg-emerald-50/30 transition-all cursor-pointer relative">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-800">Click or Drag & Drop Excel File (.xlsx, .xls, .csv)</p>
            <p className="text-[11px] text-gray-400 mt-1">{fileName ? `Selected: ${fileName}` : 'Supports spreadsheets up to 50,000 rows'}</p>
          </div>

          {/* Import Results Summary */}
          {importResult && (
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-lg space-y-2">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Import Completed Successfully</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs pt-2">
                <div className="bg-white p-2.5 rounded border border-emerald-200">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">Successfully Imported</span>
                  <p className="text-lg font-bold text-emerald-700">{importResult.successCount} rows</p>
                </div>
                <div className="bg-white p-2.5 rounded border border-amber-200">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">Skipped / Invalid</span>
                  <p className="text-lg font-bold text-amber-700">{importResult.skippedCount} rows</p>
                </div>
                <div className="bg-white p-2.5 rounded border border-gray-200">
                  <span className="text-gray-400 font-bold uppercase text-[10px]">Total Rows</span>
                  <p className="text-lg font-bold text-gray-800">{importResult.successCount + importResult.skippedCount}</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={handleDownloadErrorReport}
                    className="text-xs text-red-600 hover:text-red-800 font-bold underline flex items-center space-x-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Download Detailed Error Log ({importResult.errors.length} skipped issues)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Row Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-xs">Sheet Preview ({parsedRows.length} records parsed)</h3>
                <span className="text-[11px] text-gray-500">Showing first 5 preview rows</span>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                  <thead className="bg-gray-100 font-bold text-gray-700">
                    <tr>
                      <th className="px-3 py-2">Voucher #</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Payee</th>
                      <th className="px-3 py-2">Department</th>
                      <th className="px-3 py-2 text-right">Amount (₱)</th>
                      <th className="px-3 py-2">Storage Box</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {parsedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono font-bold text-blue-700">{row.voucherNumber || '-'}</td>
                        <td className="px-3 py-2">{row.date}</td>
                        <td className="px-3 py-2 font-medium text-gray-900 truncate max-w-[180px]">{row.payee}</td>
                        <td className="px-3 py-2 text-gray-600">{row.department}</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-700">₱{Number(row.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2 font-mono text-purple-700">{row.storageBox}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
          {parsedRows.length > 0 && !importResult && (
            <button
              onClick={handleCommitImport}
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded shadow-xs flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              <span>Import {parsedRows.length} Records</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
