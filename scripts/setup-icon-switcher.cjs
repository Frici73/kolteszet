#!/usr/bin/env node
/**
 * Beépíti az IconSwitcher natív Capacitor plugint az Android projektbe.
 * (.cjs kiterjesztés a package.json "type": "module" beállítása miatt kell,
 *  hogy a require() működjön.)
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const THEMES = ['amber', 'slate', 'forest', 'rose', 'night'];

function log(msg) { console.log(`[icon-switcher] ${msg}`); }
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function getAppId() {
  const configPath = path.join(ROOT, 'capacitor.config.ts');
  const jsonPath = path.join(ROOT, 'capacitor.config.json');
  let content = '';
  if (fs.existsSync(configPath)) content = fs.readFileSync(configPath, 'utf8');
  else if (fs.existsSync(jsonPath)) content = fs.readFileSync(jsonPath, 'utf8');
  else throw new Error('capacitor.config.ts/json nem található!');

  const match = content.match(/appId\s*[:=]\s*['"]([^'"]+)['"]/);
  if (!match) throw new Error('appId nem található a capacitor configban!');
  return match[1];
}

function appIdToPath(appId) {
  return appId.replace(/\./g, '/');
}

function copyPlugin(appId) {
  const packagePath = appIdToPath(appId);
  const sourceFile = path.join(ROOT, 'native', 'android', 'IconSwitcherPlugin.java');
  const targetDir = path.join(ROOT, 'android', 'app', 'src', 'main', 'java', packagePath);
  const targetFile = path.join(targetDir, 'IconSwitcherPlugin.java');

  if (!fs.existsSync(sourceFile)) throw new Error(`Forrás plugin nem található: ${sourceFile}`);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  let content = fs.readFileSync(sourceFile, 'utf8');
  content = content.replace(/^package\s+[^;]+;/m, `package ${appId};`);
  fs.writeFileSync(targetFile, content, 'utf8');
  log(`IconSwitcherPlugin.java bemásolva: ${targetFile}`);
}

function registerPluginInMainActivity(appId) {
  const packagePath = appIdToPath(appId);
  const mainActivityPath = path.join(ROOT, 'android', 'app', 'src', 'main', 'java', packagePath, 'MainActivity.java');

  if (!fs.existsSync(mainActivityPath)) throw new Error(`MainActivity.java nem található: ${mainActivityPath}`);

  let content = fs.readFileSync(mainActivityPath, 'utf8');

  if (content.includes('IconSwitcherPlugin.class')) {
    log('IconSwitcherPlugin már regisztrálva van, kihagyva.');
    return;
  }

  const needsBundleImport = !content.includes('import android.os.Bundle');
  if (needsBundleImport) {
    content = content.replace(/^(package\s+[^;]+;\s*)/m, `$1\nimport android.os.Bundle;\n`);
  }

  if (/public\s+void\s+onCreate\s*\(\s*Bundle\s+savedInstanceState\s*\)/.test(content)) {
    content = content.replace(
      /(public\s+void\s+onCreate\s*\(\s*Bundle\s+savedInstanceState\s*\)\s*\{)/,
      `$1\n        registerPlugin(IconSwitcherPlugin.class);`
    );
  } else {
    content = content.replace(
      /(public\s+class\s+MainActivity\s+extends\s+BridgeActivity\s*\{)/,
      `$1\n    @Override\n    public void onCreate(Bundle savedInstanceState) {\n        registerPlugin(IconSwitcherPlugin.class);\n        super.onCreate(savedInstanceState);\n    }\n`
    );
  }

  fs.writeFileSync(mainActivityPath, content, 'utf8');
  log('IconSwitcherPlugin regisztrálva a MainActivity-ben.');
}

function patchManifest() {
  const manifestPath = path.join(ROOT, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  if (!fs.existsSync(manifestPath)) throw new Error('AndroidManifest.xml nem található!');

  let xml = fs.readFileSync(manifestPath, 'utf8');

  if (xml.includes('android:name=".IconAmber"')) {
    log('Az activity-alias elemek már léteznek, kihagyva.');
    return;
  }

  const mainActivityRegex = /(<activity\b[^>]*android:name="\.MainActivity"[\s\S]*?>)([\s\S]*?)(<\/activity>)/;
  const match = xml.match(mainActivityRegex);

  if (!match) {
    log('FIGYELEM: nem található a MainActivity <activity> blokk, kihagyva a manifest patch.');
    return;
  }

  const [, openTag, innerContent, closeTag] = match;

  const launcherFilterRegex = /\s*<intent-filter>\s*<action android:name="android\.intent\.action\.MAIN"\s*\/>\s*<category android:name="android\.intent\.category\.LAUNCHER"\s*\/>\s*<\/intent-filter>/;
  const newInnerContent = innerContent.replace(launcherFilterRegex, '');

  const aliasBlocks = THEMES.map((theme, i) => `
        <activity-alias
            android:name=".Icon${capitalize(theme)}"
            android:enabled="${i === 0 ? 'true' : 'false'}"
            android:icon="@mipmap/ic_launcher_${theme}"
            android:roundIcon="@mipmap/ic_launcher_${theme}_round"
            android:targetActivity=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity-alias>`).join('\n');

  const replacement = `${openTag}${newInnerContent}${closeTag}\n${aliasBlocks}`;
  xml = xml.replace(mainActivityRegex, replacement.replace(/\$/g, '$$$$'));

  fs.writeFileSync(manifestPath, xml, 'utf8');
  log('AndroidManifest.xml sikeresen frissítve az 5 ikon-alias elemmel (alapból "amber" aktív).');
}

function main() {
  log('IconSwitcher natív plugin telepítése...');

  if (!fs.existsSync(path.join(ROOT, 'android'))) {
    log('Az "android" mappa nem létezik, kihagyva.');
    process.exit(0);
  }

  try {
    const appId = getAppId();
    log(`App ID: ${appId}`);

    copyPlugin(appId);
    registerPluginInMainActivity(appId);
    patchManifest();

    log('✅ IconSwitcher plugin sikeresen telepítve!');
  } catch (err) {
    console.error(`❌ Hiba: ${err.message}`);
    process.exit(1);
  }
}

main();
