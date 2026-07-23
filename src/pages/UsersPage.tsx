import React, { useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { UserManagement } from '../components/users/UserManagement';
import { ActivityLogs } from '../components/users/ActivityLogs';
import { Users, History } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Accounts & RBAC</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'logs'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Activity Audit Logs</span>
          </button>
        </div>

        {activeTab === 'users' ? <UserManagement /> : <ActivityLogs />}
      </div>
    </AdminLayout>
  );
};
