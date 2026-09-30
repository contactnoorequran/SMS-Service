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
  ArrowRight,
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
import { BrandLogo } from '../ui/BrandLogo';

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
    if (!email || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login(email, password);
      onLoginSuccess?.(detectedRole);
    } catch (err: any) {
      const msg = err?.message || 'Invalid email or password. Please verify your credentials.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[var(--bg-deep)] text-[var(--text-primary)] flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Subtle ambient lighting */}
      <div className="absolute top-[-15%] left-[25%] w-[600px] h-[600px] rounded-full bg-[var(--brand-primary-glow)] blur-[160px] pointer-events-none opacity-25" />

      {/* Main Centered Login Box */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 w-full">
        <div className="w-full max-w-[420px]">
          {/* Card Container */}
          <div className="glass-card p-6 sm:p-8 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl shadow-xl">
            {/* Logo and Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <BrandLogo variant="full" size="md" theme="accent" />
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mt-4">
                Sign in to your account
              </h1>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Enter your credentials to access the SMS portal
              </p>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-[var(--accent-rose-dim)] border border-[rgba(244,63,94,0.3)] flex items-start gap-2.5 text-xs text-[var(--accent-rose)] animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="input-login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="name@company.com"
                    className="w-full bg-[var(--bg-surface)] border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] focus:border-[var(--brand-primary)] text-xs text-[var(--text-primary)] rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all placeholder:text-[var(--text-disabled)]"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="••••••••••••"
                    className="w-full bg-[var(--bg-surface)] border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] focus:border-[var(--brand-primary)] text-xs text-[var(--text-primary)] rounded-xl pl-10 pr-10 py-2.5 outline-none transition-all placeholder:text-[var(--text-disabled)] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] p-1 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="btn-login-submit"
                type="submit"
                disabled={isSubmitting || authLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[var(--brand-primary)] hover:opacity-90 text-white font-semibold text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || authLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Subtle Demo Presets Accordion (Discreet, not in-your-face) */}
            <div className="mt-5 pt-4 border-t border-[var(--glass-border)] text-center">
              <button
                type="button"
                onClick={() => setShowDemoPresets((prev) => !prev)}
                className="text-xs text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] transition-colors inline-flex items-center gap-1 cursor-pointer font-medium"
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
                        className="p-2 rounded-lg bg-[var(--glass-bg-active)] hover:bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] text-left transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <Icon className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0" />
                        <span className="text-xs text-[var(--text-primary)] font-medium truncate">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Clean, minimal footer */}
      <footer className="py-4 text-center text-xs text-[var(--text-tertiary)]">
        &copy; {new Date().getFullYear()} WORLD SMS SERVICE. All rights reserved.
      </footer>
    </div>
  );
};
