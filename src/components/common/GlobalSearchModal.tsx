import React, { useState, useEffect } from 'react';
import { Search, X, FileText, Archive, CheckSquare, Paperclip, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useVoucher } from '../../context/VoucherContext';
import { GlobalSearchResult } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult?: (result: GlobalSearchResult) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onSelectResult }) => {
  const { globalSearch } = useVoucher();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);

  useEffect(() => {
    if (query.trim().length >= 2) {
      setResults(globalSearch(query));
    } else {
      setResults([]);
    }
  }, [query, globalSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getTypeIcon = (type: GlobalSearchResult['type']) => {
    switch (type) {
      case 'voucher':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'archive':
        return <Archive className="w-4 h-4 text-amber-600" />;
      case 'check':
        return <CheckSquare className="w-4 h-4 text-emerald-600" />;
      case 'document':
        return <Paperclip className="w-4 h-4 text-purple-600" />;
    }
  };

  const getTypeBadge = (type: GlobalSearchResult['type']) => {
    switch (type) {
      case 'voucher':
        return <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">Active Voucher</span>;
      case 'archive':
        return <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Archived Record</span>;
      case 'check':
        return <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">Printed Check</span>;
      case 'document':
        return <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">Attachment</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Box */}
        <div className="p-4 border-b border-gray-200 flex items-center space-x-3 bg-gray-50/50">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search active vouchers, historical archives, checks, payee, or documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-sm font-medium text-gray-900 focus:outline-none placeholder-gray-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-200 rounded border border-gray-300">
            ESC to close
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-gray-100">
          {query.trim().length < 2 ? (
            <div className="text-center py-10 text-gray-400">
              <Search className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-xs font-medium">Type at least 2 characters to search across all records</p>
              <p className="text-[11px] text-gray-400 mt-1">Searches Active Vouchers, Archived Records, Check Numbers, Payees, Amounts & Documents</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p className="text-sm font-bold">No matching records found</p>
              <p className="text-xs text-gray-400 mt-1">No matches for "{query}" across active or archived databases.</p>
            </div>
          ) : (
            results.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => {
                  if (onSelectResult) onSelectResult(item);
                  onClose();
                }}
                className="pt-2 first:pt-0 pb-2 group flex items-start justify-between p-3 rounded-lg hover:bg-blue-50/60 cursor-pointer transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-md bg-gray-100 group-hover:bg-white group-hover:shadow-xs transition-all mt-0.5">
                    {getTypeIcon(item.type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-gray-900 group-hover:text-blue-700">
                        {item.title}
                      </span>
                      {getTypeBadge(item.type)}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{item.subtitle}</p>
                    <div className="flex items-center space-x-3 text-[11px] text-gray-400 mt-1">
                      <span>Date: {item.date}</span>
                      {item.matchedField && <span>• Matched in: <strong className="text-gray-600">{item.matchedField}</strong></span>}
                    </div>
                  </div>
                </div>

                <div className="text-right flex items-center space-x-2">
                  <span className="text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <CornerDownLeft className="w-3 h-3 text-gray-400" />
              <span>Select record</span>
            </span>
            <span>{results.length} total matches</span>
          </div>
          <button onClick={onClose} className="hover:text-gray-800 text-xs font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
