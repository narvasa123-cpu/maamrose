import React, { useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { CheckPrinter } from '../components/checks/CheckPrinter';
import { CheckHistory } from '../components/checks/CheckHistory';
import { Printer, History } from 'lucide-react';

export const CheckPrintingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'printer' | 'history'>('printer');

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Module Sub-Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('printer')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'printer'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Check Printing Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Printed Check Records</span>
          </button>
        </div>

        {activeTab === 'printer' ? <CheckPrinter /> : <CheckHistory />}
      </div>
    </AdminLayout>
  );
};
