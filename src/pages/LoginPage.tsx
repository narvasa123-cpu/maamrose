import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Building2, ShieldCheck, Key, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const LoginPage: React.FC = () => {
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@office.gov.ph');
  const [password, setPassword] = useState('ChangeMe123!');
  const [roleSelection, setRoleSelection] = useState<'admin' | 'staff'>('admin');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Forgot Password modal
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const success = await login(email, roleSelection);
    setLoading(false);

    if (success) {
      navigate('/');
    } else {
      setErrorMsg('Invalid credentials or inactive account status.');
    }
  };

  const handleQuickFill = (govEmail: string, role: 'admin' | 'staff', pass: string) => {
    setEmail(govEmail);
    setPassword(pass);
    setRoleSelection(role);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    await resetPassword(forgotEmail);
    setForgotSuccess(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-center items-center p-4 font-sans">
      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white border border-gray-200 p-8 rounded-xl shadow-xs z-10 relative space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-gray-900 mt-2">
            GOVERNMENT DISBURSEMENT PORTAL
          </h1>
          <p className="text-xs text-gray-500">
            Check Printing & Voucher Record System
          </p>
        </div>

        {/* Office Credentials Switcher */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">
            System Office Accounts:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@office.gov.ph', 'admin', 'ChangeMe123!')}
              className={`p-2 rounded-md text-[11px] font-bold border transition-colors flex items-center justify-center space-x-1 ${
                roleSelection === 'admin' 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Admin Officer</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('staff@office.gov.ph', 'staff', 'Disbursement123!')}
              className={`p-2 rounded-md text-[11px] font-bold border transition-colors flex items-center justify-center space-x-1 ${
                roleSelection === 'staff' 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Disbursement Staff</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
              {errorMsg}
            </div>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@checksystem.com"
                className="w-full pl-9 pr-3 py-2 bg-white text-xs font-medium rounded-md border border-gray-200 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700">Password</label>
              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="text-[11px] text-blue-600 hover:underline font-medium"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-white text-xs font-medium rounded-md border border-gray-200 text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-md shadow-xs flex items-center justify-center space-x-2 transition-all mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[11px] text-gray-400 text-center pt-2">
          Protected by Firebase Auth & Role-Based Access Control (RBAC).
        </p>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotOpen}
        onClose={() => {
          setIsForgotOpen(false);
          setForgotSuccess(false);
        }}
        title="Reset Account Password"
        maxWidth="sm"
      >
        {forgotSuccess ? (
          <div className="space-y-3 py-2 text-center text-xs">
            <p className="text-emerald-600 dark:text-emerald-400 font-bold">
              Password Reset Dispatched!
            </p>
            <p className="text-slate-500">
              Check your inbox ({forgotEmail}) for recovery instructions.
            </p>
            <button
              onClick={() => {
                setIsForgotOpen(false);
                setForgotSuccess(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg text-xs"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Enter Account Email</label>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="user@checksystem.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 text-white font-semibold text-xs rounded-lg"
              >
                Send Recovery Email
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
