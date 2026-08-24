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

/** CSS filter string legenerálása egy IconTune objektumból (webes előnézethez). */
export function iconTuneToCssFilter(tune: IconTune): string {
  return `hue-rotate(${tune.hue}deg) saturate(${tune.saturation}) brightness(${tune.brightness})`;
}
