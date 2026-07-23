import React from 'react';
import { useVoucher } from '../../context/VoucherContext';
import { StatusBadge } from '../common/StatusBadge';
import { 
  FileText, 
  Printer, 
  DollarSign, 
  Clock, 
  Plus, 
  BarChart3, 
  ArrowRight, 
  Paperclip,
  CheckCircle2,
  TrendingUp,
  FileCheck,
  Building,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

const STATUS_COLORS: Record<string, string> = {
  Approved: '#10b981',
  Pending: '#f59e0b',
  Draft: '#2563eb',
  Archived: '#64748b'
};

interface DashboardOverviewProps {
  onOpenCreateVoucher: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onOpenCreateVoucher }) => {
  const { vouchers, checks, activityLogs } = useVoucher();
  const navigate = useNavigate();

  // Metrics
  const totalVouchers = vouchers.length;
  const totalChecks = checks.filter(c => c.status === 'Printed').length;
  const pendingVouchers = vouchers.filter(v => v.status === 'Pending').length;
  const totalDisbursedAmount = vouchers
    .filter(v => v.status === 'Approved')
    .reduce((acc, v) => acc + v.amount, 0);

  // Status breakdown data for PieChart
  const statusCounts = vouchers.reduce((acc: Record<string, number>, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status]
  }));

  // Disbursal trends chart data
  const chartData = [
    { month: 'Mar', amount: 185000 },
    { month: 'Apr', amount: 240000 },
    { month: 'May', amount: 210000 },
    { month: 'Jun', amount: 310000 },
    { month: 'Jul', amount: totalDisbursedAmount }
  ];

  // Recent uploaded documents list across vouchers
  const recentDocs = vouchers
    .flatMap(v => v.documents.map(d => ({ ...d, voucherNumber: v.voucherNumber, voucherId: v.id })))
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="p-6 bg-white rounded-xl border border-gray-200 border-l-4 border-l-blue-600 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold uppercase tracking-wider">
            Disbursement Operations Console
          </span>
          <h1 className="text-xl font-bold tracking-tight mt-2 text-gray-900">
            Check Printing & Voucher Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            Real-time voucher record tracking, pre-printed check alignment studio, document attachments, and financial audit logs.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenCreateVoucher}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Voucher</span>
          </button>

          <button
            onClick={() => navigate('/checks')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-md shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Check</span>
          </button>

          <button
            onClick={() => navigate('/archive')}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-md shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Archived Records</span>
          </button>

          <button
            onClick={() => navigate('/reports')}
            className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-semibold text-xs rounded-md flex items-center space-x-1.5 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Reports</span>
          </button>
        </div>
      </div>

      {/* First Run Production Banner when no records exist */}
      {totalVouchers === 0 && (
        <div className="p-5 bg-blue-50/80 border border-blue-200 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-blue-900 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Government Disbursement System — First Run Ready</span>
            </h3>
            <p className="text-xs text-blue-800">
              No voucher records yet • No checks printed • No scanned documents. Start by encoding your office's first voucher record.
            </p>
          </div>
          <button
            onClick={onOpenCreateVoucher}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center space-x-1.5 whitespace-nowrap transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Voucher</span>
          </button>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Vouchers */}
        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Voucher Records</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalVouchers}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Active in database</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Total Printed Checks */}
        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Printed Checks</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{totalChecks}</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Official checks issued</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Printer className="w-5 h-5" />
          </div>
        </div>

        {/* Total Disbursed Amount */}
        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Disbursed (₱)</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              ₱{totalDisbursedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Approved disbursements</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Approval */}
        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending Vouchers</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingVouchers}</p>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Requires approval</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Visual Recharts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Disbursal Monthly Trends */}
        <div className="lg:col-span-2 p-5 bg-white rounded-xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Monthly Disbursal Trend (2026)</span>
            </h2>
            <span className="text-[10px] font-semibold text-gray-400">Amount in PHP (₱)</span>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(val: any) => `₱${Number(val).toLocaleString()}`} />
                <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Voucher Workflow Status Breakdown */}
        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider pb-2 border-b border-gray-100">
            Voucher Status Breakdown
          </h2>

          <div className="h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-gray-100">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[d.name] || '#64748b' }} />
                <span className="text-gray-500">{d.name}:</span>
                <strong className="text-gray-900">{d.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Activity Feed & Recent Uploaded Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Log Feed */}
        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Recent System Activity
            </h2>
            <button
              onClick={() => navigate('/logs')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center space-x-1"
            >
              <span>View All Logs</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {activityLogs.length === 0 ? (
              <p className="text-gray-400 italic py-6 text-center">
                No system activities logged yet. Activity logs will record voucher entries, approvals, and check printings.
              </p>
            ) : (
              activityLogs.slice(0, 5).map(log => (
                <div key={log.id} className="p-2.5 rounded-lg bg-gray-50 flex items-start space-x-3 border border-gray-100">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {log.details}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {log.userName} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Uploaded Documents */}
        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Paperclip className="w-4 h-4 text-blue-600" />
              <span>Recent Uploaded Documents</span>
            </h2>
            <button
              onClick={() => navigate('/vouchers')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center space-x-1"
            >
              <span>All Vouchers</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {recentDocs.length === 0 ? (
              <p className="text-gray-400 italic py-4 text-center">
                No uploaded supporting documents yet.
              </p>
            ) : (
              recentDocs.map(doc => (
                <div key={doc.id} className="p-2.5 rounded-lg bg-gray-50 flex items-center justify-between border border-gray-100">
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                      {doc.name.endsWith('.pdf') ? 'PDF' : 'IMG'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {doc.name}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Voucher #{doc.voucherNumber} • {doc.uploadedBy}
                      </p>
                    </div>
                  </div>

                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-white border border-gray-200 hover:border-blue-500 text-gray-700 font-semibold rounded-md text-[10px] flex-shrink-0 transition-colors"
                  >
                    View File
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
