/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ChevronDown,
  Shield,
  Users,
  UserCheck,
  Building2,
} from 'lucide-react';
import { UserRole } from '../../types/auth';
import { useAuth, SEED_ACCOUNTS } from '../../context/AuthContext';
import { BrandSymbol } from '../ui/BrandLogo';

interface LoginViewProps {
  onLoginSuccess?: (role: UserRole) => void;
}

const DEMO_PRESETS: Array<{
  role: UserRole;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { role: 'SUPER_ADMIN', label: 'Super Admin', icon: Shield },
  { role: 'AGENT', label: 'Agent', icon: Users },
  { role: 'MANAGER', label: 'Manager', icon: UserCheck },
  { role: 'CLIENT', label: 'Client', icon: Building2 },
];

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { login, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDemoPresets, setShowDemoPresets] = useState<boolean>(false);

  // Auto-detect role when email changes
  const detectedRole = React.useMemo<UserRole>(() => {
    const lower = email.toLowerCase().trim();
    if (lower.includes('admin')) return 'SUPER_ADMIN';
    if (lower.includes('manager')) return 'MANAGER';
    if (lower.includes('client')) return 'CLIENT';
    return 'AGENT';
  }, [email]);

  const handleSelectPreset = (role: UserRole) => {
    setEmail(SEED_ACCOUNTS[role].email);
    setPassword(SEED_ACCOUNTS[role].pass);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login(email.trim(), password);
      onLoginSuccess?.(detectedRole);
    } catch (err: any) {
      const msg = err?.message || 'Invalid email or password. Please verify your credentials.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-6 select-none transition-colors duration-200"
      style={{ backgroundColor: '#F8FAFC' }}
    >
      {/* Centered Modern Minimalist Card */}
      <div className="w-full max-w-[420px] bg-white dark:bg-[#0F172A] rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 relative">
        {/* App Logo - ImageView (80x80, margin-bottom: 32) */}
        <div
          id="app_logo"
          className="w-[80px] h-[80px] mb-8 mx-auto flex items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-slate-900 border border-blue-100 dark:border-blue-900/40 shadow-sm"
        >
          <BrandSymbol sizePx={56} theme="accent" idPrefix="login-logo-symbol" />
        </div>

        {/* Title Text (Welcome Back!, 26px, bold, #1E293B, margin-bottom: 8) */}
        <h1
          id="title_text"
          className="text-[26px] font-bold text-[#1E293B] dark:text-white mb-2 text-center tracking-tight leading-tight"
        >
          Welcome Back!
        </h1>

        {/* Subtitle Text (Please enter your details to sign in, 14px, #64748B, margin-bottom: 32) */}
        <p
          id="subtitle_text"
          className="text-[14px] text-[#64748B] dark:text-slate-400 mb-8 text-center leading-normal"
        >
          Please enter your details to sign in
        </p>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-[12px] bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="w-full">
          {/* Email TextField (placeholder: Enter your email, icon: mail_outline, border_radius: 12, bg: #FFFFFF, margin_bottom: 16) */}
          <div className="mb-4">
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input_email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="Enter your email"
                className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 text-[14px] text-slate-900 dark:text-white rounded-[12px] pl-10 pr-4 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Password TextField (placeholder: Password, is_password: true, icon: lock_outline, border_radius: 12, bg: #FFFFFF, margin_bottom: 24) */}
          <div className="mb-6">
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input_password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="Password"
                className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 text-[14px] text-slate-900 dark:text-white rounded-[12px] pl-10 pr-10 outline-none transition-all placeholder:text-slate-400 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Login Button (text: Sign In, bg: #2563EB, text_color: #FFFFFF, border_radius: 12, height: 50, margin_bottom: 8) */}
          <button
            id="login_btn"
            type="submit"
            disabled={isSubmitting || authLoading}
            className="w-full h-[50px] rounded-[12px] bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-[15px] shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting || authLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Discreet Test Accounts Collapsible Helper */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center">
          <button
            type="button"
            onClick={() => setShowDemoPresets((prev) => !prev)}
            className="text-xs text-slate-400 hover:text-[#2563EB] transition-colors inline-flex items-center gap-1 cursor-pointer font-medium"
          >
            <span>Quick Fill Test Account</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDemoPresets ? 'rotate-180' : ''}`} />
          </button>

          {showDemoPresets && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-left">
              {DEMO_PRESETS.map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.role}
                    type="button"
                    onClick={() => handleSelectPreset(preset.role)}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-left transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Icon className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                    <span className="text-xs text-slate-700 dark:text-slate-200 font-medium truncate">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Clean, minimal footer */}
      <footer className="mt-8 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} WORLD SMS SERVICE. All rights reserved.
      </footer>
    </div>
  );
};
