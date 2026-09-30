import {
  ColorPalette,
  CustomPaletteConfig,
  PaletteColors,
  CardAppearanceConfig,
  NavbarAppearanceConfig,
} from '../types/theme';

export const DEFAULT_CARD_CONFIG: CardAppearanceConfig = {
  fillMode: 'solid',
  variant: 'accent-top',
  radius: 'rounded',
  elevation: 'soft',
  hoverEffect: 'lift-glow',
};

export const DEFAULT_NAVBAR_CONFIG: NavbarAppearanceConfig = {
  style: 'glass',
  height: 'standard',
  sidebarStyle: 'clean',
};

const STORAGE_KEY_CARD_CONFIG = 'wss_card_appearance_config';
const STORAGE_KEY_NAVBAR_CONFIG = 'wss_navbar_appearance_config';

/**
 * Converts a 3 or 6 digit hex color to RGBA string with alpha.
 */
export function hexToRgba(hex: string, alpha: number): string {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  if (cleanHex.length !== 6) {
    return `rgba(24, 24, 27, ${alpha})`;
  }
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Adjusts hex brightness by percentage (-100 to 100).
 */
export function adjustHexBrightness(hex: string, percent: number): string {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  if (cleanHex.length !== 6) return hex;

  const num = parseInt(cleanHex, 16);
  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Generates an automated harmonious secondary and accent color given a primary color.
 */
export function generateHarmoniousColors(primaryHex: string): { secondary: string; accent: string } {
  let cleanHex = primaryHex.replace('#', '').trim();
  if (cleanHex.length === 3) cleanHex = cleanHex.split('').map((c) => c + c).join('');
  if (cleanHex.length !== 6) return { secondary: '#2563eb', accent: '#38bdf8' };

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  // Shift hue approximately 30 and 60 degrees in RGB space
  const secR = Math.min(255, Math.max(0, Math.round(r * 0.85 + b * 0.15)));
  const secG = Math.min(255, Math.max(0, Math.round(g * 0.85 + r * 0.15)));
  const secB = Math.min(255, Math.max(0, Math.round(b * 0.85 + g * 0.15)));
  const secondary = `#${((1 << 24) + (secR << 16) + (secG << 8) + secB).toString(16).slice(1)}`;

  const accR = Math.min(255, Math.max(0, Math.round(r * 0.6 + g * 0.4)));
  const accG = Math.min(255, Math.max(0, Math.round(g * 0.6 + b * 0.4)));
  const accB = Math.min(255, Math.max(0, Math.round(b * 0.6 + r * 0.4)));
  const accent = `#${((1 << 24) + (accR << 16) + (accG << 8) + accB).toString(16).slice(1)}`;

  return { secondary, accent };
}

/**
 * Curated Enterprise Palette Collection.
 */
export const PRESET_PALETTES: ColorPalette[] = [
  {
    id: 'cyber-blue',
    name: 'Electric Cyber Sky',
    category: 'Telecom Infrastructure',
    description: 'Iconic telecom blue, electric cyan glow, and high-speed carrier routing.',
    colors: {
      primary: '#0284c7',
      primaryHover: '#0369a1',
      primarySoft: 'rgba(2, 132, 199, 0.12)',
      primaryGlow: 'rgba(2, 132, 199, 0.35)',
      secondary: '#2563eb',
      secondarySoft: 'rgba(37, 99, 235, 0.12)',
      border: 'rgba(2, 132, 199, 0.28)',
      accent: '#38bdf8',
    },
    preview: ['#0284c7', '#2563eb', '#38bdf8'],
  },
  {
    id: 'obsidian',
    name: 'Obsidian Monolith',
    category: 'Executive Minimalist',
    description: 'Sleek executive monochrome, high-contrast black & white workspace.',
    colors: {
      primary: '#18181b',
      primaryHover: '#333338',
      primarySoft: '#ededee',
      primaryGlow: 'rgba(24, 24, 27, 0.16)',
      secondary: '#3f3f46',
      secondarySoft: '#f4f4f5',
      border: '#d4d4d8',
      accent: '#3f3f46',
    },
    preview: ['#18181b', '#3f3f46', '#71717a'],
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    category: 'High Reliability',
    description: 'Carrier verification green, DLR ACK confirmation, and ledger security.',
    colors: {
      primary: '#059669',
      primaryHover: '#047857',
      primarySoft: 'rgba(5, 150, 105, 0.12)',
      primaryGlow: 'rgba(5, 150, 105, 0.35)',
      secondary: '#10b981',
      secondarySoft: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(5, 150, 105, 0.28)',
      accent: '#34d399',
    },
    preview: ['#059669', '#10b981', '#34d399'],
  },
  {
    id: 'royal-violet',
    name: 'Royal Amethyst',
    category: 'Executive Luxury',
    description: 'Deep royal amethyst and violet, executive oversight and high-tier operations.',
    colors: {
      primary: '#7c3aed',
      primaryHover: '#6d28d9',
      primarySoft: 'rgba(124, 58, 237, 0.12)',
      primaryGlow: 'rgba(124, 58, 237, 0.35)',
      secondary: '#8b5cf6',
      secondarySoft: 'rgba(139, 92, 246, 0.12)',
      border: 'rgba(124, 58, 237, 0.28)',
      accent: '#c084fc',
    },
    preview: ['#7c3aed', '#8b5cf6', '#c084fc'],
  },
  {
    id: 'arctic-cyan',
    name: 'Arctic Cyan',
    category: 'Optical Telemetry',
    description: 'Clean optical turquoise and cyan, high-throughput packet streaming.',
    colors: {
      primary: '#0891b2',
      primaryHover: '#0e7490',
      primarySoft: 'rgba(8, 145, 178, 0.12)',
      primaryGlow: 'rgba(8, 145, 178, 0.35)',
      secondary: '#06b6d4',
      secondarySoft: 'rgba(6, 182, 212, 0.12)',
      border: 'rgba(8, 145, 178, 0.28)',
      accent: '#22d3ee',
    },
    preview: ['#0891b2', '#06b6d4', '#22d3ee'],
  },
  {
    id: 'sunset-amber',
    name: 'Sunset Gold',
    category: 'Treasury & Ledger',
    description: 'Wholesale settlement gold, financial liquidity balance and rate clearing.',
    colors: {
      primary: '#d97706',
      primaryHover: '#b45309',
      primarySoft: 'rgba(217, 119, 6, 0.12)',
      primaryGlow: 'rgba(217, 119, 6, 0.35)',
      secondary: '#f59e0b',
      secondarySoft: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(217, 119, 6, 0.28)',
      accent: '#fbbf24',
    },
    preview: ['#d97706', '#f59e0b', '#fbbf24'],
  },
  {
    id: 'crimson-rose',
    name: 'Crimson Ruby',
    category: 'Mission Critical',
    description: 'High-priority routing alert, urgent failover protection, and ruby vibrancy.',
    colors: {
      primary: '#e11d48',
      primaryHover: '#be123c',
      primarySoft: 'rgba(225, 29, 72, 0.12)',
      primaryGlow: 'rgba(225, 29, 72, 0.35)',
      secondary: '#f43f5e',
      secondarySoft: 'rgba(244, 63, 94, 0.12)',
      border: 'rgba(225, 29, 72, 0.28)',
      accent: '#fb7185',
    },
    preview: ['#e11d48', '#f43f5e', '#fb7185'],
  },
  {
    id: 'midnight-sapphire',
    name: 'Midnight Sapphire',
    category: 'Night Operations',
    description: 'Deep midnight indigo, encrypted carrier tunnels, and night mesh telemetry.',
    colors: {
      primary: '#4f46e5',
      primaryHover: '#4338ca',
      primarySoft: 'rgba(79, 70, 229, 0.12)',
      primaryGlow: 'rgba(79, 70, 229, 0.35)',
      secondary: '#6366f1',
      secondarySoft: 'rgba(99, 102, 241, 0.12)',
      border: 'rgba(79, 70, 229, 0.28)',
      accent: '#818cf8',
    },
    preview: ['#4f46e5', '#6366f1', '#818cf8'],
  },
  {
    id: 'solar-flare',
    name: 'Solar Blaze',
    category: 'Dynamic Burst',
    description: 'High-voltage carrier coral & orange, dynamic SMS campaign bursts.',
    colors: {
      primary: '#ea580c',
      primaryHover: '#c2410c',
      primarySoft: 'rgba(234, 88, 12, 0.12)',
      primaryGlow: 'rgba(234, 88, 12, 0.35)',
      secondary: '#f97316',
      secondarySoft: 'rgba(249, 115, 22, 0.12)',
      border: 'rgba(234, 88, 12, 0.28)',
      accent: '#fb923c',
    },
    preview: ['#ea580c', '#f97316', '#fb923c'],
  },
];

export const DEFAULT_PALETTE_ID = 'obsidian';

/**
 * Builds a complete ColorPalette object from custom primary, secondary, and accent colors.
 */
export function buildCustomPalette(config: CustomPaletteConfig): ColorPalette {
  const primary = config.primary || '#0284c7';
  const secondary = config.secondary || '#2563eb';
  const accent = config.accent || '#38bdf8';
  const name = config.name || 'Custom Studio Palette';

  return {
    id: 'custom',
    name,
    category: 'Custom Admin Theme',
    description: 'Tailored enterprise color palette configured via Admin Studio.',
    isCustom: true,
    colors: {
      primary,
      primaryHover: adjustHexBrightness(primary, -12),
      primarySoft: hexToRgba(primary, 0.12),
      primaryGlow: hexToRgba(primary, 0.35),
      secondary,
      secondarySoft: hexToRgba(secondary, 0.12),
      border: hexToRgba(primary, 0.28),
      accent,
    },
    preview: [primary, secondary, accent],
  };
}

const STORAGE_KEY_PALETTE = 'wss_theme_palette';
const STORAGE_KEY_CUSTOM = 'wss_custom_palette';

/**
 * Applies palette CSS variables dynamically to the document root element.
 */
export function applyPaletteToDom(palette: ColorPalette): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const { colors } = palette;

  // WORLD SMS SERVICE Core Brand Tokens
  root.style.setProperty('--brand-primary', colors.primary);
  root.style.setProperty('--brand-primary-hover', colors.primaryHover);
  root.style.setProperty('--brand-primary-soft', colors.primarySoft);
  root.style.setProperty('--brand-primary-glow', colors.primaryGlow);
  root.style.setProperty('--brand-secondary', colors.secondary);
  root.style.setProperty('--brand-secondary-soft', colors.secondarySoft);
  root.style.setProperty('--brand-border', colors.border);
  root.style.setProperty('--brand-accent', colors.accent);

  // Global Accents across all components
  root.style.setProperty('--accent-blue', colors.primary);
  root.style.setProperty('--accent-blue-dim', colors.primarySoft);
  root.style.setProperty('--accent-blue-glow', colors.primaryGlow);

  // Set data attribute for optional scoped styling
  root.setAttribute('data-palette', palette.id);

  // Dispatch custom event for real-time subscribers
  window.dispatchEvent(
    new CustomEvent('wss-palette-changed', {
      detail: { palette },
    })
  );
}

/**
 * Retrieves the saved palette from localStorage, falling back to default.
 */
export function getSavedPalette(): { paletteId: string; customConfig: CustomPaletteConfig } {
  const defaultCustom: CustomPaletteConfig = {
    primary: '#0284c7',
    secondary: '#2563eb',
    accent: '#38bdf8',
    name: 'Custom Studio Palette',
  };

  if (typeof window === 'undefined') {
    return { paletteId: DEFAULT_PALETTE_ID, customConfig: defaultCustom };
  }

  try {
    const savedPaletteId = localStorage.getItem(STORAGE_KEY_PALETTE) || DEFAULT_PALETTE_ID;
    const savedCustomRaw = localStorage.getItem(STORAGE_KEY_CUSTOM);
    const customConfig = savedCustomRaw ? JSON.parse(savedCustomRaw) : defaultCustom;
    return { paletteId: savedPaletteId, customConfig };
  } catch (e) {
    console.error('Failed to read theme palette from storage:', e);
    return { paletteId: DEFAULT_PALETTE_ID, customConfig: defaultCustom };
  }
}

/**
 * Saves the selected palette ID and custom config to localStorage.
 */
export function savePaletteToStorage(paletteId: string, customConfig?: CustomPaletteConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PALETTE, paletteId);
    if (customConfig) {
      localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(customConfig));
    }
  } catch (e) {
    console.error('Failed to save theme palette to storage:', e);
  }
}

/**
 * Applies card styling attributes and CSS variables to the document root element.
 */
export function applyCardConfigToDom(config: CardAppearanceConfig): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Set data attributes for global card styling
  root.setAttribute('data-card-fill', config.fillMode);
  root.setAttribute('data-card-variant', config.variant);
  root.setAttribute('data-card-radius', config.radius);
  root.setAttribute('data-card-elevation', config.elevation);
  root.setAttribute('data-card-hover', config.hoverEffect);

  // Set CSS variables for radii
  const radiusMap: Record<string, string> = {
    sharp: '4px',
    rounded: '8px',
    smooth: '14px',
    pill: '20px',
  };
  root.style.setProperty('--card-radius', radiusMap[config.radius] || '8px');

  // Broadcast event for live subscribers
  window.dispatchEvent(
    new CustomEvent('wss-card-config-changed', {
      detail: { config },
    })
  );
}

/**
 * Retrieves the saved card configuration from localStorage.
 */
export function getSavedCardConfig(): CardAppearanceConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_CARD_CONFIG;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CARD_CONFIG);
    return raw ? { ...DEFAULT_CARD_CONFIG, ...JSON.parse(raw) } : DEFAULT_CARD_CONFIG;
  } catch (e) {
    console.error('Failed to read card config from storage:', e);
    return DEFAULT_CARD_CONFIG;
  }
}

/**
 * Saves the card appearance configuration to localStorage.
 */
export function saveCardConfigToStorage(config: CardAppearanceConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CARD_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save card config to storage:', e);
  }
}

/**
 * Applies Navbar and Shell styling attributes and CSS variables to the document root element.
 */
export function applyNavbarConfigToDom(config: NavbarAppearanceConfig): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Set data attributes for global header and sidebar styling
  root.setAttribute('data-navbar-style', config.style);
  root.setAttribute('data-navbar-height', config.height);
  root.setAttribute('data-sidebar-style', config.sidebarStyle);

  // Set CSS variables for navbar height
  const heightMap: Record<string, string> = {
    compact: '44px',
    standard: '48px',
    spacious: '56px',
  };
  root.style.setProperty('--navbar-height', heightMap[config.height] || '48px');

  window.dispatchEvent(
    new CustomEvent('wss-navbar-config-changed', {
      detail: { config },
    })
  );
}

/**
 * Retrieves the saved navbar configuration from localStorage.
 */
export function getSavedNavbarConfig(): NavbarAppearanceConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_NAVBAR_CONFIG;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NAVBAR_CONFIG);
    return raw ? { ...DEFAULT_NAVBAR_CONFIG, ...JSON.parse(raw) } : DEFAULT_NAVBAR_CONFIG;
  } catch (e) {
    console.error('Failed to read navbar config from storage:', e);
    return DEFAULT_NAVBAR_CONFIG;
  }
}

/**
 * Saves the navbar appearance configuration to localStorage.
 */
export function saveNavbarConfigToStorage(config: NavbarAppearanceConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_NAVBAR_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save navbar config to storage:', e);
  }
}

