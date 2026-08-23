import React, { createContext, useContext, useState, useEffect } from 'react';
import { setAppIcon, ICON_THEME_IDS } from '../utils/iconSwitcher';
import type { IconThemeId } from '../utils/iconSwitcher';

export { ICON_THEME_IDS };
export type { IconThemeId };

export interface ThemeColors {
  bgGradientFrom: string;
  bgGradientTo:   string;
  surface:        string;
  surfaceBorder:  string;
  textPrimary:    string;
  textSecondary:  string;
  textMuted:      string;
  accent:         string;
  accentHover:    string;
  accentText:     string;
  done:           string;
  doneBg:         string;
  doneText:       string;
  danger:         string;
  dangerBg:       string;
  headerBg:       string;
  headerBorder:   string;
  navBg:          string;
  navBorder:      string;
  navActive:      string;
  navInactive:    string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
}

export const BUILT_IN_THEMES: Theme[] = [
  {
    id: 'amber', name: '🟤 Borostyán (alapértelmezett)',
    colors: {
      bgGradientFrom:'#fffbeb', bgGradientTo:'#fff7ed',
      surface:'#ffffff', surfaceBorder:'#fef3c7',
      textPrimary:'#78350f', textSecondary:'#d97706', textMuted:'#fbbf24',
      accent:'#d97706', accentHover:'#b45309', accentText:'#ffffff',
      done:'#22c55e', doneBg:'#f0fdf4', doneText:'#15803d',
      danger:'#ef4444', dangerBg:'#fef2f2',
      headerBg:'#ffffffcc', headerBorder:'#fde68a',
      navBg:'#ffffff99', navBorder:'#fef3c7',
      navActive:'#d97706', navInactive:'#d97706',
    },
  },
  {
    id: 'slate', name: '🔵 Palaszürke-kék',
    colors: {
      bgGradientFrom:'#f1f5f9', bgGradientTo:'#e2e8f0',
      surface:'#ffffff', surfaceBorder:'#cbd5e1',
      textPrimary:'#0f172a', textSecondary:'#475569', textMuted:'#94a3b8',
      accent:'#3b82f6', accentHover:'#2563eb', accentText:'#ffffff',
      done:'#22c55e', doneBg:'#f0fdf4', doneText:'#15803d',
      danger:'#ef4444', dangerBg:'#fef2f2',
      headerBg:'#ffffffd9', headerBorder:'#cbd5e1',
      navBg:'#ffffffb3', navBorder:'#e2e8f0',
      navActive:'#3b82f6', navInactive:'#475569',
    },
  },
  {
    id: 'forest', name: '🌿 Erdő',
    colors: {
      bgGradientFrom:'#f0fdf4', bgGradientTo:'#ecfdf5',
      surface:'#ffffff', surfaceBorder:'#bbf7d0',
      textPrimary:'#14532d', textSecondary:'#16a34a', textMuted:'#4ade80',
      accent:'#16a34a', accentHover:'#15803d', accentText:'#ffffff',
      done:'#22c55e', doneBg:'#f0fdf4', doneText:'#15803d',
      danger:'#ef4444', dangerBg:'#fef2f2',
      headerBg:'#ffffffd9', headerBorder:'#bbf7d0',
      navBg:'#ffffffb3', navBorder:'#dcfce7',
      navActive:'#16a34a', navInactive:'#16a34a',
    },
  },
  {
    id: 'rose', name: '🌹 Rózsa',
    colors: {
      bgGradientFrom:'#fff1f2', bgGradientTo:'#fdf2f8',
      surface:'#ffffff', surfaceBorder:'#fecdd3',
      textPrimary:'#881337', textSecondary:'#e11d48', textMuted:'#fb7185',
      accent:'#e11d48', accentHover:'#be123c', accentText:'#ffffff',
      done:'#22c55e', doneBg:'#f0fdf4', doneText:'#15803d',
      danger:'#ef4444', dangerBg:'#fef2f2',
      headerBg:'#ffffffd9', headerBorder:'#fecdd3',
      navBg:'#ffffffb3', navBorder:'#ffe4e6',
      navActive:'#e11d48', navInactive:'#e11d48',
    },
  },
  {
    id: 'night', name: '🌙 Éjszaka (sötét)',
    colors: {
      bgGradientFrom:'#0f172a', bgGradientTo:'#1e1b4b',
      surface:'#1e293b', surfaceBorder:'#334155',
      textPrimary:'#f1f5f9', textSecondary:'#94a3b8', textMuted:'#475569',
      accent:'#818cf8', accentHover:'#6366f1', accentText:'#ffffff',
      done:'#4ade80', doneBg:'#14532d', doneText:'#86efac',
      danger:'#f87171', dangerBg:'#7f1d1d',
      headerBg:'#0f172af2', headerBorder:'#334155',
      navBg:'#1e293bf2', navBorder:'#1e293b',
      navActive:'#818cf8', navInactive:'#94a3b8',
    },
  },
];

export const DEFAULT_CUSTOM: ThemeColors = { ...BUILT_IN_THEMES[0].colors };
// Biztosítjuk, hogy a default custom is hex formátumú legyen (nem rgba)
DEFAULT_CUSTOM.headerBg = '#ffffffcc';
DEFAULT_CUSTOM.navBg    = '#ffffff99';
export const CUSTOM_SLOT_IDS = ['custom1', 'custom2', 'custom3'] as const;
export type CustomSlotId = typeof CUSTOM_SLOT_IDS[number];
export const CUSTOM_SLOT_LABELS: Record<CustomSlotId, string> = {
  custom1: '🎨 Egyéni 1',
  custom2: '🎨 Egyéni 2',
  custom3: '🎨 Egyéni 3',
};

// Import/export type tag
export const THEME_EXPORT_TAG = '__shadowarts_themes__';

interface ThemeContextType {
  theme: Theme;
  setThemeById: (id: string) => void;
  customSlots: Record<CustomSlotId, ThemeColors>;
  setCustomSlot: (slot: CustomSlotId, c: ThemeColors) => void;
  allThemes: Theme[];
  exportThemes: () => string;
  importThemes: (json: string) => void;
  // Ikon kezelés
  customSlotIcons: Record<CustomSlotId, IconThemeId>;
  setCustomSlotIcon: (slot: CustomSlotId, iconId: IconThemeId) => void;
  activeIconId: IconThemeId;
  // Klónozás: egy beépített téma színeinek + ikonjának másolása egy egyéni slotba
  cloneBuiltInToSlot: (slot: CustomSlotId, builtInId: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function loadSlot(key: string): ThemeColors {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : { ...DEFAULT_CUSTOM };
  } catch { return { ...DEFAULT_CUSTOM }; }
}

function loadIconChoice(key: string): IconThemeId {
  const v = localStorage.getItem(key);
  return (ICON_THEME_IDS as readonly string[]).includes(v || '') ? (v as IconThemeId) : 'amber';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<string>(
    () => localStorage.getItem('sa-theme-id') || 'amber'
  );
  const [customSlots, setCustomSlots] = useState<Record<CustomSlotId, ThemeColors>>({
    custom1: loadSlot('sa-theme-custom1'),
    custom2: loadSlot('sa-theme-custom2'),
    custom3: loadSlot('sa-theme-custom3'),
  });
  const [customSlotIcons, setCustomSlotIcons] = useState<Record<CustomSlotId, IconThemeId>>({
    custom1: loadIconChoice('sa-icon-custom1'),
    custom2: loadIconChoice('sa-icon-custom2'),
    custom3: loadIconChoice('sa-icon-custom3'),
  });

  const allThemes: Theme[] = [
    ...BUILT_IN_THEMES,
    ...CUSTOM_SLOT_IDS.map(id => ({
      id,
      name: CUSTOM_SLOT_LABELS[id],
      colors: customSlots[id],
    })),
  ];

  const theme = allThemes.find(t => t.id === themeId) ?? BUILT_IN_THEMES[0];

  const setThemeById = (id: string) => {
    setThemeId(id);
    localStorage.setItem('sa-theme-id', id);
  };

  const setCustomSlot = (slot: CustomSlotId, c: ThemeColors) => {
    setCustomSlots(prev => ({ ...prev, [slot]: c }));
    localStorage.setItem(`sa-theme-${slot}`, JSON.stringify(c));
    setThemeById(slot);
  };

  // Melyik ikon-variánst kell megjeleníteni az aktuális témához.
  // Beépített témáknál 1:1 megfeleltetés (amber -> amber ikon, stb.),
  // egyéni témáknál a felhasználó által kiválasztott ikon variánst használjuk.
  const activeIconId: IconThemeId = (ICON_THEME_IDS as readonly string[]).includes(themeId)
    ? (themeId as IconThemeId)
    : customSlotIcons[themeId as CustomSlotId] ?? 'amber';

  const setCustomSlotIcon = (slot: CustomSlotId, iconId: IconThemeId) => {
    setCustomSlotIcons(prev => ({ ...prev, [slot]: iconId }));
    localStorage.setItem(`sa-icon-${slot}`, iconId);
    if (themeId === slot) {
      setAppIcon(iconId);
    }
  };

  // Egy beépített téma színeinek és ikonjának lemásolása egy egyéni slotba,
  // hogy onnantól szabadon szerkeszthető legyen.
  const cloneBuiltInToSlot = (slot: CustomSlotId, builtInId: string) => {
    const builtIn = BUILT_IN_THEMES.find(t => t.id === builtInId);
    if (!builtIn) return;
    setCustomSlot(slot, { ...builtIn.colors });
    if ((ICON_THEME_IDS as readonly string[]).includes(builtInId)) {
      setCustomSlotIcon(slot, builtInId as IconThemeId);
    }
  };

  // Amikor az aktív ikon-azonosító megváltozik (téma váltás vagy egyéni ikon választás),
  // szóljunk a natív pluginnak, hogy váltsa az Android launcher ikont.
  useEffect(() => {
    setAppIcon(activeIconId);
  }, [activeIconId]);

  const exportThemes = (): string => {
    return JSON.stringify({
      [THEME_EXPORT_TAG]: true,
      activeThemeId: themeId,
      customSlots,
      customSlotIcons,
    }, null, 2);
  };

  const importThemes = (json: string) => {
    const data = JSON.parse(json);
    if (!data[THEME_EXPORT_TAG]) throw new Error('Not a theme export file');
    if (data.customSlots) {
      const slots = data.customSlots as Record<CustomSlotId, ThemeColors>;
      CUSTOM_SLOT_IDS.forEach(id => {
        if (slots[id]) {
          localStorage.setItem(`sa-theme-${id}`, JSON.stringify(slots[id]));
        }
      });
      setCustomSlots(prev => ({ ...prev, ...slots }));
    }
    if (data.customSlotIcons) {
      const icons = data.customSlotIcons as Record<CustomSlotId, IconThemeId>;
      CUSTOM_SLOT_IDS.forEach(id => {
        if (icons[id]) {
          localStorage.setItem(`sa-icon-${id}`, icons[id]);
        }
      });
      setCustomSlotIcons(prev => ({ ...prev, ...icons }));
    }
    if (data.activeThemeId) setThemeById(data.activeThemeId);
  };

  // Apply CSS variables
  useEffect(() => {
    const c = theme.colors;
    const r = document.documentElement;
    r.style.setProperty('--color-bg-from',        c.bgGradientFrom);
    r.style.setProperty('--color-bg-to',          c.bgGradientTo);
    r.style.setProperty('--color-surface',        c.surface);
    r.style.setProperty('--color-surface-border', c.surfaceBorder);
    r.style.setProperty('--color-text-primary',   c.textPrimary);
    r.style.setProperty('--color-text-secondary', c.textSecondary);
    r.style.setProperty('--color-text-muted',     c.textMuted);
    r.style.setProperty('--color-accent',         c.accent);
    r.style.setProperty('--color-accent-hover',   c.accentHover);
    r.style.setProperty('--color-accent-text',    c.accentText);
    r.style.setProperty('--color-done',           c.done);
    r.style.setProperty('--color-done-bg',        c.doneBg);
    r.style.setProperty('--color-done-text',      c.doneText);
    r.style.setProperty('--color-danger',         c.danger);
    r.style.setProperty('--color-danger-bg',      c.dangerBg);
    r.style.setProperty('--color-header-bg',      c.headerBg);
    r.style.setProperty('--color-header-border',  c.headerBorder);
    r.style.setProperty('--color-nav-bg',         c.navBg);
    r.style.setProperty('--color-nav-border',     c.navBorder);
    r.style.setProperty('--color-nav-active',     c.navActive);
    r.style.setProperty('--color-nav-inactive',   c.navInactive);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{
      theme, setThemeById, customSlots, setCustomSlot, allThemes, exportThemes, importThemes,
      customSlotIcons, setCustomSlotIcon, activeIconId, cloneBuiltInToSlot,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
