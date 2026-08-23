import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * Natív launcher-ikon váltó plugin TypeScript interfésze.
 * Java implementáció: native/android/IconSwitcherPlugin.java
 */
export interface IconSwitcherPluginType {
  isAvailable(): Promise<{ available: boolean }>;
  setIcon(options: { themeId: string }): Promise<{ success: boolean; themeId: string }>;
  getCurrentIcon(): Promise<{ themeId: string }>;
}

export const IconSwitcher = registerPlugin<IconSwitcherPluginType>('IconSwitcher');

/** Elérhető ikon-téma azonosítók (megfelelnek a beépített színtémáknak). */
export const ICON_THEME_IDS = ['amber', 'slate', 'forest', 'rose', 'night'] as const;
export type IconThemeId = typeof ICON_THEME_IDS[number];

export async function isIconSwitchingAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  if (Capacitor.getPlatform() !== 'android') return false;
  try {
    const res = await IconSwitcher.isAvailable();
    return res.available === true;
  } catch {
    return false;
  }
}

/**
 * Beállítja az alkalmazás launcher ikonját a megadott téma szerint.
 * Webes / iOS környezetben nem csinál semmit (nem támogatott).
 */
export async function setAppIcon(themeId: IconThemeId): Promise<boolean> {
  if (!(await isIconSwitchingAvailable())) return false;
  try {
    await IconSwitcher.setIcon({ themeId });
    return true;
  } catch (err) {
    console.warn('Ikon váltás sikertelen:', err);
    return false;
  }
}
