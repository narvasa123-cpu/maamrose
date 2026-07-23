import React, { useState, useMemo } from 'react';
import { 
  Archive, 
  Search, 
  Plus, 
  FileSpreadsheet, 
  Upload, 
  Filter, 
  Calendar, 
  Building2, 
  MapPin, 
  Tag, 
  Eye, 
  Trash2, 
  FileText,
  Paperclip,
  CheckCircle,
  Database
} from 'lucide-react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { useVoucher } from '../context/VoucherContext';
import { useAuth } from '../context/AuthContext';
import { ArchiveVoucher } from '../types';
import { ArchivedVoucherForm } from '../components/vouchers/ArchivedVoucherForm';
import { ArchivedVoucherDetail } from '../components/vouchers/ArchivedVoucherDetail';
import { BulkImportModal } from '../components/vouchers/BulkImportModal';
import { BulkZipDocumentModal } from '../components/vouchers/BulkZipDocumentModal';

export const ArchivedVouchersPage: React.FC = () => {
  const { archivedVouchers, deleteArchivedVoucher, storageLocations } = useVoucher();
  const { isAdmin } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedBox, setSelectedBox] = useState('ALL');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isZipImportOpen, setIsZipImportOpen] = useState(false);

  const [selectedVoucher, setSelectedVoucher] = useState<ArchiveVoucher | null>(null);

  // Filtered archived vouchers
  const filteredRecords = useMemo(() => {
    return archivedVouchers.filter(item => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || (
        item.voucherNumber.toLowerCase().includes(q) ||
        item.payee.toLowerCase().includes(q) ||
        item.purpose.toLowerCase().includes(q) ||
        item.storageBox.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        item.tags?.some(t => t.toLowerCase().includes(q))
      );

      const matchesDept = selectedDept === 'ALL' || item.department === selectedDept;
      const matchesYear = selectedYear === 'ALL' || item.year?.toString() === selectedYear;
      const matchesBox = selectedBox === 'ALL' || item.storageBox === selectedBox;

      return matchesSearch && matchesDept && matchesYear && matchesBox;
    });
  }, [archivedVouchers, searchTerm, selectedDept, selectedYear, selectedBox]);

  // Aggregate Stats
  const totalAmount = useMemo(() => {
    return archivedVouchers.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [archivedVouchers]);

  const totalAttachments = useMemo(() => {
    return archivedVouchers.reduce((acc, curr) => acc + (curr.documents?.length || 0), 0);
  }, [archivedVouchers]);

  const uniqueBoxes = useMemo(() => {
    const boxes = new Set<string>();
    archivedVouchers.forEach(a => { if (a.storageBox) boxes.add(a.storageBox); });
    return Array.from(boxes);
  }, [archivedVouchers]);

  const uniqueYears = useMemo(() => {
    const years = new Set<string>();
    archivedVouchers.forEach(a => { if (a.year) years.add(a.year.toString()); });
    return Array.from(years).sort().reverse();
  }, [archivedVouchers]);

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Page Title & Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
                <Archive className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Archived Historical Vouchers</h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Digitized archive repository for historical paper vouchers, supporting documents, and physical storage tracking
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsZipImportOpen(true)}
              className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Bulk ZIP Matcher</span>
            </button>

            <button
              onClick={() => setIsExcelImportOpen(true)}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Bulk Excel Import</span>
            </button>

            <button
              onClick={() => setIsFormOpen(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Digitize Paper Voucher</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Archived Records</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-1">{archivedVouchers.length}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Digitized paper vouchers</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Archive className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Amount Digitized</p>
              <p className="text-xl font-extrabold text-emerald-700 mt-1">₱{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Historical disbursement value</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Database className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Physical Storage Boxes</p>
              <p className="text-2xl font-extrabold text-purple-800 mt-1">{uniqueBoxes.length}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Box location trackers</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <MapPin className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Scanned Documents</p>
              <p className="text-2xl font-extrabold text-blue-700 mt-1">{totalAttachments}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Attached PDFs & Images</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Paperclip className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Voucher #, Payee, Storage Box, Tag, Purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-gray-700"
              >
                <option value="ALL">All Departments</option>
                <option value="Accounting & Disbursement">Accounting & Disbursement</option>
                <option value="Administrative Services">Administrative Services</option>
                <option value="Operations">Operations</option>
                <option value="Human Resource Management">Human Resource Management</option>
                <option value="Facilities & Security">Facilities & Security</option>
                <option value="Infrastructure & Public Works">Infrastructure & Public Works</option>
                <option value="Information Technology">Information Technology</option>
              </select>
            </div>

            {/* Storage Box Filter */}
            <div>
              <select
                value={selectedBox}
                onChange={(e) => setSelectedBox(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-gray-700 font-mono"
              >
                <option value="ALL">All Storage Boxes</option>
                {uniqueBoxes.map((box, idx) => (
                  <option key={idx} value={box}>{box}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Archived Vouchers Data Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Archived Paper Records ({filteredRecords.length} records)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-100 font-bold text-gray-700">
                <tr>
                  <th className="px-4 py-3">Voucher #</th>
                  <th className="px-4 py-3">Date / Year</th>
                  <th className="px-4 py-3">Payee / Purpose</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Physical Location</th>
                  <th className="px-4 py-3">Docs</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      <Archive className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm font-semibold">No archived records match your filter criteria.</p>
                      <p className="text-xs text-gray-400 mt-1">Try resetting search parameters or digitize a new paper voucher.</p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item) => (
                    <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                      {/* Voucher Number */}
                      <td className="px-4 py-3 font-mono font-bold text-amber-900 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <Archive className="w-3.5 h-3.5 text-amber-600" />
                          <span>{item.voucherNumber}</span>
                        </div>
                      </td>

                      {/* Date / Year */}
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        <span className="font-medium text-gray-900">{item.date}</span>
                        <span className="block text-[10px] text-gray-400">Yr {item.year}</span>
                      </td>

                      {/* Payee / Purpose */}
                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-bold text-gray-900 truncate">{item.payee}</p>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">{item.purpose}</p>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[11px] font-medium border border-gray-200">
                          {item.department}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                        ₱{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Physical Storage Location */}
                      <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded font-bold">
                          {item.storageBox}
                        </span>
                        <span className="block text-[10px] text-gray-400 mt-0.5">{item.shelfLocation}</span>
                      </td>

                      {/* Documents Count */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center space-x-1 text-gray-600 font-medium text-xs">
                          <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                          <span>{item.documents?.length || 0}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedVoucher(item);
                              setIsDetailOpen(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                            title="View Record & Scanned Attachments"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (confirm(`Permanently delete Archived Record #${item.voucherNumber}?`)) {
                                  deleteArchivedVoucher(item.id);
                                }
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-red-200 transition-colors"
                              title="Delete Archive Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals */}
        <ArchivedVoucherForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
        />

        <ArchivedVoucherDetail
          voucher={selectedVoucher}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedVoucher(null);
          }}
        />

        <BulkImportModal
          isOpen={isExcelImportOpen}
          onClose={() => setIsExcelImportOpen(false)}
        />

        <BulkZipDocumentModal
          isOpen={isZipImportOpen}
          onClose={() => setIsZipImportOpen(false)}
        />
      </div>
    </AdminLayout>
  );
};
