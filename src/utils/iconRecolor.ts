import type { IconThemeId } from './iconSwitcher';

/**
 * Valódi, elemenkénti (háromszög / nyíl-kör / háttér) ikon-újraszínezés,
 * MINTAVÉTELEZÉS alapján.
 *
 * A korábbi megoldás fix hue/saturation tartományokkal próbálta eldönteni,
 * melyik pixel melyik elemhez tartozik - ez törékeny volt, mert nem
 * feltétlenül illeszkedett a ténylegesen használt kép (native/icons/icon-amber.png)
 * valódi színeire (pl. ha a piros árnyalata vagy telítettsége kicsit eltért
 * a feltételezettől, a háromszög pixelei tévesen a háttérhez kerültek, és a
 * "Háromszög" szín módosítása látszólag semmit nem csinált).
 *
 * Az új megoldás ehelyett a KÉPBŐL MAGÁBÓL mintavételez 3 referenciapontot
 * (egy a háromszög belsejéből, egy a nyíl/kör vonalról, egy a háttérből),
 * majd minden pixelt a HOZZÁ LEGKÖZELEBBI referenciaszín alapján sorol be,
 * és a hozzá tartozó cél hex színre fest át - az eredeti FÉNYERŐ (lightness)
 * megtartásával, hogy a 3D-s árnyékolás/bevel hatás megmaradjon.
 *
 * FONTOS: ez a logika (mintapontok + osztályozás + színezés) pontosan meg
 * kell egyezzen a scripts/recolor-icon.cjs fájlban lévő Node/sharp
 * verzióval, hogy a webes előnézet és a natívan generált Android ikon
 * vizuálisan azonos legyen!
 */

export interface IconColors {
  triangle: string;   // a háromszög célszíne
  arrow: string;      // a nyíl + körvonal célszíne
  background: string; // a háttér célszíne
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

// ── Mintapontok ────────────────────────────────────────────────────────────
// A kép szélességéhez/magasságához viszonyított (0..1) relatív koordináták,
// ahonnan a 3 referenciaszínt mintavételezzük. A felhasználó ikonjának
// elrendezéséhez igazítva: háromszög csúcsa alatt balra (piros terület, nem
// éri a nyilat), a nyílszár felső, egyenes szakasza (fekete, a tollazattól
// lejjebb), és a bal felső sarok (háttér).
// FONTOS: tartsd szinkronban a scripts/recolor-icon.cjs SAMPLE_POINTS objektummal!
export const SAMPLE_POINTS = {
  background: { x: 0.05, y: 0.05 },
  triangle:   { x: 0.27, y: 0.72 },
  arrow:      { x: 0.50, y: 0.34 },
};

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

export type IconRegion = 'triangle' | 'arrow' | 'background';

interface ReferenceRgb {
  triangle: [number, number, number];
  arrow: [number, number, number];
  background: [number, number, number];
}

function colorDistanceSq(a: [number, number, number], b: [number, number, number]): number {
  const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

/** A hozzá legközelebbi referenciaszín alapján osztályoz egy (r,g,b) pixelt. */
export function classifyByReference(r: number, g: number, b: number, refs: ReferenceRgb): IconRegion {
  const px: [number, number, number] = [r, g, b];
  const dTriangle = colorDistanceSq(px, refs.triangle);
  const dArrow = colorDistanceSq(px, refs.arrow);
  const dBackground = colorDistanceSq(px, refs.background);
  if (dTriangle <= dArrow && dTriangle <= dBackground) return 'triangle';
  if (dArrow <= dBackground) return 'arrow';
  return 'background';
}

/**
 * Egy teljes ImageData (Canvas API) újraszínezése helyben (mutálva).
 * A referenciaszíneket a KÉPBŐL MAGÁBÓL mintavételezi (SAMPLE_POINTS szerint),
 * mielőtt bármit módosítana, így mindig a ténylegesen használt ikonhoz
 * igazodik, nem egy előre feltételezett szín-tartományhoz.
 */
export function recolorImageData(imageData: ImageData, colors: IconColors): void {
  const { data, width, height } = imageData;

  const sample = (fx: number, fy: number): [number, number, number] => {
    const x = Math.min(width - 1, Math.max(0, Math.round(fx * width)));
    const y = Math.min(height - 1, Math.max(0, Math.round(fy * height)));
    const i = (y * width + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };

  const refs: ReferenceRgb = {
    background: sample(SAMPLE_POINTS.background.x, SAMPLE_POINTS.background.y),
    triangle: sample(SAMPLE_POINTS.triangle.x, SAMPLE_POINTS.triangle.y),
    arrow: sample(SAMPLE_POINTS.arrow.x, SAMPLE_POINTS.arrow.y),
  };

  const targetHsl = {
    triangle: rgbToHsl(...hexToRgb(colors.triangle)),
    arrow: rgbToHsl(...hexToRgb(colors.arrow)),
    background: rgbToHsl(...hexToRgb(colors.background)),
  };

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue; // teljesen átlátszó pixel kihagyása
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const region = classifyByReference(r, g, b, refs);
    const { l } = rgbToHsl(r, g, b);
    const target = targetHsl[region];
    const [nr, ng, nb] = hslToRgb(target.h, target.s, l);
    data[i] = nr;
    data[i + 1] = ng;
    data[i + 2] = nb;
  }
}
