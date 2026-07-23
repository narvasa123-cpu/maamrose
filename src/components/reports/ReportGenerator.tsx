import React, { useState, useMemo } from 'react';
import { useVoucher } from '../../context/VoucherContext';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  BarChart3, 
  DollarSign, 
  Filter, 
  Building2,
  Table as TableIcon
} from 'lucide-react';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export const ReportGenerator: React.FC = () => {
  const { vouchers, checks, settings } = useVoucher();

  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState('2026-07');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-07-31');

  // Filter vouchers according to selected date range type
  const reportVouchers = useMemo(() => {
    return vouchers.filter(v => {
      if (reportType === 'daily') {
        const today = new Date().toISOString().split('T')[0];
        return v.date === today;
      }
      if (reportType === 'monthly') {
        return v.date.startsWith(selectedMonth);
      }
      if (reportType === 'yearly') {
        return v.date.startsWith(selectedYear);
      }
      if (reportType === 'custom') {
        return (!startDate || v.date >= startDate) && (!endDate || v.date <= endDate);
      }
      return true;
    });
  }, [vouchers, reportType, selectedMonth, selectedYear, startDate, endDate]);

  // Financial summary analytics
  const totalAmount = useMemo(() => {
    return reportVouchers.reduce((acc, v) => acc + v.amount, 0);
  }, [reportVouchers]);

  const totalChecksPrinted = useMemo(() => {
    return checks.filter(c => reportVouchers.some(v => v.id === c.voucherId) && c.status === 'Printed').length;
  }, [checks, reportVouchers]);

  const avgAmount = reportVouchers.length > 0 ? totalAmount / reportVouchers.length : 0;

  // Chart data: Disbursement by Department
  const deptData = useMemo(() => {
    const map: Record<string, number> = {};
    reportVouchers.forEach(v => {
      map[v.department] = (map[v.department] || 0) + v.amount;
    });
    return Object.keys(map).map(dept => ({
      name: dept,
      value: map[dept]
    }));
  }, [reportVouchers]);

  // Export to PDF via jsPDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${settings.companyName || 'CHECK & VOUCHER SYSTEM'}`, 14, 18);
    doc.setFontSize(12);
    doc.text(`Official Disbursal Report (${reportType.toUpperCase()})`, 14, 26);
    doc.setFontSize(9);
    doc.text(`Generated Date: ${new Date().toLocaleString()}`, 14, 32);

    doc.text(`Total Voucher Records: ${reportVouchers.length}`, 14, 42);
    doc.text(`Total Disbursed Amount: PHP ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 14, 48);
    doc.text(`Printed Checks Count: ${totalChecksPrinted}`, 14, 54);

    let y = 66;
    doc.setFontSize(10);
    doc.text('Voucher Number', 14, y);
    doc.text('Date', 50, y);
    doc.text('Payee', 80, y);
    doc.text('Amount (PHP)', 160, y);

    doc.line(14, y + 2, 195, y + 2);
    y += 8;

    doc.setFontSize(8);
    reportVouchers.slice(0, 30).forEach((v) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(v.voucherNumber, 14, y);
      doc.text(v.date, 50, y);
      doc.text(v.payee.substring(0, 32), 80, y);
      doc.text(`PHP ${v.amount.toLocaleString()}`, 160, y);
      y += 6;
    });

    doc.save(`Financial_Disbursal_Report_${reportType}_2026.pdf`);
  };

  // Export to Excel via SheetJS (xlsx)
  const exportToExcel = () => {
    const dataToExport = reportVouchers.map(v => ({
      'Voucher Number': v.voucherNumber,
      'Date': v.date,
      'Payee Name': v.payee,
      'Department': v.department,
      'Amount (PHP)': v.amount,
      'Amount in Words': v.amountInWords,
      'Particulars': v.particulars,
      'Status': v.status,
      'Check Issued': v.checkIssued ? 'YES' : 'NO',
      'Check Number': v.checkNumber || 'N/A',
      'Created By': v.createdByName
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Disbursal Report');
    XLSX.writeFile(workbook, `Disbursal_Report_${reportType}_2026.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Financial Disbursal & Voucher Reports</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate custom disbursal reports, export to official PDF & Excel spreadsheets.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={exportToExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <TableIcon className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={exportToPDF}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4 text-blue-500" />
          <span>Report Timeframe Configuration</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Report Type Selector */}
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase">Time Period</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
            >
              <option value="daily">Daily Report (Today)</option>
              <option value="monthly">Monthly Report</option>
              <option value="yearly">Yearly Report</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Conditional Date Pickers */}
          {reportType === 'monthly' && (
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase">Select Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
              />
            </div>
          )}

          {reportType === 'yearly' && (
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase">Select Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
          )}

          {reportType === 'custom' && (
            <>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Voucher Count</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{reportVouchers.length}</p>
          <p className="text-[11px] text-slate-400">Records in selected period</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Disbursed Amount</p>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
            ₱{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold">100% verified disburse</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Checks Printed</p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{totalChecksPrinted}</p>
          <p className="text-[11px] text-slate-400">Official check records issued</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Voucher Value</p>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            ₱{avgAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-slate-400">Mean disbursement size</p>
        </div>
      </div>

      {/* Visual Chart Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Disbursement Amount by Department
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip formatter={(val: any) => `₱${Number(val).toLocaleString()}`} />
                <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Department Share Allocation (%)
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deptData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name.substring(0, 10)} ${(percent * 100).toFixed(0)}%`}
                >
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => `₱${Number(val).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Report Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-slate-800 dark:text-slate-200">
          Filtered Voucher Disbursement Transactions ({reportVouchers.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Voucher #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Payee</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Amount (₱)</th>
                <th className="px-4 py-3">Check #</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {reportVouchers.map(v => (
                <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">{v.voucherNumber}</td>
                  <td className="px-4 py-2.5 text-slate-500">{v.date}</td>
                  <td className="px-4 py-2.5 font-semibold">{v.payee}</td>
                  <td className="px-4 py-2.5 text-slate-500">{v.department}</td>
                  <td className="px-4 py-2.5 font-bold">₱{v.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{v.checkNumber || 'N/A'}</td>
                  <td className="px-4 py-2.5 font-medium">{v.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
