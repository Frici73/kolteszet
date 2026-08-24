#!/usr/bin/env node
/**
 * Legenerálja az Android launcher ikon-készleteket mind az 5 beépített
 * színtémához (amber, slate, forest, rose, night).
 *
 * FONTOS: csak EGY forrás-ikon létezik (native/icons/icon-amber.png - a
 * felhasználó saját, egyedi tervezésű ikonja). A többi téma ikonját ebből
 * állítjuk elő VALÓDI, ELEMENKÉNTI (háromszög / nyíl-kör / háttér)
 * pixel-újraszínezéssel (lásd scripts/recolor-icon.cjs), így minden elem
 * külön hex színt kaphat, és a forma garantáltan azonos marad.
 *
 * FONTOS: ha itt módosítasz egy színt, frissítsd a src/utils/iconRecolor.ts
 * fájlban lévő ICON_COLOR_PRESETS objektumot is, hogy a webes előnézet
 * pontos maradjon!
 *
 * A .cjs kiterjesztés szándékos: a projekt package.json-ja "type": "module",
 * emiatt a sima .js fájlokban a require() nem működik. A .cjs kiterjesztés
 * kikényszeríti a CommonJS módot, függetlenül a package.json beállítástól.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { recolorIconFile } = require('./recolor-icon.cjs');

const ROOT = process.cwd();
const ANDROID_RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
const ASSETS_DIR = path.join(ROOT, 'assets');
const MASTER_ICON = path.join(ROOT, 'native', 'icons', 'icon-amber.png');
const DENSITIES = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];

// Az 5 beépített téma elemenkénti hex színei.
// FONTOS: tartsd szinkronban a src/utils/iconRecolor.ts ICON_COLOR_PRESETS objektummal!
const THEME_COLORS = {
  amber:  { triangle: '#92400e', arrow: '#1c1917', background: '#e7dcc8' },
  slate:  { triangle: '#2563eb', arrow: '#111827', background: '#dbe4f0' },
  forest: { triangle: '#16a34a', arrow: '#111827', background: '#dcf0e2' },
  rose:   { triangle: '#e11d48', arrow: '#111827', background: '#f6dce2' },
  night:  { triangle: '#6366f1', arrow: '#e5e7eb', background: '#1e2340' },
};

// Amber-t generáljuk utoljára, hogy az alapértelmezett (nem téma-jelölt)
// ic_launcher.png/ic_launcher_round.png a felhasználó eredeti ikonjának
// barnára hangolt verziója maradjon.
const THEME_ORDER = ['slate', 'forest', 'rose', 'night', 'amber'];

function log(msg) {
  console.log(`[theme-icons] ${msg}`);
}

function runAssetsGenerate(iconPath) {
  fs.copyFileSync(iconPath, path.join(ASSETS_DIR, 'icon.png'));
  execSync(
    `npx @capacitor/assets generate --android --iconBackgroundColor '#ffffff' --splashBackgroundColor '#ffffff'`,
    { stdio: 'inherit' }
  );
}

function copyThemedOutputs(theme) {
  for (const density of DENSITIES) {
    const dir = path.join(ANDROID_RES, density);
    if (!fs.existsSync(dir)) continue;

    const squareSrc = path.join(dir, 'ic_launcher.png');
    const roundSrc = path.join(dir, 'ic_launcher_round.png');
    const squareDst = path.join(dir, `ic_launcher_${theme}.png`);
    const roundDst = path.join(dir, `ic_launcher_${theme}_round.png`);

    if (fs.existsSync(squareSrc)) fs.copyFileSync(squareSrc, squareDst);
    if (fs.existsSync(roundSrc)) fs.copyFileSync(roundSrc, roundDst);
  }
}

async function main() {
  if (!fs.existsSync(path.join(ROOT, 'android'))) {
    log('Az "android" mappa nem létezik, kihagyva.');
    return;
  }
  if (!fs.existsSync(MASTER_ICON)) {
    log(`HIBA: a mester ikon nem található: ${MASTER_ICON}`);
    process.exit(1);
  }
  if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

  for (const theme of THEME_ORDER) {
    log(`"${theme}" téma ikon-készlet generálása...`);
    try {
      const outPath = path.join(ASSETS_DIR, `_src-${theme}.png`);
      await recolorIconFile(MASTER_ICON, THEME_COLORS[theme], outPath);
      runAssetsGenerate(outPath);
      copyThemedOutputs(theme);
      log(`"${theme}" téma ikon-készlet kész.`);
    } catch (err) {
      log(`HIBA a(z) "${theme}" téma generálásakor: ${err.message}`);
      throw err;
    }
  }

  log('Minden téma-ikon elkészült! ✅ (a saját icon-amber.png mester ikonból, elemenkénti hex-újraszínezéssel)');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
