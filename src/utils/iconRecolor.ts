import type { IconThemeId } from './iconSwitcher';

/**
 * Színforgatás (hue/saturation/brightness) beállítások az 5 beépített
 * ikon-témához. Ezek az ÉRTÉKEK pontosan meg kell egyezzenek a
 * scripts/generate-theme-icons.cjs fájlban lévő THEME_RECOLOR objektummal,
 * mert ott ugyanezekkel az adatokkal (sharp .modulate()) állítjuk elő a
 * felhasználó saját, egyedi tervezésű ikonjából (native/icons/icon-amber.png)
 * a tényleges Android launcher ikon képfájlokat.
 *
 * FONTOS: ha itt módosítasz egy értéket, frissítsd a .cjs scriptben lévő
 * megfelelőjét is (és fordítva), hogy a webes előnézet pontos maradjon!
 */
export interface IconTune {
  hue: number;         // fok, -180..180 (vagy bármilyen érték, körbeforog)
  saturation: number;  // szorzó, 0..2 (1 = változatlan)
  brightness: number;  // szorzó, 0.3..1.5 (1 = változatlan)
}

// Amber: az eredeti piros háromszöget kicsit a barna felé toljuk el
// (enyhe narancs irányú hue-rotate + csökkentett fényerő/telítettség),
// hogy jobban illeszkedjen a "Borostyán" témához.
export const ICON_TUNE_PRESETS: Record<IconThemeId, IconTune> = {
  amber:  { hue: 18,  saturation: 0.85, brightness: 0.78 },
  slate:  { hue: 217, saturation: 1.05, brightness: 1 },
  forest: { hue: 142, saturation: 1.05, brightness: 1 },
  rose:   { hue: 347, saturation: 1.05, brightness: 1 },
  night:  { hue: 234, saturation: 1.25, brightness: 0.62 },
};

export const DEFAULT_ICON_TUNE: IconTune = { ...ICON_TUNE_PRESETS.amber };

/** CSS filter string legenerálása egy IconTune objektumból (webes előnézethez). */
export function iconTuneToCssFilter(tune: IconTune): string {
  return `hue-rotate(${tune.hue}deg) saturate(${tune.saturation}) brightness(${tune.brightness})`;
}

// ── Hex ↔ Tune konverzió ──────────────────────────────────────────────────
// Ahhoz, hogy a felhasználó hex kóddal (ne csúszkával) állíthassa be az ikon
// színét, egy referencia színhez (a mester ikon eredeti, hue-rotate nélküli
// háromszög-színéhez) viszonyítva számoljuk ki, milyen hue/saturation/
// brightness "tune"-t kell alkalmazni a képre, hogy kb. a megadott hex
// színt kapjuk. Ez a számítás közelítő, de a hue-rotate/saturate/brightness
// CSS filter és a sharp .modulate() is hasonló elven működik, így a webes
// előnézet és a natív build vizuálisan összhangban marad.
const REFERENCE_ICON_HEX = '#dc2626';

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const num = parseInt(h.slice(0, 6), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function normalizeHueDelta(delta: number): number {
  let d = delta % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

const REFERENCE_HSL = rgbToHsl(...hexToRgb(REFERENCE_ICON_HEX));

/** Kiszámolja, milyen hue/saturation/brightness tune-t kell alkalmazni a mester
 *  ikonra ahhoz, hogy kb. a megadott hex színt kapjuk a háromszög helyén. */
export function tuneFromHex(hex: string): IconTune {
  const target = rgbToHsl(...hexToRgb(hex));
  const hue = normalizeHueDelta(target.h - REFERENCE_HSL.h);
  const saturation = REFERENCE_HSL.s === 0 ? 1 : clamp(target.s / REFERENCE_HSL.s, 0, 3);
  const brightness = REFERENCE_HSL.l === 0 ? 1 : clamp(target.l / REFERENCE_HSL.l, 0.3, 1.8);
  return { hue, saturation, brightness };
}

/** Egy tune-hoz tartozó megközelítő hex szín (a fenti számítás fordítottja),
 *  pl. preset gombok hex-mezőben való megjelenítéséhez. */
export function hexFromTune(tune: IconTune): string {
  const h = REFERENCE_HSL.h + tune.hue;
  const s = REFERENCE_HSL.s * tune.saturation;
  const l = REFERENCE_HSL.l * tune.brightness;
  return hslToHex(h, s, l);
}

export const DEFAULT_ICON_COLOR_HEX = hexFromTune(DEFAULT_ICON_TUNE);
