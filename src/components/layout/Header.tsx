import React, { useState } from 'react';
import { Menu, Search, Bell, PlusCircle, Calendar, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useVoucher } from '../../context/VoucherContext';
import { useNavigate } from 'react-router-dom';
import { GlobalSearchModal } from '../common/GlobalSearchModal';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  onOpenCreateVoucherModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileSidebar, onOpenCreateVoucherModal }) => {
  const { user } = useAuth();
  const { isFirestoreConnected } = useVoucher();
  const navigate = useNavigate();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left side: Mobile menu & Quick Search */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Toggle Sidebar Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Trigger Button */}
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="hidden sm:flex items-center justify-between w-64 lg:w-80 px-3 py-1.5 bg-gray-100 hover:bg-gray-200/80 text-gray-500 rounded-full text-xs font-medium transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <span>Search active & archived records...</span>
            </div>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-white rounded border border-gray-200 shadow-2xs">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center space-x-3">
          {/* Live Database Indicator */}
          <div className="hidden lg:flex items-center space-x-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-200">
            <Database className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Firestore: {isFirestoreConnected ? 'Live Database' : 'Connecting...'}</span>
          </div>

          {/* Date Display */}
          <div className="hidden md:flex items-center space-x-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-medium">{currentDateStr}</span>
          </div>

          {/* Quick Action Button */}
          {onOpenCreateVoucherModal && (
            <button
              onClick={onOpenCreateVoucherModal}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">New Voucher</span>
            </button>
          )}

          {/* Role Badge Indicator */}
          <div className="flex items-center space-x-3 border-l border-gray-200 pl-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-gray-900 leading-none">
                {user?.displayName}
              </p>
              <p className="text-[10px] text-gray-500 font-medium capitalize mt-0.5">
                {user?.department || 'Finance & Accounting'}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
            </div>
          </div>
        </div>
      </header>

      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectResult={(item) => {
          if (item.type === 'archive') {
            navigate('/archive');
          } else if (item.type === 'voucher') {
            navigate('/vouchers');
          } else if (item.type === 'check') {
            navigate('/checks');
          }
        }}
      />
    </>
  );
};

