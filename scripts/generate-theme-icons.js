#!/usr/bin/env node
/**
 * Legenerálja az Android launcher ikon-készleteket mind az 5 beépített
 * színtémához (amber, slate, forest, rose, night) a native/icons/ mappában
 * található forrás képekből.
 *
 * Minden téma ikonjait a @capacitor/assets segítségével állítja elő,
 * majd a kimeneti fájlokat témajelölt névre (pl. ic_launcher_amber.png)
 * másolja át minden sűrűségi mappában (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi),
 * hogy mind az 5 ikonvariáns egyszerre létezzen az APK-ban.
 *
 * Az utolsó lépésben az "amber" ikon kerül vissza alapértelmezettként
 * a normál (nem témajelölt) ic_launcher.png / ic_launcher_round.png helyre,
 * mert ez a MainActivity sajátikonja / az alias-ok fallback ikonja.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const THEMES = ['amber', 'slate', 'forest', 'rose', 'night'];
const DENSITIES = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];

const ROOT = process.cwd();
const ANDROID_RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
const ASSETS_DIR = path.join(ROOT, 'assets');

function log(msg) {
  console.log(`[theme-icons] ${msg}`);
}

function generateFor(themeSourcePath) {
  fs.copyFileSync(themeSourcePath, path.join(ASSETS_DIR, 'icon.png'));
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

function main() {
  if (!fs.existsSync(path.join(ROOT, 'android'))) {
    log('Az "android" mappa nem létezik, kihagyva.');
    return;
  }

  if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

  for (const theme of THEMES) {
    const sourceIcon = path.join(ROOT, 'native', 'icons', `icon-${theme}.png`);
    if (!fs.existsSync(sourceIcon)) {
      log(`FIGYELEM: hiányzik a(z) "${theme}" téma ikonja (${sourceIcon}), kihagyva.`);
      continue;
    }

    log(`"${theme}" téma ikon-készlet generálása...`);
    try {
      generateFor(sourceIcon);
      copyThemedOutputs(theme);
      log(`"${theme}" téma ikon-készlet kész.`);
    } catch (err) {
      log(`HIBA a(z) "${theme}" téma generálásakor: ${err.message}`);
    }
  }

  // Az "amber" ikon legyen az alapértelmezett (nem témajelölt) ic_launcher,
  // mert ez a MainActivity / alias fallback ikonja.
  const defaultIcon = path.join(ROOT, 'native', 'icons', 'icon-amber.png');
  if (fs.existsSync(defaultIcon)) {
    log('Alapértelmezett (amber) ikon visszaállítása...');
    try {
      generateFor(defaultIcon);
      log('Alapértelmezett ikon kész.');
    } catch (err) {
      log(`HIBA az alapértelmezett ikon generálásakor: ${err.message}`);
    }
  }

  log('Minden téma-ikon elkészült! ✅');
}

main();
