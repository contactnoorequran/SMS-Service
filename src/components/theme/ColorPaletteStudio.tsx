import React, { useState } from 'react';
import {
  Palette,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  Wand2,
  ShieldCheck,
  Layers,
  ArrowRight,
  Activity,
  Send,
  LayoutGrid,
  Box,
  Eye,
  CheckCircle2,
  TrendingUp,
  Lock,
  ShieldAlert,
  PanelTop,
  Maximize2,
  Compass,
  Paintbrush,
  Sparkle,
  SlidersHorizontal,
} from 'lucide-react';
import { useThemePalette } from '../../context/ThemePaletteContext';
import { useAuth } from '../../context/AuthContext';
import { generateHarmoniousColors } from '../../utils/themeHelper';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { AppIcon } from '../ui/AppIcon';
import {
  CardVariant,
  CardRadius,
  CardElevation,
  CardHoverEffect,
  CardFillMode,
  NavbarStyle,
  NavbarHeight,
  SidebarStyle,
} from '../../types/theme';

const QUICK_CHIPS = [
  { label: 'Sky Blue', hex: '#0284c7' },
  { label: 'Emerald', hex: '#059669' },
  { label: 'Violet', hex: '#7c3aed' },
  { label: 'Amber', hex: '#d97706' },
  { label: 'Ruby', hex: '#e11d48' },
  { label: 'Cyan', hex: '#0891b2' },
  { label: 'Indigo', hex: '#4f46e5' },
  { label: 'Orange', hex: '#ea580c' },
  { label: 'Obsidian', hex: '#18181b' },
];

export const ColorPaletteStudio: React.FC = () => {
  const { role } = useAuth();
  const {
    palettes,
    activePalette,
    activePaletteId,
    customConfig,
    cardConfig,
    navbarConfig,
    canModifyTheme,
    setPaletteById,
    updateCustomConfig,
    applyCustomPalette,
    resetToDefault,
    updateCardConfig,
    resetCardConfig,
    updateNavbarConfig,
    resetNavbarConfig,
    isCustomActive,
  } = useThemePalette();

  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);

  // Strictly enforce Admin (SUPER_ADMIN) only access for changings
  const canModify = role === 'SUPER_ADMIN' && canModifyTheme;

  const handleActivate = (id: string, name: string) => {
    setPaletteById(id);
    setApplySuccessMessage(`Theme palette "${name}" successfully activated across the entire application.`);
    setTimeout(() => setApplySuccessMessage(null), 3500);
  };

  const handleApplyCustom = () => {
    applyCustomPalette();
    setApplySuccessMessage('Custom color palette successfully generated and applied system-wide.');
    setTimeout(() => setApplySuccessMessage(null), 3500);
  };

  const handleResetDefault = () => {
    resetToDefault();
    setApplySuccessMessage('Theme palette reset to Obsidian Monolith enterprise default.');
    setTimeout(() => setApplySuccessMessage(null), 3500);
  };

  const handleAutoHarmonize = () => {
    const { secondary, accent } = generateHarmoniousColors(customConfig.primary);
    updateCustomConfig({ secondary, accent });
  };

  const handleResetNavbar = () => {
    resetNavbarConfig();
    setApplySuccessMessage('Navbar and shell layout reset to default settings.');
    setTimeout(() => setApplySuccessMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Strict Role Guard Banner for Non-Admins */}
      {!canModify && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-950 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-800 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h5 className="font-bold text-amber-950">Read-Only Mode (Super Admin Access Required)</h5>
              <Badge variant="warning" size="sm">Protected</Badge>
            </div>
            <p className="text-[11px] text-amber-900 mt-0.5">
              Only Super Administrators have permission to modify platform theme palettes, card surface modes (Gradient vs Solid), and navbar designs. Controls below are currently locked.
            </p>
          </div>
        </div>
      )}

      {/* Admin Broadcast Notice */}
      <div className="p-4 rounded-xl bg-[var(--brand-primary-soft)] border border-[var(--brand-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--brand-primary)] shrink-0 shadow-xs">
            <Palette className="w-5 h-5 text-[var(--brand-primary)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                System-Wide Theme & Color Engine
              </h4>
              <Badge variant="info" size="sm">
                <ShieldCheck className="w-3 h-3" />
                Admin Enforced
              </Badge>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Palette selections update CSS tokens dynamically across all views, headers, sidebars, buttons, and telemetry cards.
            </p>
          </div>
        </div>

        {canModify && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetDefault}
            className="text-xs shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </Button>
        )}
      </div>

      {applySuccessMessage && (
        <div className="p-3.5 rounded-xl bg-[var(--accent-emerald-dim)] border border-[rgba(16,185,129,0.25)] text-xs text-[var(--accent-emerald)] flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 shrink-0" />
          <span className="font-medium">{applySuccessMessage}</span>
        </div>
      )}

      {/* Top Section: Active Palette Status + Live Interactive Preview Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Palette Overview */}
        <Card
          title="Active System Palette"
          description="Currently rendered across the platform"
          className="lg:col-span-1"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--glass-bg-active)] border border-[var(--glass-border)]">
              <div>
                <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider block">
                  {activePalette.category}
                </span>
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {activePalette.name}
                </span>
              </div>
              <div className="flex items-center -space-x-1.5">
                {activePalette.preview.map((color, i) => (
                  <span
                    key={i}
                    className="w-5 h-5 rounded-full ring-2 ring-white shadow-xs"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {activePalette.description}
            </p>

            <div className="pt-2 border-t border-[var(--glass-border)] space-y-2">
              <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider block">
                Active CSS Properties
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-between">
                  <span className="text-[var(--text-tertiary)]">Primary:</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: activePalette.colors.primary }}
                    />
                    <span className="font-semibold text-[var(--text-primary)]">
                      {activePalette.colors.primary}
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-between">
                  <span className="text-[var(--text-tertiary)]">Secondary:</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: activePalette.colors.secondary }}
                    />
                    <span className="font-semibold text-[var(--text-primary)]">
                      {activePalette.colors.secondary}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Live Interactive Preview Sandbox */}
        <Card
          title="Live UI Preview Sandbox"
          description="Real-time rendering of core components with current palette"
          className="lg:col-span-2"
        >
          <div className="p-4 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="px-3.5 py-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Primary Action</span>
              </button>

              <button
                type="button"
                className="px-3.5 py-2 rounded-xl bg-[var(--brand-primary-soft)] hover:bg-[var(--glass-bg-hover)] text-[var(--brand-primary)] border border-[var(--brand-border)] text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Soft Accent</span>
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] animate-pulse" />
                <span>Carrier Active</span>
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono bg-[var(--glass-bg-active)] border border-[var(--glass-border)] text-[var(--text-primary)]">
                <Activity className="w-3 h-3 text-[var(--brand-primary)]" />
                <span>99.98% SLA</span>
              </div>
            </div>

            {/* Input + Card Mockup */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--glass-border)]">
              <div>
                <label className="block text-[11px] text-[var(--text-secondary)] mb-1 font-medium">
                  Input Focus Ring Preview
                </label>
                <input
                  type="text"
                  readOnly
                  value="Focus rings react instantly to the palette"
                  className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary-soft)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none transition-all"
                />
              </div>

              <div className="p-3 rounded-lg bg-[var(--glass-bg-active)] border border-[var(--glass-border)] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase block">
                    Telemetry Stream
                  </span>
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    1,280,450 Msg/hr
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[var(--brand-primary)]" />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Preset Palettes Grid (9 Curated Themes) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Predefined Enterprise Palettes
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              High-contrast carrier and executive themes tailored for high-volume telemetry.
            </p>
          </div>
          <span className="text-xs font-mono text-[var(--text-tertiary)]">
            {palettes.filter((p) => !p.isCustom).length} Presets Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {palettes
            .filter((p) => !p.isCustom)
            .map((palette) => {
              const isSelected = palette.id === activePaletteId;
              return (
                <div
                  key={palette.id}
                  onClick={() => canModify && handleActivate(palette.id, palette.name)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[var(--glass-bg)] border-[var(--brand-primary)] shadow-md ring-1 ring-[var(--brand-primary)]'
                      : 'bg-[var(--glass-bg)] border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] hover:bg-[var(--glass-bg-hover)]'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider block">
                          {palette.category}
                        </span>
                        <h4 className="text-xs font-bold text-[var(--text-primary)]">
                          {palette.name}
                        </h4>
                      </div>

                      {isSelected ? (
                        <Badge variant="success" size="sm" className="shrink-0 font-semibold">
                          <Check className="w-3 h-3" />
                          Active
                        </Badge>
                      ) : (
                        <div className="flex items-center -space-x-1.5 shrink-0">
                          {palette.preview.map((c, idx) => (
                            <span
                              key={idx}
                              className="w-4 h-4 rounded-full ring-1 ring-white shadow-xs"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-4">
                      {palette.description}
                    </p>
                  </div>

                  {/* Swatch Strip & Select Action */}
                  <div className="pt-3 border-t border-[var(--glass-border)] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {palette.preview.map((c, idx) => (
                        <span
                          key={idx}
                          className="w-6 h-2.5 rounded-full"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>

                    {canModify && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivate(palette.id, palette.name);
                        }}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'text-[var(--brand-primary)] font-bold'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg-active)]'
                        }`}
                      >
                        <span>{isSelected ? 'Applied' : 'Select'}</span>
                        {!isSelected && <ArrowRight className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Custom Palette Studio Section ("custom ka option") */}
      <Card
        title="Custom Palette Studio"
        description="Craft your custom corporate identity with custom HEX color inputs and auto-harmonization"
        className="border-t-2 border-t-[var(--brand-primary)]"
      >
        <div className="space-y-6 text-xs">
          {/* Quick Color Chips */}
          <div>
            <label className="block text-[var(--text-secondary)] font-medium mb-1.5">
              Quick Primary Color Presets:
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip.hex}
                  type="button"
                  onClick={() => updateCustomConfig({ primary: chip.hex })}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] text-xs text-[var(--text-primary)] transition-all cursor-pointer"
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/50"
                    style={{ backgroundColor: chip.hex }}
                  />
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Primary Color Picker */}
            <div className="p-3.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white"
                    style={{ backgroundColor: customConfig.primary }}
                  />
                  <span>Primary Color</span>
                </label>
                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">Core Brand</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customConfig.primary}
                  onChange={(e) => updateCustomConfig({ primary: e.target.value })}
                  className="w-9 h-9 rounded-lg border border-[var(--glass-border)] cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={customConfig.primary}
                  onChange={(e) => updateCustomConfig({ primary: e.target.value })}
                  className="flex-1 bg-[var(--glass-bg-active)] border border-[var(--glass-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] font-mono outline-none focus:border-[var(--brand-primary)]"
                />
              </div>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                Buttons, active link highlights, headers, and focus rings.
              </p>
            </div>

            {/* Secondary Color Picker */}
            <div className="p-3.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white"
                    style={{ backgroundColor: customConfig.secondary }}
                  />
                  <span>Secondary Color</span>
                </label>
                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">Gradient</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customConfig.secondary}
                  onChange={(e) => updateCustomConfig({ secondary: e.target.value })}
                  className="w-9 h-9 rounded-lg border border-[var(--glass-border)] cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={customConfig.secondary}
                  onChange={(e) => updateCustomConfig({ secondary: e.target.value })}
                  className="flex-1 bg-[var(--glass-bg-active)] border border-[var(--glass-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] font-mono outline-none focus:border-[var(--brand-primary)]"
                />
              </div>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                Gradient accents, secondary telemetry lines, and badges.
              </p>
            </div>

            {/* Accent Color Picker */}
            <div className="p-3.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white"
                    style={{ backgroundColor: customConfig.accent }}
                  />
                  <span>Accent Tone</span>
                </label>
                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">Complementary</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customConfig.accent}
                  onChange={(e) => updateCustomConfig({ accent: e.target.value })}
                  className="w-9 h-9 rounded-lg border border-[var(--glass-border)] cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={customConfig.accent}
                  onChange={(e) => updateCustomConfig({ accent: e.target.value })}
                  className="flex-1 bg-[var(--glass-bg-active)] border border-[var(--glass-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] font-mono outline-none focus:border-[var(--brand-primary)]"
                />
              </div>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                Verification checks, KPI status badges, and chart metrics.
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--glass-border)]">
            <button
              type="button"
              onClick={handleAutoHarmonize}
              className="px-3 py-1.5 rounded-lg bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Wand2 className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              <span>Auto-Harmonize Colors</span>
            </button>

            {canModify && (
              <Button
                variant="brand"
                size="sm"
                onClick={handleApplyCustom}
                className="text-xs font-semibold cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isCustomActive ? 'Update Custom Palette' : 'Apply Custom Palette System-Wide'}</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* ─── Cards & Surface Appearance Studio (Cards Waghera Changings) ─── */}
      <Card
        title="Card & Surface Appearance Studio"
        description="Customize how cards, KPI panels, and data surfaces look and interact across the platform"
        className="border-t-2 border-t-[var(--brand-primary)]"
      >
        <div className="space-y-6 text-xs">
          {/* 0. Card Background Color & Fill Mode (Gradient vs Solid) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Paintbrush className="w-4 h-4 text-[var(--brand-primary)]" />
                <span>Card Background Color & Fill Mode (Gradient vs Solid)</span>
              </label>
              <span className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase">
                Active: {cardConfig.fillMode}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  id: 'solid',
                  label: 'Solid Surface',
                  desc: 'Clean opaque monochrome white surface',
                  previewClass: 'bg-white border border-zinc-200',
                  previewStyle: {},
                },
                {
                  id: 'gradient',
                  label: 'Linear Gradient',
                  desc: 'Smooth brand tint gradient wash',
                  previewClass: 'border border-[var(--brand-border)]',
                  previewStyle: {
                    background: 'linear-gradient(135deg, var(--brand-primary-soft) 0%, #ffffff 60%)',
                  },
                },
                {
                  id: 'mesh-gradient',
                  label: 'Mesh Ambient Glow',
                  desc: 'Multi-radial ambient theme aura',
                  previewClass: 'border border-[var(--brand-border)]',
                  previewStyle: {
                    background: 'radial-gradient(at 0% 0%, var(--brand-primary-soft) 0px, transparent 55%), radial-gradient(at 100% 100%, var(--brand-secondary-soft) 0px, transparent 55%), #ffffff',
                  },
                },
                {
                  id: 'glass',
                  label: 'Frosted Glass',
                  desc: 'Translucent glass with blur',
                  previewClass: 'backdrop-blur-md border border-[var(--glass-border)]',
                  previewStyle: {
                    background: 'rgba(255, 255, 255, 0.78)',
                  },
                },
              ].map((fill) => {
                const isSelected = cardConfig.fillMode === fill.id;
                return (
                  <button
                    key={fill.id}
                    type="button"
                    disabled={!canModify}
                    onClick={() => {
                      if (!canModify) return;
                      updateCardConfig({ fillMode: fill.id as CardFillMode });
                      setApplySuccessMessage(`Card background mode set to "${fill.label}".`);
                      setTimeout(() => setApplySuccessMessage(null), 3500);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      !canModify
                        ? 'opacity-65 cursor-not-allowed'
                        : 'cursor-pointer hover:border-[var(--brand-primary)]'
                    } ${
                      isSelected
                        ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)] shadow-sm'
                        : 'bg-[var(--glass-bg)] border-[var(--glass-border)] hover:bg-[var(--glass-bg-hover)]'
                    }`}
                  >
                    <div>
                      {/* Visual Swatch Box */}
                      <div
                        className={`h-9 w-full rounded-lg mb-2.5 shadow-2xs flex items-center justify-center text-[10px] font-mono text-[var(--text-tertiary)] ${fill.previewClass}`}
                        style={fill.previewStyle}
                      >
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">{fill.id}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-[var(--text-primary)]">{fill.label}</span>
                        {isSelected && <Badge variant="brand" size="sm">Active</Badge>}
                      </div>
                      <p className="text-[10px] text-[var(--text-tertiary)] leading-tight">{fill.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1. Card Style Variant Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <LayoutGrid className="w-4 h-4 text-[var(--brand-primary)]" />
                <span>Card Surface Style (Theme Integration)</span>
              </label>
              <span className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase">
                Active: {cardConfig.variant}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {[
                { id: 'accent-top', label: 'Top Accent Stripe', desc: '3px brand color bar along top' },
                { id: 'glow', label: 'Ambient Glow', desc: 'Subtle theme aura & hover lift' },
                { id: 'tinted', label: 'Soft Tinted Glass', desc: 'Gentle gradient translucent tint' },
                { id: 'bordered', label: 'Accent Border', desc: 'Tinted brand-colored border line' },
                { id: 'minimal', label: 'Clean Minimal', desc: 'Crisp monochrome white surface' },
              ].map((style) => {
                const isSelected = cardConfig.variant === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    disabled={!canModify}
                    onClick={() => {
                      if (!canModify) return;
                      updateCardConfig({ variant: style.id as CardVariant });
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      !canModify
                        ? 'opacity-65 cursor-not-allowed'
                        : 'cursor-pointer hover:border-[var(--brand-primary)]'
                    } ${
                      isSelected
                        ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)] shadow-sm'
                        : 'bg-[var(--glass-bg)] border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] hover:bg-[var(--glass-bg-hover)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-[var(--text-primary)]">{style.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0" />}
                      </div>
                      <p className="text-[10px] text-[var(--text-tertiary)] leading-tight">{style.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Corner Radius & Elevation Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[var(--glass-border)]">
            {/* Corner Radius */}
            <div>
              <label className="block font-semibold text-[var(--text-primary)] mb-2">
                Card Corner Radius (Border Radius)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'sharp', label: 'Sharp', val: '4px' },
                  { id: 'rounded', label: 'Standard', val: '8px' },
                  { id: 'smooth', label: 'Modern Smooth', val: '14px' },
                  { id: 'pill', label: 'Extra Curved', val: '20px' },
                ].map((rad) => {
                  const isSelected = cardConfig.radius === rad.id;
                  return (
                    <button
                      key={rad.id}
                      type="button"
                      disabled={!canModify}
                      onClick={() => {
                        if (!canModify) return;
                        updateCardConfig({ radius: rad.id as CardRadius });
                      }}
                      className={`p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${
                        !canModify ? 'opacity-65 cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        isSelected
                          ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)] font-semibold text-[var(--brand-primary)]'
                          : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span>{rad.label}</span>
                      <span className="font-mono text-[10px] opacity-75">{rad.val}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shadow Depth & Elevation */}
            <div>
              <label className="block font-semibold text-[var(--text-primary)] mb-2">
                Card Shadow & Depth
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'flat', label: 'Flat (Zero Shadow)' },
                  { id: 'soft', label: 'Soft Natural' },
                  { id: 'elevated', label: 'Elevated 3D Lift' },
                  { id: 'glow', label: 'Theme Ambient Glow' },
                ].map((elev) => {
                  const isSelected = cardConfig.elevation === elev.id;
                  return (
                    <button
                      key={elev.id}
                      type="button"
                      disabled={!canModify}
                      onClick={() => {
                        if (!canModify) return;
                        updateCardConfig({ elevation: elev.id as CardElevation });
                      }}
                      className={`p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${
                        !canModify ? 'opacity-65 cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        isSelected
                          ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)] font-semibold text-[var(--brand-primary)]'
                          : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span className="truncate">{elev.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hover Interaction */}
            <div>
              <label className="block font-semibold text-[var(--text-primary)] mb-2">
                Card Hover Animation
              </label>
              <div className="space-y-2">
                {[
                  { id: 'lift-glow', label: 'Hover Lift & Ambient Glow', desc: 'Elevates 2px with brand aura' },
                  { id: 'highlight', label: 'Border Color Highlight', desc: 'Transitions border to brand color' },
                  { id: 'none', label: 'Static (No Movement)', desc: 'Clean stationary flat surface' },
                ].map((hov) => {
                  const isSelected = cardConfig.hoverEffect === hov.id;
                  return (
                    <button
                      key={hov.id}
                      type="button"
                      disabled={!canModify}
                      onClick={() => {
                        if (!canModify) return;
                        updateCardConfig({ hoverEffect: hov.id as CardHoverEffect });
                      }}
                      className={`w-full p-2 rounded-lg border text-xs transition-all flex items-center justify-between text-left ${
                        !canModify ? 'opacity-65 cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        isSelected
                          ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)] font-semibold text-[var(--brand-primary)]'
                          : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <div>
                        <div className="text-xs">{hov.label}</div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Live Cards Demonstration Sandbox */}
          <div className="pt-4 border-t border-[var(--glass-border)]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                  <span>Real-Time Live Cards Sandbox</span>
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Preview how your chosen card fill mode (Solid vs Gradient), style, radius, and elevation appear across the platform.
                </p>
              </div>

              {canModify && (
                <button
                  type="button"
                  onClick={resetCardConfig}
                  className="px-2.5 py-1 rounded-md text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Cards</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Sample 1: StatCard */}
              <div className="glass-card p-4 flex flex-col justify-between min-h-[120px] cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-[var(--text-secondary)] font-medium">Assigned Numbers</span>
                    <div className="text-xl font-bold font-mono text-[var(--text-primary)] mt-1">12,480</div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border border-[var(--brand-border)] flex items-center justify-center shrink-0">
                    <AppIcon name="number-inventory" size="sm" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-[var(--glass-border)]">
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[var(--accent-emerald)]">
                    <TrendingUp className="w-3 h-3" /> +14.2%
                  </span>
                  <span className="text-[10px] text-[var(--text-tertiary)] font-mono">vs last week</span>
                </div>
              </div>

              {/* Sample 2: Data Status Card */}
              <div className="glass-card p-4 flex flex-col justify-between min-h-[120px] cursor-pointer">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase text-[var(--text-tertiary)]">Carrier Link</span>
                    <Badge variant="success" size="sm">Active (99.9%)</Badge>
                  </div>
                  <h5 className="font-semibold text-xs text-[var(--text-primary)]">SMPP Primary Trunk</h5>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Latency 18ms • Rate $0.0034/sms</p>
                </div>
                <div className="mt-3 pt-2 border-t border-[var(--glass-border)] flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                  <span>Throughput: 850 msg/s</span>
                  <span className="font-mono text-[var(--brand-primary)] font-semibold">Ready</span>
                </div>
              </div>

              {/* Sample 3: Action Panel Card */}
              <div className="glass-card p-4 flex flex-col justify-between min-h-[120px] cursor-pointer">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse" />
                    <h5 className="font-semibold text-xs text-[var(--text-primary)]">Quick Outbound Burst</h5>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">Queue campaign or broadcast to verified recipients</p>
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    className="w-full py-1.5 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3 h-3" />
                    <span>Launch Test Burst</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ─── Navbar & Navigation Design Studio (Navbar Design etc) ─── */}
      <Card
        title="Navbar & Shell Navigation Design Studio"
        description="Configure top header styles, navigation elevation, bar height, and sidebar rail design"
        className="border-t-2 border-t-[var(--brand-primary)]"
      >
        <div className="space-y-6 text-xs">
          {/* 1. Navbar Surface Design */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <PanelTop className="w-4 h-4 text-[var(--brand-primary)]" />
                <span>Navbar Surface Design & Style</span>
              </label>
              <span className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase">
                Active: {navbarConfig.style}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  id: 'glass',
                  label: 'Frosted Glassmorphism',
                  desc: 'Translucent glass with backdrop blur & subtle sheen',
                  previewClass: 'bg-white/75 backdrop-blur-md border border-[var(--glass-border)]',
                },
                {
                  id: 'solid',
                  label: 'Solid Pure White',
                  desc: 'Crisp opaque corporate white with soft shadow',
                  previewClass: 'bg-white border border-zinc-200 shadow-2xs',
                },
                {
                  id: 'accent-line',
                  label: 'Accent Highlight Line',
                  desc: 'Solid white with vibrant brand primary bottom stripe',
                  previewClass: 'bg-white border-b-2 border-b-[var(--brand-primary)] border-t border-l border-r border-zinc-200 shadow-2xs',
                },
                {
                  id: 'gradient',
                  label: 'Subtle Brand Gradient',
                  desc: 'Horizontal brand wash flowing from left to right',
                  previewClass: 'bg-gradient-to-r from-white via-[var(--brand-primary-soft)] to-white border border-[var(--brand-border)]',
                },
              ].map((style) => {
                const isSelected = navbarConfig.style === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    disabled={!canModify}
                    onClick={() => {
                      if (!canModify) return;
                      updateNavbarConfig({ style: style.id as NavbarStyle });
                      setApplySuccessMessage(`Navbar style set to "${style.label}".`);
                      setTimeout(() => setApplySuccessMessage(null), 3500);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      !canModify
                        ? 'opacity-65 cursor-not-allowed'
                        : 'cursor-pointer hover:border-[var(--brand-primary)]'
                    } ${
                      isSelected
                        ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)] shadow-sm'
                        : 'bg-[var(--glass-bg)] border-[var(--glass-border)] hover:bg-[var(--glass-bg-hover)]'
                    }`}
                  >
                    <div>
                      {/* Mini Navbar Mockup Swatch */}
                      <div className={`h-8 w-full rounded-md mb-2 flex items-center justify-between px-2 text-[9px] font-mono ${style.previewClass}`}>
                        <span className="font-bold text-[var(--brand-primary)] truncate">WORLD SMS</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0" />}
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-[var(--text-primary)]">{style.label}</span>
                        {isSelected && <Badge variant="brand" size="sm">Active</Badge>}
                      </div>
                      <p className="text-[10px] text-[var(--text-tertiary)] leading-tight">{style.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Navbar Height & Sidebar Style Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--glass-border)]">
            {/* Navbar Height */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                  <span>Navbar Header Height</span>
                </label>
                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                  Current: {navbarConfig.height}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'compact', label: 'Compact', val: '44px', desc: 'Dense data view' },
                  { id: 'standard', label: 'Standard', val: '48px', desc: 'Balanced default' },
                  { id: 'spacious', label: 'Spacious', val: '56px', desc: 'Airy executive' },
                ].map((h) => {
                  const isSelected = navbarConfig.height === h.id;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      disabled={!canModify}
                      onClick={() => {
                        if (!canModify) return;
                        updateNavbarConfig({ height: h.id as NavbarHeight });
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        !canModify ? 'opacity-65 cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        isSelected
                          ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)] font-semibold text-[var(--brand-primary)]'
                          : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs">{h.label}</span>
                        <span className="font-mono text-[10px] opacity-75">{h.val}</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-tertiary)] block">{h.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Style */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                  <span>Sidebar Navigation Rail Style</span>
                </label>
                <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                  Current: {navbarConfig.sidebarStyle}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'clean', label: 'Clean Border', desc: 'Monochrome divider' },
                  { id: 'accent-rail', label: 'Accent Rail', desc: 'Brand vertical stripe' },
                  { id: 'tinted', label: 'Tinted Wash', desc: 'Soft ambient tint' },
                ].map((side) => {
                  const isSelected = navbarConfig.sidebarStyle === side.id;
                  return (
                    <button
                      key={side.id}
                      type="button"
                      disabled={!canModify}
                      onClick={() => {
                        if (!canModify) return;
                        updateNavbarConfig({ sidebarStyle: side.id as SidebarStyle });
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        !canModify ? 'opacity-65 cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        isSelected
                          ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)] font-semibold text-[var(--brand-primary)]'
                          : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs">{side.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-[var(--brand-primary)]" />}
                      </div>
                      <span className="text-[10px] text-[var(--text-tertiary)] block">{side.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Live Header Navbar Sandbox Simulation */}
          <div className="pt-4 border-t border-[var(--glass-border)]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                  <span>Real-Time Live Navbar & Header Preview</span>
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Live simulator demonstrating how the top navigation header renders across the platform.
                </p>
              </div>

              {canModify && (
                <button
                  type="button"
                  onClick={handleResetNavbar}
                  className="px-2.5 py-1 rounded-md text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)] border border-[var(--glass-border)] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Navbar Design</span>
                </button>
              )}
            </div>

            {/* Simulated Live Navbar Frame */}
            <div className="rounded-xl border border-[var(--glass-border)] overflow-hidden bg-zinc-100 shadow-sm">
              <div
                className={`w-full px-4 flex items-center justify-between gap-4 transition-all ${
                  navbarConfig.style === 'glass'
                    ? 'bg-white/80 backdrop-blur-md border-b border-[var(--glass-border)]'
                    : navbarConfig.style === 'solid'
                    ? 'bg-white border-b border-[var(--glass-border)] shadow-xs'
                    : navbarConfig.style === 'accent-line'
                    ? 'bg-white border-b-2 border-b-[var(--brand-primary)] shadow-xs'
                    : 'bg-gradient-to-r from-white via-[var(--brand-primary-soft)] to-white border-b border-[var(--brand-border)]'
                }`}
                style={{
                  height: navbarConfig.height === 'compact' ? '44px' : navbarConfig.height === 'spacious' ? '56px' : '48px',
                }}
              >
                {/* Left: Brand + Breadcrumb */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded bg-[var(--brand-primary)] text-white flex items-center justify-center font-bold text-[10px]">
                      W
                    </div>
                    <span className="font-bold text-xs text-[var(--text-primary)] font-brand-wordmark hidden sm:inline">
                      WORLD SMS SERVICE
                    </span>
                  </div>
                  <span className="text-[var(--text-tertiary)]">/</span>
                  <span className="text-xs text-[var(--text-secondary)] font-medium truncate">Theme Studio</span>
                </div>

                {/* Center: Search Simulation */}
                <div className="hidden sm:flex items-center px-3 py-1 rounded bg-[rgba(0,0,0,0.04)] border border-[var(--glass-border)] text-[11px] text-[var(--text-tertiary)] w-48">
                  <span>Quick search...</span>
                  <span className="ml-auto font-mono text-[9px] bg-white px-1 rounded border border-zinc-200">⌘K</span>
                </div>

                {/* Right: Telemetry & Admin Badges */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[var(--text-tertiary)] bg-white px-2 py-0.5 rounded border border-[var(--glass-border)]">
                    UTC 20:00:00
                  </span>
                  <Badge variant="brand" size="sm">
                    <ShieldCheck className="w-3 h-3" />
                    Admin
                  </Badge>
                </div>
              </div>

              {/* Mini Content Area to show contrast */}
              <div className="p-3 bg-[var(--bg-deep)] text-[10px] text-[var(--text-tertiary)] flex items-center justify-between">
                <span>Viewport Content Area</span>
                <span className="font-mono">Style: {navbarConfig.style} • Height: {navbarConfig.height}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
