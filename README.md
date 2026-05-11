# ShadowArts - Versírás és Ciklus Készítő

Egy webalapú alkalmazás versek és versciklusok készítésére, kezelésére, exportálására és importálására.

## Funkciók

### Versek kezelése
- **Cím, tartalom és dátum** (év, hónap, nap) megadása
- **Figyelmeztetés**, ha már létezik azonos című vers
- **Állapot kezelése**: Kész / Nincs kész
- Keresés cím és tartalom alapján
- Szűrés állapot alapján

### Ciklusok kezelése
- **Cím és gondolat** (pár soros leírás) megadása
- **Versek hozzárendelése** a ciklushoz
- **Dátum** megadása (év, hónap, nap)
- **Állapot kezelése**: Kész / Nincs kész
- Keresés cím és gondolat alapján

### Adatkezelés
- **Exportálás**: JSON fájl letöltése vagy vágólapra másolás
- **Importálás**: JSON fájl feltöltése vagy szöveg beillesztése
- **Intelligens importálás**: Ha léteznek azonos adatok, új ID-k lesznek hozzájuk rendelve, de minden tartalom megmarad
- **localStorage tárolás**: Az adatok automatikusan mentődnek a böngészőben

## APK Konvertálás Android 15-re

Az alkalmazás most már Capacitor alapra van előkészítve, és Androidon natív megosztási mentést használ az exporthoz. A tényleges APK elkészítéséhez a saját gépeden kell létrehozni az Android projektet.

### 1. Előkészületek

Telepítsd a szükséges eszközöket:

```bash
# Node.js: https://nodejs.org/
# Android Studio: https://developer.android.com/studio
# - Android SDK
# - Android SDK Build-Tools
# - Android Platform-Tools
```

### 2. Capacitor Android projekt létrehozása

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

### 3. APK build Android Studio-ból

Az Android Studio-ban nyisd meg a projektet, majd:

1. Válaszd a `Build > Build Bundle(s) / APK(s) > Build APK(s)` menüt
2. Debug APK-hoz a generált fájl útvonala általában:
   `android/app/build/outputs/apk/debug/app-debug.apk`

### 4. Android 15 beállítás

A `capacitor.config.ts` és a Capacitor Android projekt úgy van előkészítve, hogy Android 15-höz is illeszkedjen. A végső SDK verziókat az Android Studio projektben ellenőrizd.

### 5. Export viselkedés Androidon

Androidon az export gomb a natív megosztási párbeszédablakot használja. Itt a felhasználó kiválaszthatja, hogy:

1. Fájlkezelőbe mentse
2. Drive-ra küldje
3. Másik appon keresztül kezelje a JSON fájlt

Ez jelenleg a legbiztosabb natív, felhasználó-vezérelt megoldás Android 15 alatt.

## Fejlesztés

```bash
# Függőségek telepítése
npm install

# Fejlesztői szerver indítása
npm run dev

# Build készítése
npm run build
```

## Projekt struktúra

```
src/
├── components/        # UI komponensek
│   ├── CycleForm.tsx
│   ├── CycleList.tsx
│   ├── ImportExport.tsx
│   ├── Layout.tsx
│   ├── PoemForm.tsx
│   └── PoemList.tsx
├── context/
│   └── StorageContext.tsx  # Adattárolás kezelése
├── types/
│   └── index.ts      # TypeScript típusok
├── App.tsx           # Fő alkalmazás komponens
└── main.tsx          # Belépési pont
```

## Technológiák

- **React 18** - UI keretrendszer
- **TypeScript** - Tipizált JavaScript
- **Tailwind CSS** - Stílusok
- **Lucide React** - Ikonok
- **Vite** - Build eszköz
- **localStorage** - Adattárolás

## Licenc

MIT
