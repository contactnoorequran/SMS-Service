/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Radio,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  UserCheck,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../../types/auth';
import { useAuth, SEED_ACCOUNTS } from '../../context/AuthContext';

interface LoginViewProps {
  onLoginSuccess?: (role: UserRole) => void;
}

const ROLE_CARDS: Array<{
  role: UserRole;
  title: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  glowColor: string;
  borderColor: string;
  defaultTabDesc: string;
}> = [
  {
    role: 'AGENT',
    title: 'Business Agent',
    tagline: 'SMS Service — Ranges, CLI Search & Rates',
    icon: Users,
    accentColor: 'text-[var(--accent-emerald)]',
    glowColor: 'bg-[var(--accent-emerald-dim)]',
    borderColor: 'hover:border-[var(--accent-emerald)]',
    defaultTabDesc: 'Opens SMS Service Agent Dashboard, Ranges & Test Panel',
  },
  {
    role: 'SUPER_ADMIN',
    title: 'Super Admin',
    tagline: 'Unrestricted Telecom Platform Control',
    icon: Shield,
    accentColor: 'text-[var(--accent-violet)]',
    glowColor: 'bg-[var(--accent-violet-dim)]',
    borderColor: 'hover:border-[var(--accent-violet)]',
    defaultTabDesc: 'Opens Enterprise Gateway & Platform Administration',
  },
  {
    role: 'MANAGER',
    title: 'Operations Manager',
    tagline: 'Team Management & Carrier Route Oversight',
    icon: UserCheck,
    accentColor: 'text-[var(--accent-blue)]',
    glowColor: 'bg-[var(--accent-blue-dim)]',
    borderColor: 'hover:border-[var(--accent-blue)]',
    defaultTabDesc: 'Opens Manager Portal & Team Allocation',
  },
  {
    role: 'CLIENT',
    title: 'Enterprise Client',
    tagline: 'Leased Number Streams & Live Inbound SMS',
    icon: Building2,
    accentColor: 'text-[var(--accent-amber)]',
    glowColor: 'bg-[var(--accent-amber-dim)]',
    borderColor: 'hover:border-[var(--accent-amber)]',
    defaultTabDesc: 'Opens Client Numbers, Inbound Feed & CDR',
  },
];

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { login, isLoading: authLoading } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('AGENT');
  const [email, setEmail] = useState<string>(SEED_ACCOUNTS.AGENT.email);
  const [password, setPassword] = useState<string>(SEED_ACCOUNTS.AGENT.pass);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-detect role when email changes
  const detectedRole = React.useMemo<UserRole>(() => {
    const lower = email.toLowerCase().trim();
    if (lower.includes('agent')) return 'AGENT';
    if (lower.includes('admin')) return 'SUPER_ADMIN';
    if (lower.includes('manager')) return 'MANAGER';
    if (lower.includes('client')) return 'CLIENT';
    return selectedRole;
  }, [email, selectedRole]);

  const handleSelectRole = (r: UserRole) => {
    setSelectedRole(r);
    setEmail(SEED_ACCOUNTS[r].email);
    setPassword(SEED_ACCOUNTS[r].pass);
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
      // Callback with detected role for smooth initial route detection
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
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[var(--accent-blue-dim)] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[var(--accent-emerald-dim)] blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="h-16 border-b border-[var(--glass-border)] bg-[rgba(10,14,23,0.7)] backdrop-blur-xl px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-blue)] flex items-center justify-center text-white shadow-lg shadow-[var(--accent-blue-glow)]">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-[var(--text-primary)] uppercase">SMS Service</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border border-[rgba(59,130,246,0.3)]">
                v1.7
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-tertiary)]">Portal Operations & Number Management</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-xs text-[var(--text-secondary)] font-mono">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-emerald)] animate-pulse-dot" />
            <span>Gateway Ready</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 max-w-5xl mx-auto w-full">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero & Role Selector Column */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-blue-dim)] border border-[rgba(59,130,246,0.3)] text-xs text-[var(--accent-blue)] font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Unified Role-Based Telecom Gateway</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
                Sign in to your <br />
                <span className="bg-gradient-to-r from-[var(--accent-blue)] via-[var(--accent-cyan)] to-[var(--accent-emerald)] bg-clip-text text-transparent">
                  SMS Operations Portal
                </span>
              </h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                Log in with your assigned identity. The portal automatically detects your role permissions and configures your dedicated workspace.
              </p>
            </div>

            {/* Quick 1-Click Role Switcher */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center justify-between">
                <span>Select Account Role</span>
                <span className="text-[10px] text-[var(--accent-blue)] font-mono">1-Click Fast Fill</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ROLE_CARDS.map((rc) => {
                  const isSelected = selectedRole === rc.role;
                  const Icon = rc.icon;
                  return (
                    <button
                      key={rc.role}
                      type="button"
                      onClick={() => handleSelectRole(rc.role)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                        isSelected
                          ? `bg-[var(--glass-bg-active)] border-[var(--accent-blue)] shadow-md shadow-[var(--accent-blue-glow)]`
                          : `bg-[var(--glass-bg)] border-[var(--glass-border)] ${rc.borderColor} hover:bg-[var(--glass-bg-hover)]`
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${rc.glowColor} ${rc.accentColor}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[var(--text-primary)]">{rc.title}</div>
                            <div className="text-[10px] text-[var(--text-tertiary)] truncate">{SEED_ACCOUNTS[rc.role].email}</div>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[var(--accent-blue)] shrink-0" />}
                      </div>
                      <div className="mt-2 text-[10px] text-[var(--text-secondary)] line-clamp-1">
                        {rc.tagline}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Login Card Column */}
          <div className="lg:col-span-6">
            <div className="glass-card p-6 sm:p-8 rounded-2xl border border-[var(--glass-border)] bg-[rgba(13,19,33,0.85)] shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--glass-border)] mb-6">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Account Login</h2>
                  <p className="text-xs text-[var(--text-tertiary)]">Enter credentials to authenticate session</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[11px] font-mono">
                  <span className="text-[var(--text-tertiary)]">Detected:</span>
                  <span className="font-bold text-[var(--accent-emerald)]">{detectedRole}</span>
                </div>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3 rounded-xl bg-[var(--accent-rose-dim)] border border-[rgba(244,63,94,0.3)] flex items-start gap-2.5 text-xs text-[var(--accent-rose)] animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="input-login-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="e.g. agent@smshub.local"
                      className="w-full bg-[var(--bg-surface)] border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] focus:border-[var(--accent-blue)] text-xs text-[var(--text-primary)] rounded-xl pl-9 pr-4 py-2.5 outline-none transition-all placeholder:text-[var(--text-disabled)]"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">
                      Password
                    </label>
                    <span className="text-[10px] text-[var(--text-tertiary)] font-mono">256-bit BCrypt</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                      className="w-full bg-[var(--bg-surface)] border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] focus:border-[var(--accent-blue)] text-xs text-[var(--text-primary)] rounded-xl pl-9 pr-10 py-2.5 outline-none transition-all placeholder:text-[var(--text-disabled)] font-mono"
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

                {/* Role Workspace Destination Note */}
                <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--glass-border)] text-[11px] text-[var(--text-tertiary)] flex items-center justify-between">
                  <span>Target Workspace:</span>
                  <span className="font-semibold text-[var(--text-secondary)]">
                    {ROLE_CARDS.find((r) => r.role === detectedRole)?.title || 'Operations Portal'}
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isSubmitting || authLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[var(--accent-blue)] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white font-semibold text-xs tracking-wide shadow-lg shadow-[var(--accent-blue-glow)] hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting || authLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating & Detecting Role...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter {ROLE_CARDS.find((r) => r.role === detectedRole)?.title || 'Workspace'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-[var(--glass-border)] bg-[rgba(10,14,23,0.5)] px-6 flex items-center justify-between text-[11px] text-[var(--text-tertiary)] z-10">
        <div>&copy; 2026 SMS Service. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <span>Security: TLS 1.3 + JWT</span>
          <span>Status: Protected</span>
        </div>
      </footer>
    </div>
  );
};
