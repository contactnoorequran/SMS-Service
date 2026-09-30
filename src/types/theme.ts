/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PaletteColors {
  primary: string;           // Main interactive color (Buttons, active icons, focus borders)
  primaryHover: string;      // Interactive hover state
  primarySoft: string;       // Soft tinted background for badges, active navigation items
  primaryGlow: string;       // Box shadow glow RGBA
  secondary: string;         // Secondary gradient tone / secondary elements
  secondarySoft: string;     // Soft secondary background
  border: string;            // Border accent tint
  accent: string;            // Tertiary / complementary accent
  text?: string;             // Text color override if needed
}

export interface ColorPalette {
  id: string;
  name: string;
  category: string;
  description: string;
  isCustom?: boolean;
  colors: PaletteColors;
  preview: [string, string, string]; // 3 representative swatch colors
}

export interface CustomPaletteConfig {
  primary: string;
  secondary: string;
  accent: string;
  name?: string;
}

export type CardFillMode = 'solid' | 'gradient' | 'mesh-gradient' | 'glass';
export type CardVariant = 'accent-top' | 'glow' | 'tinted' | 'bordered' | 'minimal';
export type CardRadius = 'sharp' | 'rounded' | 'smooth' | 'pill';
export type CardElevation = 'flat' | 'soft' | 'elevated' | 'glow';
export type CardHoverEffect = 'lift-glow' | 'highlight' | 'none';

export interface CardAppearanceConfig {
  fillMode: CardFillMode;
  variant: CardVariant;
  radius: CardRadius;
  elevation: CardElevation;
  hoverEffect: CardHoverEffect;
}

export type NavbarStyle = 'glass' | 'solid' | 'accent-line' | 'gradient';
export type NavbarHeight = 'compact' | 'standard' | 'spacious';
export type SidebarStyle = 'clean' | 'accent-rail' | 'tinted';

export interface NavbarAppearanceConfig {
  style: NavbarStyle;
  height: NavbarHeight;
  sidebarStyle: SidebarStyle;
}


