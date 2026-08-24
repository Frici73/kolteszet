#!/usr/bin/env node
/**
 * Valódi, elemenkénti (háromszög / nyíl-kör / háttér) ikon-újraszínezés,
 * MINTAVÉTELEZÉS alapján, nyers pixel-manipulációval (sharp raw buffer).
 *
 * A referenciaszíneket a KÉPBŐL MAGÁBÓL mintavételezzük (SAMPLE_POINTS
 * szerint), nem előre feltételezett hue/saturation tartományokból - így
 * mindig a ténylegesen használt mester-ikonhoz (native/icons/icon-amber.png)
 * igazodik.
 *
 * FONTOS: ez a logika (mintapontok + osztályozás + színezés) pontosan meg
 * kell egyezzen a src/utils/iconRecolor.ts fájlban lévő böngészős (Canvas)
 * verzióval, hogy a webes előnézet és a natívan generált Android ikon
 * vizuálisan azonos legyen!
 */

// FONTOS: tartsd szinkronban a src/utils/iconRecolor.ts SAMPLE_POINTS objektummal!
const SAMPLE_POINTS = {
  background: { x: 0.05, y: 0.05 },
  triangle:   { x: 0.27, y: 0.72 },
  arrow:      { x: 0.50, y: 0.34 },
};

function hexToRgb(hex) {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const num = parseInt(h.slice(0, 6), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHsl(r, g, b) {
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

function hslToRgb(h, s, l) {
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

function colorDistanceSq(a, b) {
  const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

function classifyByReference(r, g, b, refs) {
  const px = [r, g, b];
  const dTriangle = colorDistanceSq(px, refs.triangle);
  const dArrow = colorDistanceSq(px, refs.arrow);
  const dBackground = colorDistanceSq(px, refs.background);
  if (dTriangle <= dArrow && dTriangle <= dBackground) return 'triangle';
  if (dArrow <= dBackground) return 'arrow';
  return 'background';
}

/**
 * Betölti a mester ikont, a SAMPLE_POINTS alapján mintavételezi a 3
 * referenciaszínt MAGÁBÓL A KÉPBŐL, majd minden pixelt a hozzá legközelebbi
 * referencia szerint újraszínez a megadott elemenkénti hex színek szerint
 * (az eredeti fényerő megtartásával), és PNG fájlba írja.
 */
async function recolorIconFile(masterPath, colors, outPath) {
  const sharp = require('sharp');

  const { data, info } = await sharp(masterPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  const sampleAt = (fx, fy) => {
    const x = Math.min(width - 1, Math.max(0, Math.round(fx * width)));
    const y = Math.min(height - 1, Math.max(0, Math.round(fy * height)));
    const i = (y * width + x) * channels;
    return [data[i], data[i + 1], data[i + 2]];
  };

  const refs = {
    background: sampleAt(SAMPLE_POINTS.background.x, SAMPLE_POINTS.background.y),
    triangle: sampleAt(SAMPLE_POINTS.triangle.x, SAMPLE_POINTS.triangle.y),
    arrow: sampleAt(SAMPLE_POINTS.arrow.x, SAMPLE_POINTS.arrow.y),
  };

  const targetHsl = {
    triangle: rgbToHsl(...hexToRgb(colors.triangle)),
    arrow: rgbToHsl(...hexToRgb(colors.arrow)),
    background: rgbToHsl(...hexToRgb(colors.background)),
  };

  console.log(`  [recolor] referenciaszínek: háromszög=${refs.triangle}, nyíl=${refs.arrow}, háttér=${refs.background}`);

  for (let i = 0; i < data.length; i += channels) {
    const a = data[i + 3];
    if (a === 0) continue;

    const r = data[i], g = data[i + 1], b = data[i + 2];
    const region = classifyByReference(r, g, b, refs);
    const { l } = rgbToHsl(r, g, b);
    const target = targetHsl[region];
    const [nr, ng, nb] = hslToRgb(target.h, target.s, l);
    data[i] = nr;
    data[i + 1] = ng;
    data[i + 2] = nb;
  }

  await sharp(data, { raw: { width, height, channels } }).png().toFile(outPath);
  return outPath;
}

module.exports = { recolorIconFile, hexToRgb, rgbToHsl, hslToRgb, classifyByReference, SAMPLE_POINTS };
