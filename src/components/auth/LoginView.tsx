/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Lock,
  User,
  AlertCircle,
  Loader2,
  ChevronDown,
  Shield,
  Users,
  UserCheck,
  Building2,
  Check,
} from 'lucide-react';
import { UserRole } from '../../types/auth';
import { useAuth, SEED_ACCOUNTS } from '../../context/AuthContext';

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

  const [usernameOrEmail, setUsernameOrEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOtherAccounts, setShowOtherAccounts] = useState<boolean>(false);

  // Auto-detect role when email or username changes
  const detectedRole = React.useMemo<UserRole>(() => {
    const lower = usernameOrEmail.toLowerCase().trim();
    if (lower.includes('admin')) return 'SUPER_ADMIN';
    if (lower.includes('manager')) return 'MANAGER';
    if (lower.includes('client')) return 'CLIENT';
    return 'AGENT';
  }, [usernameOrEmail]);

  const handleSelectPreset = (role: UserRole) => {
    setUsernameOrEmail(SEED_ACCOUNTS[role].email);
    setPassword(SEED_ACCOUNTS[role].pass);
    setErrorMessage(null);
    setShowOtherAccounts(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      setErrorMessage('Please enter both your username/email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login(usernameOrEmail.trim(), password);
      onLoginSuccess?.(detectedRole);
    } catch (err: any) {
      const msg = err?.message || 'Invalid username or password. Please verify your credentials.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none bg-gradient-to-br from-[#0055FE] via-[#0066FF] to-[#0042D0]">
      {/* Dynamic Background Lighting Effects */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-blue-700/30 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 rounded-full bg-sky-300/10 blur-2xl pointer-events-none" />

      {/* Top-Left Crown Icon Badge */}
      <div className="absolute top-6 left-6 z-20">
        <div
          title="WORLD SMS SERVICE - Enterprise"
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#051330] border border-white/15 flex items-center justify-center shadow-xl hover:scale-105 transition-transform duration-200 cursor-pointer"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-sm"
          >
            <path
              d="M3 18H21L19.5 8L15 13L12 5L9 13L4.5 8L3 18Z"
              fill="#FBBF24"
              stroke="#F59E0B"
              strokeWidth="1.25"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="4" r="1.5" fill="#FBBF24" />
            <circle cx="4.5" cy="7" r="1.2" fill="#FBBF24" />
            <circle cx="19.5" cy="7" r="1.2" fill="#FBBF24" />
          </svg>
        </div>
      </div>

      {/* Main Horizontal Card Container */}
      <div className="w-full max-w-[940px] min-h-[530px] rounded-[32px] sm:rounded-[36px] bg-white shadow-[0_30px_80px_rgba(0,30,100,0.38)] overflow-hidden flex flex-col md:flex-row relative z-10 animate-fade-in">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Welcome Hero with Organic Wave & 3D Floating Spheres        */}
        {/* ========================================================================= */}
        <div className="w-full md:w-[48%] relative flex flex-col justify-center px-8 sm:px-12 py-12 md:py-16 text-white overflow-hidden bg-gradient-to-br from-[#0066FF] via-[#005AE0] to-[#0045B8]">
          {/* Subtle diagonal background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          {/* Organic Wave Divider Transitioning to Right Side (Desktop) */}
          <div className="hidden md:block absolute -right-[1px] top-0 bottom-0 w-32 pointer-events-none z-10 overflow-hidden">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="h-full w-full fill-white"
            >
              <path d="M 100,0 C 25,28 75,70 0,100 L 100,100 Z" />
            </svg>
          </div>

          {/* 3D Sphere 1: Large Center-Bottom Floating Orb */}
          <div
            className="absolute -bottom-10 left-[42%] md:left-[50%] -translate-x-1/2 w-44 h-44 rounded-full z-20 animate-float-slow pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 35% 30%, #60A5FA 0%, #0066FF 45%, #00308F 82%, #001B54 100%)',
              boxShadow:
                '0 22px 45px rgba(0, 20, 75, 0.48), inset -8px -8px 20px rgba(0, 0, 0, 0.42), inset 6px 6px 14px rgba(255, 255, 255, 0.35)',
            }}
          />

          {/* 3D Sphere 2: Bottom-Left Smooth Floating Orb */}
          <div
            className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full z-10 animate-float-reverse pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 35% 30%, #38BDF8 0%, #0056E0 50%, #002275 100%)',
              boxShadow: '0 16px 32px rgba(0, 20, 60, 0.38)',
            }}
          />

          {/* Hero Typography Content */}
          <div className="relative z-20 max-w-sm">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wider text-white mb-2 uppercase drop-shadow-sm font-display">
              WELCOME
            </h1>

            <h2 className="text-xs sm:text-sm font-bold tracking-[0.2em] text-sky-200 uppercase mb-5">
              WORLD SMS SERVICE
            </h2>

            <p className="text-xs text-blue-100/80 leading-relaxed max-w-[280px]">
              Global high-throughput telecom routing, automated CDR clearing, real-time analytics,
              and enterprise messaging delivery.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Sign In Form with Clean Inputs & Action Buttons             */}
        {/* ========================================================================= */}
        <div className="w-full md:w-[52%] flex flex-col justify-center px-8 sm:px-14 py-10 md:py-14 bg-white relative z-10">
          {/* Header Title */}
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-[#1E293B] tracking-tight mb-1 font-display">
              Sign in
            </h2>
            <p className="text-xs text-slate-400">
              Enter your credentials to access the SMS portal
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-600 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {/* Input 1: User Name / Email */}
            <div>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  id="input_username"
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => {
                    setUsernameOrEmail(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="User Name"
                  className="w-full h-12 bg-[#F1F5F9] hover:bg-[#E8EDF5] focus:bg-white text-xs sm:text-sm text-slate-800 rounded-xl pl-12 pr-4 outline-none border border-transparent focus:border-[#0066FF] transition-all placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            {/* Input 2: Password with SHOW/HIDE toggle */}
            <div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
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
                  className="w-full h-12 bg-[#F1F5F9] hover:bg-[#E8EDF5] focus:bg-white text-xs sm:text-sm text-slate-800 rounded-xl pl-12 pr-16 outline-none border border-transparent focus:border-[#0066FF] transition-all placeholder:text-slate-400 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 text-xs font-bold text-[#004085] hover:text-[#0066FF] transition-colors cursor-pointer select-none"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {/* Checkbox: Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    rememberMe
                      ? 'bg-[#004085] border-[#004085] text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="text-xs text-slate-600 font-medium">Remember me</span>
              </label>
            </div>

            {/* Primary Action Button: "Sign in" */}
            <button
              id="login_btn"
              type="submit"
              disabled={isSubmitting || authLoading}
              className="w-full h-12 rounded-xl bg-[#004085] hover:bg-[#003166] text-white font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>

            {/* "Or" Horizontal Divider */}
            <div className="flex items-center my-3 text-xs text-slate-400">
              <div className="flex-1 h-[1px] bg-slate-200" />
              <span className="px-3 font-medium">Or</span>
              <div className="flex-1 h-[1px] bg-slate-200" />
            </div>

            {/* Secondary Action Button: "Sign in with other" */}
            <button
              id="btn_other_signin"
              type="button"
              onClick={() => setShowOtherAccounts((prev) => !prev)}
              className="w-full h-12 rounded-xl bg-white border-2 border-slate-700/80 hover:bg-slate-50 text-slate-800 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sign in with other</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  showOtherAccounts ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Quick Fill Test Accounts Popdown */}
            {showOtherAccounts && (
              <div className="pt-2 grid grid-cols-2 gap-2 animate-fade-in">
                {DEMO_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.role}
                      type="button"
                      onClick={() => handleSelectPreset(preset.role)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-left transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Icon className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
                      <span className="text-xs text-slate-700 font-semibold truncate">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </form>
        </div>

        {/* 3D Sphere 3: Corner Decorative Sphere (Bottom-Right of Card) */}
        <div
          className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full pointer-events-none z-0"
          style={{
            background:
              'radial-gradient(circle at 35% 30%, #38BDF8 0%, #0066FF 60%, #00308F 100%)',
            boxShadow: '0 10px 25px rgba(0, 30, 90, 0.25)',
          }}
        />
      </div>

      {/* Subtle Footer */}
      <footer className="mt-6 text-center text-xs text-white/60">
        &copy; {new Date().getFullYear()} WORLD SMS SERVICE. All rights reserved.
      </footer>
    </div>
  );
};
