import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sliders, ExternalLink, Sparkles, LayoutGrid, Paintbrush, PanelTop } from 'lucide-react';
import { useThemePalette } from '../../context/ThemePaletteContext';
import { useAuth } from '../../context/AuthContext';
import { CardVariant, CardFillMode, NavbarStyle } from '../../types/theme';

interface PaletteQuickDropdownProps {
  onOpenSettings?: () => void;
}

export const PaletteQuickDropdown: React.FC<PaletteQuickDropdownProps> = ({ onOpenSettings }) => {
  const { role } = useAuth();
  const {
    palettes,
    activePaletteId,
    setPaletteById,
    activePalette,
    cardConfig,
    updateCardConfig,
    navbarConfig,
    updateNavbarConfig,
  } = useThemePalette();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Strictly enforce Admin (SUPER_ADMIN) only access
  const canManagePalette = role === 'SUPER_ADMIN';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!canManagePalette) {
    return null;
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id="btn-palette-quick-switcher"
        onClick={() => setIsOpen(!isOpen)}
        title={`Change Theme Palette (Active: ${activePalette.name})`}
        aria-label="Change Theme Palette"
        aria-expanded={isOpen}
        className="relative p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] border border-transparent hover:border-[var(--glass-border)] transition-all cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
      >
        <Palette className="w-4 h-4 text-[var(--brand-primary)]" />
        <span
          className="w-2 h-2 rounded-full ring-1 ring-white/20 shrink-0"
          style={{ backgroundColor: activePalette.colors.primary }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-[var(--bg-surface)] backdrop-blur-2xl border border-[var(--glass-border)] shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--glass-border)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              <span className="text-xs font-semibold text-[var(--text-primary)]">Theme & Surface Controls</span>
            </div>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)]">
              Admin Only
            </span>
          </div>

          <div className="text-[11px] text-[var(--text-tertiary)] mb-2">
            Active: <strong className="text-[var(--text-primary)]">{activePalette.name}</strong>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {palettes.map((p) => {
              const isSelected = p.id === activePaletteId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPaletteById(p.id);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)] font-semibold shadow-xs'
                      : 'hover:bg-[var(--glass-bg-hover)] text-[var(--text-secondary)] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center -space-x-1 shrink-0">
                      {p.preview.map((color, idx) => (
                        <span
                          key={idx}
                          className="w-2.5 h-2.5 rounded-full ring-1 ring-white"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className="truncate">{p.name}</span>
                  </div>

                  {isSelected && <Check className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0 ml-1.5" />}
                </button>
              );
            })}
          </div>

          {/* Quick Card Background Fill Toggle (Solid vs Gradient vs Mesh vs Glass) */}
          <div className="mt-2.5 pt-2 border-t border-[var(--glass-border)]">
            <div className="flex items-center justify-between mb-1.5 text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Paintbrush className="w-3 h-3 text-[var(--brand-primary)]" />
                <span>Card Fill Mode</span>
              </span>
              <span className="font-mono text-[var(--brand-primary)]">{cardConfig.fillMode}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-[10px]">
              {[
                { id: 'solid', label: 'Solid' },
                { id: 'gradient', label: 'Gradient' },
                { id: 'mesh-gradient', label: 'Mesh' },
                { id: 'glass', label: 'Glass' },
              ].map((fill) => {
                const isSelected = cardConfig.fillMode === fill.id;
                return (
                  <button
                    key={fill.id}
                    type="button"
                    onClick={() => updateCardConfig({ fillMode: fill.id as CardFillMode })}
                    className={`px-1.5 py-1 rounded text-center transition-all cursor-pointer truncate ${
                      isSelected
                        ? 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] font-bold border border-[var(--brand-border)]'
                        : 'bg-[var(--glass-bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                    }`}
                  >
                    {fill.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Card Style Toggles */}
          <div className="mt-2 pt-2 border-t border-[var(--glass-border)]">
            <div className="flex items-center justify-between mb-1.5 text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <LayoutGrid className="w-3 h-3 text-[var(--brand-primary)]" />
                <span>Card Style</span>
              </span>
              <span className="font-mono text-[var(--brand-primary)]">{cardConfig.variant}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              {[
                { id: 'accent-top', label: 'Top Stripe' },
                { id: 'glow', label: 'Glow' },
                { id: 'tinted', label: 'Tinted' },
                { id: 'bordered', label: 'Bordered' },
                { id: 'minimal', label: 'Minimal' },
              ].map((style) => {
                const isSelected = cardConfig.variant === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => updateCardConfig({ variant: style.id as CardVariant })}
                    className={`px-1.5 py-1 rounded text-center transition-all cursor-pointer truncate ${
                      isSelected
                        ? 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] font-bold border border-[var(--brand-border)]'
                        : 'bg-[var(--glass-bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                    }`}
                  >
                    {style.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Navbar Style Toggles */}
          <div className="mt-2 pt-2 border-t border-[var(--glass-border)]">
            <div className="flex items-center justify-between mb-1.5 text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <PanelTop className="w-3 h-3 text-[var(--brand-primary)]" />
                <span>Navbar Design</span>
              </span>
              <span className="font-mono text-[var(--brand-primary)]">{navbarConfig.style}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-[10px]">
              {[
                { id: 'glass', label: 'Glass' },
                { id: 'solid', label: 'Solid' },
                { id: 'accent-line', label: 'Accent' },
                { id: 'gradient', label: 'Gradient' },
              ].map((nav) => {
                const isSelected = navbarConfig.style === nav.id;
                return (
                  <button
                    key={nav.id}
                    type="button"
                    onClick={() => updateNavbarConfig({ style: nav.id as NavbarStyle })}
                    className={`px-1.5 py-1 rounded text-center transition-all cursor-pointer truncate ${
                      isSelected
                        ? 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] font-bold border border-[var(--brand-border)]'
                        : 'bg-[var(--glass-bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                    }`}
                  >
                    {nav.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Action to Full Studio */}
          {onOpenSettings && (
            <div className="mt-2.5 pt-2 border-t border-[var(--glass-border)]">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[var(--glass-bg-hover)] hover:bg-[var(--glass-bg-active)] text-xs text-[var(--text-primary)] font-medium transition-colors cursor-pointer border border-[var(--glass-border)]"
              >
                <Sliders className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                <span>Open Complete Theme Studio</span>
                <ExternalLink className="w-3 h-3 opacity-60 ml-auto" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
