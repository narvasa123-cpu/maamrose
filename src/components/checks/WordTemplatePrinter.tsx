import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Printer, 
  Download, 
  Tag, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles, 
  AlertCircle, 
  FileCheck, 
  Save, 
  Trash2,
  Sliders,
  Eye,
  FileCode,
  Building
} from 'lucide-react';
import { useVoucher } from '../../context/VoucherContext';
import { WordCheckTemplate } from '../../types';
import { 
  extractTagsFromDocx, 
  fillDocxTemplate, 
  convertDocxToHtml, 
  downloadDocxBlob, 
  createSampleWordCheckTemplate,
  CheckTemplateData
} from '../../services/wordTemplateService';
import { convertAmountToWords } from '../../services/numberToWords';

interface WordTemplatePrinterProps {
  voucherId?: string;
}

export const WordTemplatePrinter: React.FC<WordTemplatePrinterProps> = ({ voucherId }) => {
  const { vouchers, recordPrintedCheck, settings, updateSettings, logActivity } = useVoucher();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected Voucher for printing
  const approvedVouchers = vouchers.filter(v => v.status === 'Approved' || v.id === voucherId);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string>(
    voucherId || (approvedVouchers[0]?.id || vouchers[0]?.id || '')
  );
  const activeVoucher = vouchers.find(v => v.id === selectedVoucherId);

  // Form Fields
  const [checkNumber, setCheckNumber] = useState(`CHK-${Math.floor(100000 + Math.random() * 900000)}`);
  const [bankName, setBankName] = useState(settings.defaultBankName || 'METROBANK DISBURSEMENT');
  const [date, setDate] = useState(activeVoucher?.date || new Date().toISOString().split('T')[0]);
  const [payee, setPayee] = useState(activeVoucher?.payee || 'ACME SUPPLIES & TRADING CORP.');
  const [amount, setAmount] = useState<number>(activeVoucher?.amount || 125000.50);
  const [memo, setMemo] = useState(activeVoucher ? `Payment for Voucher #${activeVoucher.voucherNumber}` : 'Full Settlement of Invoice #9921');

  // Word Template State
  const [currentDocxArrayBuffer, setCurrentDocxArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [templateFileName, setTemplateFileName] = useState<string>('Default_Word_Check_Template.docx');
  const [detectedTags, setDetectedTags] = useState<string[]>([]);
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [filledDocxBuffer, setFilledDocxBuffer] = useState<ArrayBuffer | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showTagMapping, setShowTagMapping] = useState<boolean>(false);

  // Saved Templates list from Settings
  const savedTemplates = settings.savedWordTemplates || [];
  const [activeTemplateId, setActiveTemplateId] = useState<string>(settings.activeWordTemplateId || '');

  // Tag Mapping State
  const [customMappings, setCustomMappings] = useState<Record<string, string>>({
    check_number: 'check_number',
    date: 'date',
    payee: 'payee',
    amount: 'amount',
    amount_in_words: 'amount_in_words',
    bank_name: 'bank_name',
    memo: 'memo',
    voucher_number: 'voucher_number'
  });

  // Load active voucher defaults when selection changes
  useEffect(() => {
    if (activeVoucher) {
      setDate(activeVoucher.date);
      setPayee(activeVoucher.payee);
      setAmount(activeVoucher.amount);
      setMemo(`Disbursal for Voucher #${activeVoucher.voucherNumber}`);
    }
  }, [activeVoucher]);

  // Load default sample template on initial mount
  useEffect(() => {
    loadDefaultSampleTemplate();
  }, []);

  const loadDefaultSampleTemplate = async () => {
    setIsProcessing(true);
    try {
      const sampleBuffer = createSampleWordCheckTemplate();
      setCurrentDocxArrayBuffer(sampleBuffer);
      setTemplateFileName('Standard_Check_Layout.docx');
      
      const tags = await extractTagsFromDocx(sampleBuffer);
      setDetectedTags(tags.length > 0 ? tags : ['check_number', 'date', 'payee', 'amount', 'amount_in_words', 'bank_name', 'memo']);
    } catch (err) {
      console.error('Failed loading sample template:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-fill and render preview whenever data, template, or mappings change
  useEffect(() => {
    if (!currentDocxArrayBuffer) return;

    const updatePreview = async () => {
      try {
        const amountWords = convertAmountToWords(amount, 'PHP');
        const templateData: CheckTemplateData = {
          check_number: checkNumber,
          date: date,
          payee: payee.toUpperCase(),
          amount: `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          amount_in_words: amountWords,
          bank_name: bankName,
          memo: memo,
          voucher_number: activeVoucher?.voucherNumber || 'VR-2026-0101',
          department: activeVoucher?.department || 'Accounting',
          company_name: settings.companyName || 'CHECK & VOUCHER INC.'
        };

        const filledBuffer = fillDocxTemplate(currentDocxArrayBuffer, templateData, customMappings);
        setFilledDocxBuffer(filledBuffer);

        const html = await convertDocxToHtml(filledBuffer);
        setRenderedHtml(html);
        setErrorMsg(null);
      } catch (err: any) {
        console.error('Error rendering template preview:', err);
        setErrorMsg(err.message || 'Error processing Word template file');
      }
    };

    updatePreview();
  }, [currentDocxArrayBuffer, checkNumber, date, payee, amount, bankName, memo, customMappings, activeVoucher, settings]);

  // Handle uploading custom .docx file
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      setErrorMsg('Please select a valid Microsoft Word document (.docx file).');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        if (buffer) {
          setCurrentDocxArrayBuffer(buffer);
          setTemplateFileName(file.name);

          // Extract tags from docx file
          const tags = await extractTagsFromDocx(buffer);
          setDetectedTags(tags);

          // Initialize custom mappings
          const initialMap: Record<string, string> = {};
          tags.forEach(tag => {
            const lower = tag.toLowerCase();
            if (lower.includes('payee') || lower.includes('name')) initialMap[tag] = 'payee';
            else if (lower.includes('amount') && (lower.includes('word') || lower.includes('text'))) initialMap[tag] = 'amount_in_words';
            else if (lower.includes('amount') || lower.includes('num') || lower.includes('figure')) initialMap[tag] = 'amount';
            else if (lower.includes('date')) initialMap[tag] = 'date';
            else if (lower.includes('check') || lower.includes('chk')) initialMap[tag] = 'check_number';
            else if (lower.includes('bank')) initialMap[tag] = 'bank_name';
            else if (lower.includes('memo') || lower.includes('part') || lower.includes('desc')) initialMap[tag] = 'memo';
            else if (lower.includes('voucher') || lower.includes('vch')) initialMap[tag] = 'voucher_number';
            else initialMap[tag] = 'payee';
          });

          setCustomMappings(initialMap);

          // Save template into settings
          saveTemplateToSettings(file.name, file.size, buffer, tags, initialMap);
          logActivity('WORD_TEMPLATE_UPLOADED', `Uploaded Word check template "${file.name}" with ${tags.length} detected tags`, 'CHECK');
        }
        setIsProcessing(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      console.error('Error reading uploaded docx file:', err);
      setErrorMsg('Could not parse Word template file. Please ensure it is a valid .docx file.');
      setIsProcessing(false);
    }
  };

  // Convert ArrayBuffer to Base64 for storing template in settings
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // Save template into System Settings library
  const saveTemplateToSettings = (
    fileName: string, 
    fileSize: number, 
    buffer: ArrayBuffer, 
    tags: string[], 
    mappings: Record<string, string>
  ) => {
    const base64 = arrayBufferToBase64(buffer);
    const newTemplate: WordCheckTemplate = {
      id: `tmpl-${Date.now()}`,
      name: fileName.replace('.docx', '').replace(/_/g, ' '),
      fileName: fileName,
      fileSize: fileSize,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Current User',
      base64Data: base64,
      detectedTags: tags,
      fieldMappings: mappings,
      isDefault: false
    };

    const updatedList = [newTemplate, ...savedTemplates.filter(t => t.fileName !== fileName)];
    updateSettings({
      savedWordTemplates: updatedList,
      activeWordTemplateId: newTemplate.id
    });
    setActiveTemplateId(newTemplate.id);
  };

  // Load a previously saved template from library
  const handleSelectSavedTemplate = (tmpl: WordCheckTemplate) => {
    if (tmpl.base64Data) {
      try {
        const buffer = base64ToArrayBuffer(tmpl.base64Data);
        setCurrentDocxArrayBuffer(buffer);
        setTemplateFileName(tmpl.fileName);
        setDetectedTags(tmpl.detectedTags || []);
        if (tmpl.fieldMappings) {
          setCustomMappings(tmpl.fieldMappings);
        }
        setActiveTemplateId(tmpl.id);
        updateSettings({ activeWordTemplateId: tmpl.id });
      } catch (err) {
        console.error('Failed loading saved template buffer:', err);
      }
    }
  };

  const handleDeleteSavedTemplate = (tmplId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedTemplates.filter(t => t.id !== tmplId);
    updateSettings({ savedWordTemplates: updated });
    if (activeTemplateId === tmplId) {
      loadDefaultSampleTemplate();
    }
  };

  // Trigger Browser Print
  const handlePrint = () => {
    if (!checkNumber || !payee || amount <= 0) {
      alert('Please provide a valid Check Number, Payee Name, and Amount.');
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

    window.print();
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 5000);
  };

  // Download filled .docx file
  const handleDownloadDocx = () => {
    if (!filledDocxBuffer) return;
    const cleanFileName = `Filled_Check_${checkNumber}_${payee.replace(/\s+/g, '_')}.docx`;
    downloadDocxBlob(filledDocxBuffer, cleanFileName);
    logActivity('WORD_CHECK_DOWNLOADED', `Downloaded populated Word check document "${cleanFileName}"`, 'CHECK');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls Header */}
      <div className="p-5 bg-white rounded-xl border border-gray-200 border-l-4 border-l-blue-600 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
              <FileCode className="w-3 h-3" />
              <span>Microsoft Word (.docx) Engine</span>
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 mt-1">
            Word Check Template Studio
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 max-w-xl">
            Upload your organization's Microsoft Word (.docx) check template file. Placeholders like <code className="bg-gray-100 text-blue-600 px-1 py-0.5 rounded">{"{{payee}}"}</code> and <code className="bg-gray-100 text-blue-600 px-1 py-0.5 rounded">{"{{amount}}"}</code> are populated automatically for instant browser printing or docx downloading.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".docx"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload .docx Template</span>
          </button>

          <button
            onClick={handleDownloadDocx}
            disabled={!filledDocxBuffer}
            className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-semibold text-xs rounded-md flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Download .docx Check</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {isSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-3 text-emerald-800 text-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">
            Check #{checkNumber} printed successfully and recorded in disbursement audit logs!
          </span>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 text-red-700 text-xs">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: Check Details Form + Word Template Controls + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form & Saved Templates */}
        <div className="space-y-6">
          {/* Form Card */}
          <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider pb-3 border-b border-gray-100 flex items-center justify-between">
              <span>Check Field Input Data</span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                Auto-Substituted
              </span>
            </h2>

            {/* Select Voucher */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">
                Select Voucher Source
              </label>
              <select
                value={selectedVoucherId}
                onChange={(e) => setSelectedVoucherId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-gray-50 rounded-md border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Manual Entry --</option>
                {vouchers.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.voucherNumber} — {v.payee} (₱{v.amount.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Check Number & Bank Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Check #</label>
                <input
                  type="text"
                  value={checkNumber}
                  onChange={(e) => setCheckNumber(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-gray-50 rounded-md border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 rounded-md border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-1.5 text-xs font-bold bg-gray-50 rounded-md border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Amount & Check Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Amount (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs font-bold text-blue-700 bg-gray-50 rounded-md border border-gray-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Check Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 rounded-md border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Memo / Particulars */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Memo / Particulars</label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 rounded-md border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Amount in words generated */}
            <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-md text-[11px]">
              <span className="font-semibold text-blue-900 block">Amount in Words:</span>
              <span className="text-blue-800 italic">{convertAmountToWords(amount, 'PHP')}</span>
            </div>

            {/* Print Trigger Button */}
            <button
              onClick={handlePrint}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold shadow-xs flex items-center justify-center space-x-2 transition-colors mt-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Filled Word Check</span>
            </button>
          </div>

          {/* Saved Templates Library Card */}
          <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center space-x-1.5">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>Template Library ({savedTemplates.length})</span>
              </h3>
              <button
                onClick={loadDefaultSampleTemplate}
                className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Default</span>
              </button>
            </div>

            {savedTemplates.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">
                No custom Word templates uploaded yet. Upload a .docx check template to save it to your library.
              </p>
            ) : (
              <div className="space-y-2">
                {savedTemplates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => handleSelectSavedTemplate(tmpl)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                      activeTemplateId === tmpl.id
                        ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate font-medium">{tmpl.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {tmpl.fileName} • {tmpl.detectedTags?.length || 0} tags
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSavedTemplate(tmpl.id, e)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Columns: Live Document Preview & Tag Inspector */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Active Template Bar & Tag Mapper Toggle */}
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                DOCX
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">
                  Active Template: {templateFileName}
                </p>
                <p className="text-[10px] text-gray-500">
                  {detectedTags.length > 0 
                    ? `Detected ${detectedTags.length} placeholders: ${detectedTags.slice(0, 5).join(', ')}${detectedTags.length > 5 ? '...' : ''}` 
                    : 'Standard field tags mapped'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowTagMapping(!showTagMapping)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border flex items-center space-x-1.5 transition-colors ${
                  showTagMapping 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>{showTagMapping ? 'Hide Tag Mappings' : 'Inspect Tag Mappings'}</span>
              </button>

              <button
                onClick={handleDownloadDocx}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .docx</span>
              </button>
            </div>
          </div>

          {/* Collapsible Tag Inspector / Field Mapper */}
          {showTagMapping && (
            <div className="p-4 bg-gray-900 text-gray-100 rounded-xl shadow-lg border border-gray-800 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sliders className="w-4 h-4" />
                  <span>Word Placeholder Tag Inspector</span>
                </h3>
                <span className="text-[10px] text-gray-400">
                  Map extracted tags from your uploaded Word file to voucher fields
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {detectedTags.map((tag) => (
                  <div key={tag} className="p-2 bg-gray-800 rounded-md border border-gray-700 space-y-1">
                    <span className="font-mono text-amber-300 font-bold text-[11px] block truncate">
                      {"{{"}{tag}{"}}"}
                    </span>
                    <select
                      value={customMappings[tag] || 'payee'}
                      onChange={(e) => setCustomMappings({ ...customMappings, [tag]: e.target.value })}
                      className="w-full px-2 py-1 bg-gray-900 border border-gray-700 text-gray-200 rounded text-[11px] focus:ring-1 focus:ring-amber-400"
                    >
                      <option value="check_number">Check Number</option>
                      <option value="date">Check Date</option>
                      <option value="payee">Payee Name</option>
                      <option value="amount">Amount (Figures)</option>
                      <option value="amount_in_words">Amount (In Words)</option>
                      <option value="bank_name">Bank Name</option>
                      <option value="memo">Memo / Particulars</option>
                      <option value="voucher_number">Voucher Number</option>
                      <option value="department">Department</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Rendered Document Viewport */}
          <div className="p-6 bg-gray-100 rounded-xl border border-gray-200 flex flex-col items-center justify-start min-h-[420px] overflow-auto">
            <div className="w-full max-w-[720px] flex items-center justify-between mb-3 text-xs text-gray-500">
              <span className="font-bold uppercase tracking-wider flex items-center space-x-1">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>Live Browser Print Preview</span>
              </span>
              <span className="text-[11px] bg-white px-2 py-0.5 rounded border border-gray-200">
                Paper: Letter / Check Stock (8.5" x 3.5")
              </span>
            </div>

            {/* Rendered HTML Container targeting Browser Print Media */}
            <div 
              id="word-template-print-area"
              className="w-full max-w-[720px] min-h-[280px] bg-white p-8 rounded-lg shadow-md border border-gray-300 text-gray-900 font-serif leading-relaxed text-sm overflow-auto"
            >
              {isProcessing ? (
                <div className="py-12 text-center text-gray-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                  <p className="text-xs">Processing Word Template & Substituting Check Tags...</p>
                </div>
              ) : (
                <div 
                  className="prose prose-sm max-w-none check-word-preview"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }} 
                />
              )}
            </div>

            <p className="text-[10px] text-gray-400 mt-3 text-center italic">
              Ready to print! Clicking "Print Filled Word Check" outputs this formatted Word layout straight to your printer tray.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
