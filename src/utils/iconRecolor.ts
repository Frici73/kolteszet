import type { IconThemeId } from './iconSwitcher';

/**
 * Valódi, elemenkénti (háromszög / nyíl-kör / háttér) ikon-újraszínezés.
 *
 * A felhasználó saját, egyedi tervezésű PNG ikonja (native/icons/icon-amber.png)
 * egy sima raszterkép - nincsenek benne külön "rétegek". Ahhoz, hogy mégis
 * elemenként (nem az egész képet egyben, hue-rotate-tel) tudjuk színezni,
 * PIXELENKÉNT osztályozzuk a képet a pixel eredeti színe alapján 3 kategóriába
 * (háromszög / nyíl-kör / háttér), majd minden kategóriát a hozzá tartozó cél
 * hex színre festünk át úgy, hogy az eredeti FÉNYERŐT (világosság) megtartjuk -
 * ez megőrzi a kép 3D-s árnyékolását/bevel hatását, csak a színárnyalat és
 * telítettség cserélődik a kívánt hex kódra.
 *
 * FONTOS: ez a logika (osztályozás + színezés) pontosan meg kell egyezzen a
 * scripts/recolor-icon.cjs fájlban lévő Node/sharp verzióval, hogy a webes
 * előnézet és a natívan generált Android ikon vizuálisan azonos legyen!
 */

export interface IconColors {
  triangle: string;   // a háromszög (eredetileg piros) célszíne
  arrow: string;      // a nyíl + körvonal (eredetileg fekete) célszíne
  background: string; // a háttér (eredetileg bézs) célszíne
}

// Az 5 beépített téma elemenkénti hex színei.
// FONTOS: tartsd szinkronban a scripts/recolor-icon.cjs THEME_COLORS objektummal!
export const ICON_COLOR_PRESETS: Record<IconThemeId, IconColors> = {
  amber:  { triangle: '#92400e', arrow: '#1c1917', background: '#e7dcc8' },
  slate:  { triangle: '#2563eb', arrow: '#111827', background: '#dbe4f0' },
  forest: { triangle: '#16a34a', arrow: '#111827', background: '#dcf0e2' },
  rose:   { triangle: '#e11d48', arrow: '#111827', background: '#f6dce2' },
  night:  { triangle: '#6366f1', arrow: '#e5e7eb', background: '#1e2340' },
};

export const DEFAULT_ICON_COLORS: IconColors = { ...ICON_COLOR_PRESETS.amber };

// ── Szín konverziók ──────────────────────────────────────────────────────
export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const num = parseInt(h.slice(0, 6), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
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

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
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
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

/**
 * Pixel-osztályozás: az eredeti (piros háromszög / fekete nyíl / bézs háttér)
 * ikon tervezéséhez igazítva. Az árnyékolt/bevel élek is ide tartoznak,
 * mert hue/saturation alapján, nem konkrét RGB-egyezés alapján döntünk.
 */
export type IconRegion = 'triangle' | 'arrow' | 'background';

export function classifyIconPixel(h: number, s: number, l: number): IconRegion {
  // Sötét, alacsony telítettségű pixelek -> nyíl / körvonal (fekete elemek,
  // beleértve azok árnyékolt/kiemelt tónusait is).
  if (s < 0.22 && l < 0.45) return 'arrow';
  // Piros/narancsos árnyalatú, kellően telített pixelek -> háromszög
  // (a bevel miatt sötétebb és világosabb piros tónusok egyaránt idetartoznak).
  if ((h <= 30 || h >= 330) && s >= 0.2) return 'triangle';
  // Minden más (bézs/tan háttér) -> háttér
  return 'background';
}

/**
 * Egy pixelt (r,g,b) újraszínez a megadott elemenkénti célszínek szerint,
 * az eredeti fényerő (l) megtartásával - ez őrzi meg a 3D-s árnyékolást.
 */
export function recolorPixel(r: number, g: number, b: number, colors: IconColors): [number, number, number] {
  const { h, s, l } = rgbToHsl(r, g, b);
  const region = classifyIconPixel(h, s, l);
  const targetHex = colors[region];
  const [tr, tg, tb] = hexToRgb(targetHex);
  const target = rgbToHsl(tr, tg, tb);
  return hslToRgb(target.h, target.s, l);
}

/** Egy teljes ImageData (Canvas API) újraszínezése helyben (mutálva). */
export function recolorImageData(imageData: ImageData, colors: IconColors): void {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue; // teljesen átlátszó pixel kihagyása
    const [nr, ng, nb] = recolorPixel(data[i], data[i + 1], data[i + 2], colors);
    data[i] = nr;
    data[i + 1] = ng;
    data[i + 2] = nb;
  }
}
