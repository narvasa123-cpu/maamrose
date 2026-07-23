import React, { useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { useVoucher } from '../context/VoucherContext';
import { Settings, Save, CheckCircle2, Building, Type, Hash, HardDrive, MapPin, Plus, FileText } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    numberingSettings, 
    updateNumberingSettings,
    storageLocations,
    addStorageLocation,
    storageAnalytics
  } = useVoucher();

  // Settings state
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [companyAddress, setCompanyAddress] = useState(settings.companyAddress);
  const [companyPhone, setCompanyPhone] = useState(settings.companyPhone);
  const [defaultBankName, setDefaultBankName] = useState(settings.defaultBankName);
  const [alignment, setAlignment] = useState(settings.checkAlignment);

  // Numbering state
  const [numMode, setNumMode] = useState(numberingSettings.mode);
  const [prefix, setPrefix] = useState(numberingSettings.prefix);
  const [includeYear, setIncludeYear] = useState(numberingSettings.includeYear);
  const [nextSeq, setNextSeq] = useState(numberingSettings.nextSequence);
  const [seqLen, setSeqLen] = useState(numberingSettings.sequenceLength);

  // New storage location form state
  const [boxName, setBoxName] = useState('');
  const [rack, setRack] = useState('Rack 1');
  const [shelf, setShelf] = useState('Shelf A');
  const [capacity, setCapacity] = useState('500');

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      companyName,
      companyAddress,
      companyPhone,
      defaultBankName,
      checkAlignment: alignment
    });

    updateNumberingSettings({
      mode: numMode,
      prefix,
      includeYear,
      nextSequence: nextSeq,
      sequenceLength: seqLen
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boxName.trim()) return;

    addStorageLocation({
      boxName: boxName.trim().toUpperCase(),
      rack,
      shelf,
      capacity: parseInt(capacity) || 500
    });

    setBoxName('');
  };

  return (
    <AdminLayout>
      <form onSubmit={handleSave} className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <span>System Settings & Configuration Studio</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Manage organization metadata, voucher numbering format, check stock alignment, and archival physical storage locations
            </p>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save All Configurations</span>
          </button>
        </div>

        {isSaved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>System configurations, voucher numbering sequence, and check alignment settings saved successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 1: Company Metadata */}
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-gray-100 pb-3">
              <Building className="w-4 h-4 text-blue-500" />
              <span>Company & Organization Profile</span>
            </h2>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Organization Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Office Address</label>
              <input
                type="text"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Phone Contact</label>
                <input
                  type="text"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Default Disbursal Bank</label>
                <input
                  type="text"
                  value={defaultBankName}
                  onChange={(e) => setDefaultBankName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-50 rounded-xl border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Flexible Voucher Numbering Configuration */}
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-gray-100 pb-3">
              <Hash className="w-4 h-4 text-amber-600" />
              <span>Voucher Numbering Sequence & Format</span>
            </h2>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Numbering Strategy Mode</label>
              <select
                value={numMode}
                onChange={(e) => setNumMode(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-gray-50 rounded-xl border border-gray-200 text-gray-900 font-semibold"
              >
                <option value="Hybrid">Hybrid (Auto-Suggest with Manual Override & Dup Warnings)</option>
                <option value="Auto">Auto-Generated Sequential Only</option>
                <option value="Manual">Manual Entry Only</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Default Prefix</label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-gray-50 rounded-xl border border-gray-200 text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Next Auto Sequence #</label>
                <input
                  type="number"
                  value={nextSeq}
                  onChange={(e) => setNextSeq(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-gray-50 rounded-xl border border-gray-200 text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Sequence Padding Length</label>
                <input
                  type="number"
                  value={seqLen}
                  onChange={(e) => setSeqLen(parseInt(e.target.value) || 6)}
                  className="w-full px-3 py-2 text-xs font-mono bg-gray-50 rounded-xl border border-gray-200 text-gray-900"
                />
              </div>

              <div className="pt-4 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="incYear"
                  checked={includeYear}
                  onChange={(e) => setIncludeYear(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor="incYear" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Include Current Year in Number
                </label>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 font-mono">
              <strong>Preview Next Number: </strong> 
              {prefix}{includeYear ? `${new Date().getFullYear()}-` : ''}{nextSeq.toString().padStart(seqLen, '0')}
            </div>
          </div>

          {/* Section 3: Pre-Printed Check Stock Alignment */}
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-gray-100 pb-3">
              <Type className="w-4 h-4 text-purple-600" />
              <span>Check Paper Calibration Defaults</span>
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Check Width (mm)</label>
                <input
                  type="number"
                  value={alignment.checkWidthMm}
                  onChange={(e) => setAlignment({ ...alignment, checkWidthMm: parseFloat(e.target.value) || 210 })}
                  className="w-full px-3 py-2 text-xs font-mono bg-gray-50 rounded-xl border border-gray-200 text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Check Height (mm)</label>
                <input
                  type="number"
                  value={alignment.checkHeightMm}
                  onChange={(e) => setAlignment({ ...alignment, checkHeightMm: parseFloat(e.target.value) || 95 })}
                  className="w-full px-3 py-2 text-xs font-mono bg-gray-50 rounded-xl border border-gray-200 text-gray-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Printer Check Font</label>
              <select
                value={alignment.fontFamily}
                onChange={(e) => setAlignment({ ...alignment, fontFamily: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-gray-50 rounded-xl border border-gray-200 text-gray-900"
              >
                <option value="Courier New, monospace">Courier New (Standard Check Mono)</option>
                <option value="Arial, sans-serif">Arial Sans</option>
                <option value="Times New Roman, serif">Times New Roman Serif</option>
              </select>
            </div>
          </div>

          {/* Section 4: Archival Physical Storage Box Manager & Storage Analytics */}
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-gray-100 pb-3">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              <span>Digital Document Storage Analytics</span>
            </h2>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Total Attachments</span>
                <p className="text-base font-bold text-gray-900 mt-1">{storageAnalytics.totalDocumentsCount} files</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Storage Used</span>
                <p className="text-base font-bold text-blue-700 mt-1">{(storageAnalytics.totalSizeBytes / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Average File Size</span>
                <p className="text-base font-bold text-emerald-700 mt-1">{(storageAnalytics.averageFileSizeBytes / 1024).toFixed(1)} KB</p>
              </div>
            </div>

            {/* Storage Locations Manager */}
            <div className="pt-2">
              <label className="text-xs font-bold text-gray-800 block mb-2">Physical Storage Boxes ({storageLocations.length})</label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto mb-3">
                {storageLocations.map((loc) => (
                  <div key={loc.id} className="p-2 bg-purple-50/50 rounded border border-purple-100 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-purple-900">{loc.boxName}</span>
                    <span className="text-[11px] text-gray-500">{loc.rack} — {loc.shelf}</span>
                    <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">Cap: {loc.capacity}</span>
                  </div>
                ))}
              </div>

              {/* Add New Box Form */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  placeholder="BOX-2026-NEW"
                  value={boxName}
                  onChange={(e) => setBoxName(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs font-mono border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 uppercase"
                />
                <button
                  type="button"
                  onClick={handleAddLocation}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Box</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};
