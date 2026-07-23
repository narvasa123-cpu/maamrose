import React, { useState, useEffect } from 'react';
import { VoucherRecord } from '../../types';
import { useVoucher } from '../../context/VoucherContext';
import { convertAmountToWords } from '../../services/numberToWords';
import { WordTemplatePrinter } from './WordTemplatePrinter';
import { 
  Printer, 
  Settings2, 
  Grid, 
  CheckCircle2, 
  FileCode,
  SlidersHorizontal
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export const CheckPrinter: React.FC = () => {
  const { vouchers, recordPrintedCheck, settings, updateSettings } = useVoucher();
  const [searchParams] = useSearchParams();

  // Print Mode State: default to Word template mode as requested!
  const [printMode, setPrintMode] = useState<'docx' | 'alignment'>('docx');

  // Selected Voucher for Printing
  const preselectedVoucherId = searchParams.get('voucherId');
  const approvedVouchers = vouchers.filter(v => v.status === 'Approved' || v.id === preselectedVoucherId);

  const [selectedVoucherId, setSelectedVoucherId] = useState<string>(
    preselectedVoucherId || (approvedVouchers[0]?.id || '')
  );

  const activeVoucher = vouchers.find(v => v.id === selectedVoucherId);

  // Check form inputs for Alignment mode
  const [checkNumber, setCheckNumber] = useState(`CHK-${Math.floor(100000 + Math.random() * 900000)}`);
  const [bankName, setBankName] = useState(settings.defaultBankName);
  const [date, setDate] = useState(activeVoucher?.date || new Date().toISOString().split('T')[0]);
  const [payee, setPayee] = useState(activeVoucher?.payee || '');
  const [amount, setAmount] = useState<number>(activeVoucher?.amount || 0);
  const [memo, setMemo] = useState(activeVoucher ? `Payment for Voucher #${activeVoucher.voucherNumber}` : '');

  // Alignment configuration state
  const [alignment, setAlignment] = useState(settings.checkAlignment);
  const [showGrid, setShowGrid] = useState(true);
  const [showTuner, setShowTuner] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (activeVoucher) {
      setDate(activeVoucher.date);
      setPayee(activeVoucher.payee);
      setAmount(activeVoucher.amount);
      setMemo(`Disbursal for Voucher #${activeVoucher.voucherNumber}`);
    }
  }, [activeVoucher]);

  const amountInWords = convertAmountToWords(amount, 'PHP');

  const handlePrintTrigger = () => {
    if (!checkNumber.trim() || !payee.trim() || amount <= 0) {
      alert("Please enter a valid Check Number, Payee, and Amount.");
      return;
    }

    if (activeVoucher) {
      recordPrintedCheck({
        voucherId: activeVoucher.id,
        checkNumber,
        bankName,
        memo,
        date
      });
    }

    // Trigger browser printing window
    window.print();

    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 4000);
  };

  const handleSaveAlignment = () => {
    updateSettings({
      checkAlignment: alignment
    });
    alert("Check alignment calibration saved to system settings.");
  };

  return (
    <div className="space-y-6">
      {/* Top Printing Engine Selector Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setPrintMode('docx')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-2 ${
              printMode === 'docx'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileCode className="w-4 h-4 text-blue-600" />
            <span>Word (.docx) Template Mode</span>
          </button>

          <button
            onClick={() => setPrintMode('alignment')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-2 ${
              printMode === 'alignment'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <span>Millimeter Grid Offset Mode</span>
          </button>
        </div>

        {printMode === 'alignment' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold border flex items-center space-x-1.5 transition-colors ${
                showGrid 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>{showGrid ? 'Hide Grid' : 'Show Grid'}</span>
            </button>

            <button
              onClick={() => setShowTuner(!showTuner)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold bg-gray-800 text-white hover:bg-gray-900 transition-colors"
            >
              <Settings2 className="w-4 h-4 inline mr-1" />
              <span>{showTuner ? 'Close Offsets' : 'Fine-Tune Coordinates'}</span>
            </button>
          </div>
        )}
      </div>

      {/* RENDER WORD TEMPLATE MODE */}
      {printMode === 'docx' ? (
        <WordTemplatePrinter voucherId={selectedVoucherId} />
      ) : (
        /* RENDER MILLIMETER ALIGNMENT GRID MODE */
        <div className="space-y-6">
          {/* Header */}
          <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-xs">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
              <Printer className="w-5 h-5 text-blue-600" />
              <span>Pre-Printed Check Stock Alignment Studio</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Position check field text millimeter-by-millimeter onto physical pre-printed bank check stock.
            </p>
          </div>

          {/* Success banner */}
          {isSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-3 text-emerald-800 text-xs animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold">
                Check #{checkNumber} printed successfully and recorded in audit logs!
              </span>
            </div>
          )}

          {/* Form & Config Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Voucher Selector & Check Form */}
            <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-xs space-y-4">
              <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider pb-3 border-b border-gray-100 flex items-center justify-between">
                <span>Check Printing Details</span>
                <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  Live Input
                </span>
              </h2>

              {/* Select Voucher */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">
                  Select Approved Voucher
                </label>
                <select
                  value={selectedVoucherId}
                  onChange={(e) => setSelectedVoucherId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 rounded-md border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Voucher Record --</option>
                  {vouchers.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.voucherNumber} — {v.payee} (₱{v.amount.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Check Number & Bank */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Check #</label>
                  <input
                    type="text"
                    value={checkNumber}
                    onChange={(e) => setCheckNumber(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-gray-50 rounded-md border border-gray-200 text-gray-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 rounded-md border border-gray-200 text-gray-900"
                  />
                </div>
              </div>

              {/* Payee Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Payee Name</label>
                <input
                  type="text"
                  value={payee}
                  onChange={(e) => setPayee(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-bold bg-gray-50 rounded-md border border-gray-200 text-gray-900"
                />
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Amount (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs font-bold bg-gray-50 rounded-md border border-gray-200 text-gray-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Check Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 rounded-md border border-gray-200 text-gray-900"
                  />
                </div>
              </div>

              {/* Memo */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Memo / Particulars</label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 rounded-md border border-gray-200 text-gray-900"
                />
              </div>

              {/* Print Trigger */}
              <div className="pt-2">
                <button
                  onClick={handlePrintTrigger}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold shadow-xs flex items-center justify-center space-x-2 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Check Now</span>
                </button>
              </div>
            </div>

            {/* Right 2 Columns: Live Check Preview & Alignment Tuner */}
            <div className="lg:col-span-2 space-y-4">
              {/* Fine Tuning Offsets Panel */}
              {showTuner && (
                <div className="p-4 bg-gray-900 text-gray-100 rounded-xl border border-gray-800 shadow-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Settings2 className="w-4 h-4" />
                      <span>Millimeter Offset Coordinates (X / Y)</span>
                    </h3>
                    <button
                      onClick={handleSaveAlignment}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-[11px] rounded-md transition-colors"
                    >
                      Save Alignment
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] text-gray-400">Date X / Y (mm)</label>
                      <div className="flex space-x-1 mt-1">
                        <input
                          type="number"
                          value={alignment.dateX}
                          onChange={(e) => setAlignment({ ...alignment, dateX: parseFloat(e.target.value) || 0 })}
                          className="w-full p-1 bg-gray-800 text-center rounded border border-gray-700 font-mono text-xs"
                        />
                        <input
                          type="number"
                          value={alignment.dateY}
                          onChange={(e) => setAlignment({ ...alignment, dateY: parseFloat(e.target.value) || 0 })}
                          className="w-full p-1 bg-gray-800 text-center rounded border border-gray-700 font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400">Payee X / Y (mm)</label>
                      <div className="flex space-x-1 mt-1">
                        <input
                          type="number"
                          value={alignment.payeeX}
                          onChange={(e) => setAlignment({ ...alignment, payeeX: parseFloat(e.target.value) || 0 })}
                          className="w-full p-1 bg-gray-800 text-center rounded border border-gray-700 font-mono text-xs"
                        />
                        <input
                          type="number"
                          value={alignment.payeeY}
                          onChange={(e) => setAlignment({ ...alignment, payeeY: parseFloat(e.target.value) || 0 })}
                          className="w-full p-1 bg-gray-800 text-center rounded border border-gray-700 font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400">Amount Num X / Y</label>
                      <div className="flex space-x-1 mt-1">
                        <input
                          type="number"
                          value={alignment.amountNumX}
                          onChange={(e) => setAlignment({ ...alignment, amountNumX: parseFloat(e.target.value) || 0 })}
                          className="w-full p-1 bg-gray-800 text-center rounded border border-gray-700 font-mono text-xs"
                        />
                        <input
                          type="number"
                          value={alignment.amountNumY}
                          onChange={(e) => setAlignment({ ...alignment, amountNumY: parseFloat(e.target.value) || 0 })}
                          className="w-full p-1 bg-gray-800 text-center rounded border border-gray-700 font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400">Amount Words X / Y</label>
                      <div className="flex space-x-1 mt-1">
                        <input
                          type="number"
                          value={alignment.amountWordsLine1X}
                          onChange={(e) => setAlignment({ ...alignment, amountWordsLine1X: parseFloat(e.target.value) || 0 })}
                          className="w-full p-1 bg-gray-800 text-center rounded border border-gray-700 font-mono text-xs"
                        />
                        <input
                          type="number"
                          value={alignment.amountWordsLine1Y}
                          onChange={(e) => setAlignment({ ...alignment, amountWordsLine1Y: parseFloat(e.target.value) || 0 })}
                          className="w-full p-1 bg-gray-800 text-center rounded border border-gray-700 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive Check Canvas Box */}
              <div className="p-4 bg-gray-200 rounded-xl border border-gray-300 flex flex-col items-center justify-center min-h-[300px] overflow-auto">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Pre-Printed Check Stock Alignment Viewport
                </p>

                <div 
                  id="printable-check-area"
                  className={`
                    relative bg-amber-50/90 border-2 border-amber-300/80 rounded-lg shadow-xl text-gray-900 font-mono overflow-hidden transition-all
                    ${showGrid ? 'bg-grid-pattern' : ''}
                  `}
                  style={{
                    width: '100%',
                    maxWidth: '680px',
                    height: '280px',
                    fontFamily: alignment.fontFamily || 'Courier New, monospace'
                  }}
                >
                  <div className="absolute top-4 left-6 pointer-events-none opacity-30 select-none print:hidden">
                    <p className="font-sans font-bold text-xs uppercase tracking-widest text-gray-600">
                      {bankName || 'BANK OF DISBURSEMENT'}
                    </p>
                    <p className="font-sans text-[9px] text-gray-500">PAY TO THE ORDER OF</p>
                  </div>

                  {/* DATE FIELD */}
                  <div 
                    className="absolute font-bold text-xs print-target"
                    style={{
                      left: `${(alignment.dateX / 210) * 100}%`,
                      top: `${(alignment.dateY / 95) * 100}%`
                    }}
                  >
                    {date}
                  </div>

                  {/* PAYEE FIELD */}
                  <div 
                    className="absolute font-extrabold text-sm tracking-wide print-target"
                    style={{
                      left: `${(alignment.payeeX / 210) * 100}%`,
                      top: `${(alignment.payeeY / 95) * 100}%`
                    }}
                  >
                    **{payee.toUpperCase() || 'PAYEE NAME'}**
                  </div>

                  {/* NUMERIC AMOUNT FIELD */}
                  <div 
                    className="absolute font-extrabold text-sm tracking-tight print-target"
                    style={{
                      left: `${(alignment.amountNumX / 210) * 100}%`,
                      top: `${(alignment.amountNumY / 95) * 100}%`
                    }}
                  >
                    ₱{amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>

                  {/* AMOUNT IN WORDS FIELD */}
                  <div 
                    className="absolute font-bold text-xs max-w-[500px] leading-tight print-target"
                    style={{
                      left: `${(alignment.amountWordsLine1X / 210) * 100}%`,
                      top: `${(alignment.amountWordsLine1Y / 95) * 100}%`
                    }}
                  >
                    {amountInWords}
                  </div>

                  {/* MEMO FIELD */}
                  <div 
                    className="absolute font-medium text-xs print-target"
                    style={{
                      left: `${(alignment.memoX / 210) * 100}%`,
                      top: `${(alignment.memoY / 95) * 100}%`
                    }}
                  >
                    {memo}
                  </div>
                </div>

                <p className="text-[10px] text-gray-500 mt-2 italic">
                  Note: When browser prints, background guides are automatically stripped so only check text is transferred onto physical check paper stock.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

