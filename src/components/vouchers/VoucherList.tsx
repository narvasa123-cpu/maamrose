import React, { useState, useMemo } from 'react';
import { VoucherRecord } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { VoucherForm } from './VoucherForm';
import { VoucherDetail } from './VoucherDetail';
import { useVoucher } from '../../context/VoucherContext';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Archive, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown,
  Paperclip
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const VoucherList: React.FC = () => {
  const { vouchers, addVoucher, updateVoucher, deleteVoucher, archiveVoucher } = useVoucher();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Filters state
  const initialSearch = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherRecord | null>(null);
  const [viewingVoucher, setViewingVoucher] = useState<VoucherRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter logic
  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      // Search matches Voucher #, Payee, Particulars, Check #
      const query = searchTerm.toLowerCase();
      const matchesSearch = !query || (
        v.voucherNumber.toLowerCase().includes(query) ||
        v.payee.toLowerCase().includes(query) ||
        v.particulars.toLowerCase().includes(query) ||
        (v.checkNumber && v.checkNumber.toLowerCase().includes(query))
      );

      // Status
      const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;

      // Department
      const matchesDept = departmentFilter === 'ALL' || v.department === departmentFilter;

      // Date Range
      const matchesStart = !startDate || v.date >= startDate;
      const matchesEnd = !endDate || v.date <= endDate;

      return matchesSearch && matchesStatus && matchesDept && matchesStart && matchesEnd;
    });
  }, [vouchers, searchTerm, statusFilter, departmentFilter, startDate, endDate]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage) || 1;
  const paginatedVouchers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVouchers.slice(start, start + itemsPerPage);
  }, [filteredVouchers, currentPage]);

  const handleCreateSubmit = (data: any) => {
    addVoucher(data);
    setIsCreateOpen(false);
  };

  const handleEditSubmit = (data: any) => {
    if (editingVoucher) {
      updateVoucher(editingVoucher.id, data);
      setEditingVoucher(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Voucher Record Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage, track, approve, and attach supporting documents to official voucher records.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Voucher Record</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Query Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Voucher #, Payee, Particulars..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Date Range Start */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date Range End */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Voucher #</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Payee & Department</th>
                <th className="px-4 py-3.5">Amount (₱)</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Docs</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {paginatedVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No voucher records found matching search filters.
                  </td>
                </tr>
              ) : (
                paginatedVouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {v.voucherNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {v.date}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-white truncate max-w-[220px]">
                        {v.payee}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {v.department}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                      ₱{v.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={v.status} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1 text-slate-400">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span className="font-semibold text-xs">{v.documents.length}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => setViewingVoucher(v)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="View Voucher Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => navigate(`/checks?voucherId=${v.id}`)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg transition-colors"
                        title="Print Check"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setEditingVoucher(v)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 rounded-lg transition-colors"
                        title="Edit Voucher"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => archiveVoucher(v.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Archive Voucher"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingId(v.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                        title="Delete Voucher"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredVouchers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</strong> to <strong className="text-slate-800 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, filteredVouchers.length)}</strong> of <strong className="text-slate-800 dark:text-slate-200">{filteredVouchers.length}</strong> records
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-semibold text-slate-700 dark:text-slate-300 px-2">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Voucher Record"
        subtitle="Specify payment particulars and amount. Physical voucher already exists."
        maxWidth="2xl"
      >
        <VoucherForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingVoucher}
        onClose={() => setEditingVoucher(null)}
        title={`Edit Voucher Record #${editingVoucher?.voucherNumber}`}
        subtitle="Modify voucher details and status."
        maxWidth="2xl"
      >
        <VoucherForm
          initialValues={editingVoucher}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingVoucher(null)}
        />
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={!!viewingVoucher}
        onClose={() => setViewingVoucher(null)}
        title={`Voucher Record #${viewingVoucher?.voucherNumber}`}
        subtitle={`Created on ${viewingVoucher?.date} by ${viewingVoucher?.createdByName || 'Staff'}`}
        maxWidth="4xl"
      >
        <VoucherDetail
          voucher={viewingVoucher}
          onClose={() => setViewingVoucher(null)}
          onEdit={(v) => setEditingVoucher(v)}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) deleteVoucher(deletingId);
        }}
        title="Delete Voucher Record?"
        message="Are you sure you want to delete this voucher record? This action cannot be undone."
        confirmLabel="Delete Record"
      />
    </div>
  );
};
