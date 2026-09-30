/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  ColorPalette,
  CustomPaletteConfig,
  CardAppearanceConfig,
  NavbarAppearanceConfig,
} from '../types/theme';
import {
  PRESET_PALETTES,
  DEFAULT_PALETTE_ID,
  DEFAULT_CARD_CONFIG,
  DEFAULT_NAVBAR_CONFIG,
  buildCustomPalette,
  applyPaletteToDom,
  applyCardConfigToDom,
  applyNavbarConfigToDom,
  getSavedPalette,
  savePaletteToStorage,
  getSavedCardConfig,
  saveCardConfigToStorage,
  getSavedNavbarConfig,
  saveNavbarConfigToStorage,
} from '../utils/themeHelper';
import { useAuth } from './AuthContext';

interface ThemePaletteContextType {
  palettes: ColorPalette[];
  activePalette: ColorPalette;
  activePaletteId: string;
  customPalette: ColorPalette;
  customConfig: CustomPaletteConfig;
  cardConfig: CardAppearanceConfig;
  navbarConfig: NavbarAppearanceConfig;
  canModifyTheme: boolean;
  setPaletteById: (id: string) => void;
  updateCustomConfig: (config: Partial<CustomPaletteConfig>) => void;
  applyCustomPalette: () => void;
  resetToDefault: () => void;
  updateCardConfig: (config: Partial<CardAppearanceConfig>) => void;
  resetCardConfig: () => void;
  updateNavbarConfig: (config: Partial<NavbarAppearanceConfig>) => void;
  resetNavbarConfig: () => void;
  isCustomActive: boolean;
}

const ThemePaletteContext = createContext<ThemePaletteContextType | undefined>(undefined);

export const ThemePaletteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialData = useMemo(() => getSavedPalette(), []);
  const initialCardConfig = useMemo(() => getSavedCardConfig(), []);
  const initialNavbarConfig = useMemo(() => getSavedNavbarConfig(), []);

  const [activePaletteId, setActivePaletteId] = useState<string>(initialData.paletteId);
  const [customConfig, setCustomConfig] = useState<CustomPaletteConfig>(initialData.customConfig);
  const [cardConfig, setCardConfig] = useState<CardAppearanceConfig>(initialCardConfig);
  const [navbarConfig, setNavbarConfig] = useState<NavbarAppearanceConfig>(initialNavbarConfig);

  // Recompute custom palette whenever custom config changes
  const customPalette = useMemo(() => buildCustomPalette(customConfig), [customConfig]);

  // Combine presets with custom palette
  const allPalettes = useMemo(() => {
    return [...PRESET_PALETTES, customPalette];
  }, [customPalette]);

  // Determine currently active palette
  const activePalette = useMemo(() => {
    if (activePaletteId === 'custom') {
      return customPalette;
    }
    return PRESET_PALETTES.find((p) => p.id === activePaletteId) || PRESET_PALETTES[0];
  }, [activePaletteId, customPalette]);

  // Apply palette to DOM whenever activePalette changes
  useEffect(() => {
    applyPaletteToDom(activePalette);
  }, [activePalette]);

  // Apply card config to DOM whenever cardConfig changes
  useEffect(() => {
    applyCardConfigToDom(cardConfig);
  }, [cardConfig]);

  // Apply navbar config to DOM whenever navbarConfig changes
  useEffect(() => {
    applyNavbarConfigToDom(navbarConfig);
  }, [navbarConfig]);

  // Cross-tab synchronization listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'wss_theme_palette' && e.newValue) {
        setActivePaletteId(e.newValue);
      }
      if (e.key === 'wss_custom_palette' && e.newValue) {
        try {
          setCustomConfig(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Failed to parse updated custom palette:', err);
        }
      }
      if (e.key === 'wss_card_appearance_config' && e.newValue) {
        try {
          setCardConfig(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Failed to parse updated card appearance config:', err);
        }
      }
      if (e.key === 'wss_navbar_appearance_config' && e.newValue) {
        try {
          setNavbarConfig(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Failed to parse updated navbar appearance config:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const { role } = useAuth();
  const canModifyTheme = role === 'SUPER_ADMIN';

  const setPaletteById = useCallback(
    (id: string) => {
      if (!canModifyTheme) {
        console.warn('[ThemePalette] Unauthorized: Only Super Admin can modify theme settings.');
        return;
      }
      setActivePaletteId(id);
      savePaletteToStorage(id, customConfig);
    },
    [canModifyTheme, customConfig]
  );

  const updateCustomConfig = useCallback((updated: Partial<CustomPaletteConfig>) => {
    if (!canModifyTheme) return;
    setCustomConfig((prev) => {
      const next = { ...prev, ...updated };
      return next;
    });
  }, [canModifyTheme]);

  const applyCustomPalette = useCallback(() => {
    if (!canModifyTheme) return;
    setActivePaletteId('custom');
    savePaletteToStorage('custom', customConfig);
  }, [canModifyTheme, customConfig]);

  const resetToDefault = useCallback(() => {
    if (!canModifyTheme) return;
    setActivePaletteId(DEFAULT_PALETTE_ID);
    savePaletteToStorage(DEFAULT_PALETTE_ID);
  }, [canModifyTheme]);

  const updateCardConfig = useCallback((updated: Partial<CardAppearanceConfig>) => {
    if (!canModifyTheme) return;
    setCardConfig((prev) => {
      const next = { ...prev, ...updated };
      saveCardConfigToStorage(next);
      return next;
    });
  }, [canModifyTheme]);

  const resetCardConfig = useCallback(() => {
    if (!canModifyTheme) return;
    setCardConfig(DEFAULT_CARD_CONFIG);
    saveCardConfigToStorage(DEFAULT_CARD_CONFIG);
  }, [canModifyTheme]);

  const updateNavbarConfig = useCallback((updated: Partial<NavbarAppearanceConfig>) => {
    if (!canModifyTheme) return;
    setNavbarConfig((prev) => {
      const next = { ...prev, ...updated };
      saveNavbarConfigToStorage(next);
      return next;
    });
  }, [canModifyTheme]);

  const resetNavbarConfig = useCallback(() => {
    if (!canModifyTheme) return;
    setNavbarConfig(DEFAULT_NAVBAR_CONFIG);
    saveNavbarConfigToStorage(DEFAULT_NAVBAR_CONFIG);
  }, [canModifyTheme]);

  const value = useMemo(
    () => ({
      palettes: allPalettes,
      activePalette,
      activePaletteId,
      customPalette,
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
      isCustomActive: activePaletteId === 'custom',
    }),
    [
      allPalettes,
      activePalette,
      activePaletteId,
      customPalette,
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
    ]
  );

  return <ThemePaletteContext.Provider value={value}>{children}</ThemePaletteContext.Provider>;
};

export const useThemePalette = (): ThemePaletteContextType => {
  const context = useContext(ThemePaletteContext);
  if (!context) {
    throw new Error('useThemePalette must be used within a ThemePaletteProvider');
  }
  return context;
};
