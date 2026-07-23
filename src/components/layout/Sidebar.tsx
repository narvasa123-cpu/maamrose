import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Printer, 
  BarChart3, 
  Users, 
  History, 
  Settings, 
  ShieldCheck, 
  LogOut, 
  Building2,
  FolderOpen,
  Archive
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { user, isAdmin, logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Voucher Records', path: '/vouchers', icon: FileText },
    { label: 'Check Printing', path: '/checks', icon: Printer },
    { label: 'Archived Records', path: '/archive', icon: Archive },
    { label: 'Financial Reports', path: '/reports', icon: BarChart3 },
    ...(isAdmin ? [
      { label: 'User Management', path: '/users', icon: Users },
      { label: 'Activity Logs', path: '/logs', icon: History },
      { label: 'Check Alignment Settings', path: '/settings', icon: Settings }
    ] : [])
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed top-0 left-0 bottom-0 z-50 w-60 bg-white text-gray-900 flex flex-col border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-gray-900 leading-tight">
                CVMS ADMIN
              </h1>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">
                Voucher & Check Studio
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="p-4 flex-1 overflow-y-auto space-y-1">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Main Menu
          </p>
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) => `
                  flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 font-semibold' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {isAdmin && (
            <>
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2">
                Administration
              </p>
              {navItems.slice(5).map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={({ isActive }) => `
                      flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150
                      ${isActive 
                        ? 'bg-blue-50 text-blue-700 font-semibold' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </>
          )}
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-gray-200 bg-gray-50/80">
          <div className="flex items-center space-x-3 px-1 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">
                {user?.displayName || 'User'}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                {user?.role || 'Staff'} Access
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
