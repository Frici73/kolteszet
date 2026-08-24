#!/usr/bin/env node
/**
 * Legenerálja az Android launcher ikon-készleteket mind az 5 beépített
 * színtémához (amber, slate, forest, rose, night).
 *
 * FONTOS: csak EGY forrás-ikon létezik (native/icons/icon-amber.png - a
 * felhasználó saját, egyedi tervezésű ikonja). A többi téma ikonját ebből
 * állítjuk elő színforgatással (hue rotation), így garantáltan PONTOSAN
 * ugyanaz a forma marad minden téma ikonján, kizárólag a szín változik.
 *
 * FONTOS: ha itt módosítasz egy hue/saturation/brightness értéket,
 * frissítsd a src/utils/iconRecolor.ts fájlban lévő ICON_TUNE_PRESETS
 * objektumot is, hogy a webes előnézet pontos maradjon!
 *
 * A .cjs kiterjesztés szándékos: a projekt package.json-ja "type": "module",
 * emiatt a sima .js fájlokban a require() nem működik. A .cjs kiterjesztés
 * kikényszeríti a CommonJS módot, függetlenül a package.json beállítástól.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const ANDROID_RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
const ASSETS_DIR = path.join(ROOT, 'assets');
const MASTER_ICON = path.join(ROOT, 'native', 'icons', 'icon-amber.png');
const DENSITIES = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];

// Színforgatás (hue rotation) fokban + finomhangolás minden témához.
// FONTOS: ha itt módosítasz egy értéket, frissítsd a src/utils/iconRecolor.ts
// fájlban lévő ICON_TUNE_PRESETS objektumot is, hogy a webes előnézet pontos maradjon!
const THEME_RECOLOR = {
  // Az eredeti piros háromszöget a barna ("Borostyán" téma) felé toljuk:
  // enyhe narancs irányú hue-rotate + csökkentett fényerő/telítettség.
  amber:  { hue: 18,  saturation: 0.85, brightness: 0.78 },
  slate:  { hue: 217, saturation: 1.05, brightness: 1 },      // kék
  forest: { hue: 142, saturation: 1.05, brightness: 1 },      // zöld
  rose:   { hue: 347, saturation: 1.05, brightness: 1 },      // rózsaszín
  night:  { hue: 234, saturation: 1.25, brightness: 0.62 },   // indigó, sötétebb
};

// Amber-t generáljuk utoljára, hogy az alapértelmezett (nem téma-jelölt)
// ic_launcher.png/ic_launcher_round.png a felhasználó eredeti ikonjának
// barnára hangolt verziója maradjon.
const THEME_ORDER = ['slate', 'forest', 'rose', 'night', 'amber'];

function log(msg) {
  console.log(`[theme-icons] ${msg}`);
}

async function buildSourceIcon(themeId) {
  const recolor = THEME_RECOLOR[themeId];
  const outPath = path.join(ASSETS_DIR, `_src-${themeId}.png`);

  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    throw new Error('A "sharp" csomag nincs telepítve. Futtasd: npm install -D sharp');
  }

  await sharp(MASTER_ICON).modulate(recolor).toFile(outPath);
  return outPath;
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
      const iconPath = await buildSourceIcon(theme);
      runAssetsGenerate(iconPath);
      copyThemedOutputs(theme);
      log(`"${theme}" téma ikon-készlet kész.`);
    } catch (err) {
      log(`HIBA a(z) "${theme}" téma generálásakor: ${err.message}`);
      throw err;
    }
  }

  log('Minden téma-ikon elkészült! ✅ (a saját icon-amber.png mester ikonból, egyedi színforgatással, azonos formával)');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
