import type { IconThemeId } from '../context/ThemeContext';

/**
 * CSS filter megfelelője a scripts/generate-theme-icons.cjs fájlban lévő
 * THEME_RECOLOR beállításoknak (sharp .modulate()). A natív build ezekkel
 * az értékekkel forgatja el az "amber" mester-ikon színét a többi témához.
 *
 * FONTOS: ha a .cjs scriptben módosítod a hue/saturation/brightness
 * értékeket, itt is frissítsd ugyanazokra, hogy az előnézet pontos maradjon!
 */
export const ICON_RECOLOR_FILTER: Record<IconThemeId, string> = {
  amber:  'none',
  slate:  'hue-rotate(217deg) saturate(1.05)',
  forest: 'hue-rotate(142deg) saturate(1.05)',
  rose:   'hue-rotate(347deg) saturate(1.05)',
  night:  'hue-rotate(234deg) saturate(1.25) brightness(0.62)',
};
