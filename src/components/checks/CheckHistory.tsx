import React, { useState } from 'react';
import { useVoucher } from '../../context/VoucherContext';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Search, Printer, Ban, History, RefreshCw, X, ShieldAlert } from 'lucide-react';

export const CheckHistory: React.FC = () => {
  const { checks, checkHistory, voidCheck, reprintCheck } = useVoucher();
  const [searchTerm, setSearchTerm] = useState('');
  const [voidingCheckId, setVoidingCheckId] = useState<string | null>(null);

  // Reprint Modal State
  const [reprintingCheckId, setReprintingCheckId] = useState<string | null>(null);
  const [reprintReason, setReprintReason] = useState('Printer paper jam / spoiled check stock');

  // Detailed History Modal State
  const [selectedCheckVoucherNum, setSelectedCheckVoucherNum] = useState<string | null>(null);

  const filteredChecks = checks.filter(c => {
    const query = searchTerm.toLowerCase();
    return (
      c.checkNumber.toLowerCase().includes(query) ||
      c.payee.toLowerCase().includes(query) ||
      c.voucherNumber.toLowerCase().includes(query) ||
      c.bankName.toLowerCase().includes(query)
    );
  });

  const handleConfirmReprint = () => {
    if (!reprintingCheckId) return;
    reprintCheck(reprintingCheckId, reprintReason);
    setReprintingCheckId(null);
  };

  const getCheckAuditLogs = (voucherNum: string) => {
    return checkHistory.filter(h => h.voucherNumber === voucherNum);
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-gray-200 shadow-xs">
        <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
          <Printer className="w-4 h-4 text-blue-500" />
          <span>Printed Check Records & Audit History</span>
        </h2>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Check #, Voucher #, Payee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 rounded-xl border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Check Records Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-100 text-gray-700 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-4 py-3.5">Check #</th>
                <th className="px-4 py-3.5">Voucher #</th>
                <th className="px-4 py-3.5">Printed Date</th>
                <th className="px-4 py-3.5">Payee Name</th>
                <th className="px-4 py-3.5">Disbursed Amount</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              {filteredChecks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No printed check records found.
                  </td>
                </tr>
              ) : (
                filteredChecks.map((chk) => {
                  const auditLogs = getCheckAuditLogs(chk.voucherNumber);
                  return (
                    <tr key={chk.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-extrabold text-blue-700">
                        {chk.checkNumber}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-500">
                        {chk.voucherNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(chk.printedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {chk.payee}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        ₱{chk.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={chk.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Audit Trail Button */}
                          <button
                            onClick={() => setSelectedCheckVoucherNum(chk.voucherNumber)}
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-semibold text-[11px] flex items-center space-x-1"
                            title="View Print History Log"
                          >
                            <History className="w-3.5 h-3.5 text-gray-600" />
                            <span className="hidden lg:inline">Logs ({auditLogs.length})</span>
                          </button>

                          {chk.status === 'Printed' && (
                            <>
                              <button
                                onClick={() => setReprintingCheckId(chk.id)}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-[11px] font-semibold flex items-center space-x-1"
                                title="Reprint Check"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Reprint</span>
                              </button>

                              <button
                                onClick={() => setVoidingCheckId(chk.id)}
                                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-md text-[11px] font-semibold flex items-center space-x-1"
                                title="Void Check"
                              >
                                <Ban className="w-3 h-3" />
                                <span>Void</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reprint Modal */}
      {reprintingCheckId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-sm text-gray-900 flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <span>Reprint Check Confirmation</span>
              </h3>
              <button onClick={() => setReprintingCheckId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>For audit compliance, state the reason for re-printing this physical check.</span>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-gray-700">Reason for Reprinting</label>
              <select
                value={reprintReason}
                onChange={(e) => setReprintReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="Printer paper jam / spoiled check stock">Printer paper jam / spoiled check stock</option>
                <option value="Misaligned text alignment">Misaligned text alignment</option>
                <option value="Printer ink smudged or faded">Printer ink smudged or faded</option>
                <option value="Damaged paper stock during feeding">Damaged paper stock during feeding</option>
                <option value="Authorized re-issuance">Authorized re-issuance</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setReprintingCheckId(null)}
                className="px-3 py-1.5 border border-gray-300 text-xs font-semibold rounded text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReprint}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded"
              >
                Confirm Reprint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check Audit Trail Modal */}
      {selectedCheckVoucherNum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="font-bold text-sm text-gray-900 flex items-center space-x-2">
                <History className="w-4 h-4 text-purple-600" />
                <span>Check Printing Audit Log: {selectedCheckVoucherNum}</span>
              </h3>
              <button onClick={() => setSelectedCheckVoucherNum(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {getCheckAuditLogs(selectedCheckVoucherNum).length === 0 ? (
                <p className="text-xs text-gray-500 py-4 text-center">No print audit logs recorded for this voucher.</p>
              ) : (
                getCheckAuditLogs(selectedCheckVoucherNum).map((log) => (
                  <div key={log.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-gray-900">
                      <span>Check #{log.checkNumber} (Print Count: {log.printCount})</span>
                      <span className="text-[10px] text-gray-400 font-mono">{new Date(log.printedDate).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-600">Printed by: <strong>{log.printedByName}</strong> ({log.bank})</p>
                    <p className="text-gray-500 text-[11px]">Printer Device: {log.printerName} | Calibration: {log.alignmentVersion}</p>
                    {log.reprinted && (
                      <p className="text-amber-800 font-semibold bg-amber-100/60 p-1 rounded text-[11px] mt-1">
                        Reprint Reason: {log.reason}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCheckVoucherNum(null)}
                className="px-4 py-1.5 bg-gray-800 text-white rounded text-xs font-semibold"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Void Dialog */}
      <ConfirmDialog
        isOpen={!!voidingCheckId}
        onClose={() => setVoidingCheckId(null)}
        onConfirm={() => {
          if (voidingCheckId) voidCheck(voidingCheckId);
        }}
        title="Void Printed Check?"
        message="Are you sure you want to void this check record? This action will mark the check as VOID in official financial logs."
        confirmLabel="Void Check"
      />
    </div>
  );
};
