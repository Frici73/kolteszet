import { useState, useEffect } from 'react';
import { X, RotateCcw, Download, Upload, Check } from 'lucide-react';
import { useTheme, DEFAULT_CUSTOM, CUSTOM_SLOT_IDS, ICON_THEME_IDS } from '../context/ThemeContext';
import type { ThemeColors, CustomSlotId, IconThemeId } from '../context/ThemeContext';
import { ICON_TUNE_PRESETS, iconTuneToCssFilter } from '../utils/iconRecolor';
import type { IconTune } from '../utils/iconRecolor';
import { exportJsonFile } from '../utils/nativeExport';
// A felhasználó saját, egyedi tervezésű launcher-ikonja - ebből jönnek létre
// az összes téma variánsa színforgatással a natív build során
// (lásd scripts/generate-theme-icons.cjs). Vite base64-be ágyazza build közben.
import masterIconSrc from '../../native/icons/icon-amber.png';

interface SettingsProps { onClose: () => void; }

const ICON_PREVIEW_LABEL: Record<IconThemeId, string> = {
  amber:  '🟤 Borostyán',
  slate:  '🔵 Palaszürke',
  forest: '🌿 Erdő',
  rose:   '🌹 Rózsa',
  night:  '🌙 Éjszaka',
};

/** A felhasználó saját ikonjának kicsinyített előnézete, hue/saturation/brightness
 *  filterrel színezve - pontosan azt tükrözi, amit a natív build is előállít. */
function IconPreviewImg({ tune, size = 36, label }: { tune: IconTune; size?: number; label?: string }) {
  return (
    <img
      src={masterIconSrc}
      alt={label ?? 'ikon előnézet'}
      width={size}
      height={size}
      className="rounded-lg object-cover flex-shrink-0"
      style={{ filter: iconTuneToCssFilter(tune), border: '1px solid rgba(0,0,0,0.08)' }}
    />
  );
}

/** Hex validáció: #rgb, #rrggbb vagy #rrggbbaa formátum. */
function isValidHex(v: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v.trim());
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  const invalid = draft.trim() !== '' && !isValidHex(draft);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => {
    const v = draft.trim();
    if (isValidHex(v)) onChange(v);
    else setDraft(value); // érvénytelen -> visszaáll az utolsó jó értékre
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm flex-1" style={{ color: 'var(--color-text-secondary)' }}>{label}</label>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded border-2 overflow-hidden flex-shrink-0" style={{ borderColor: 'var(--color-surface-border)' }}>
          <input type="color" value={isValidHex(value) ? value.slice(0, 7) : '#000000'} onChange={e => onChange(e.target.value)}
            className="w-10 h-10 -ml-1 -mt-1 cursor-pointer border-0 p-0" />
        </div>
        {/* Szerkeszthető hex textbox - hasznosabb, mint az Android natív, esetlen színválasztója */}
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          spellCheck={false}
          className="text-xs font-mono w-20 px-1.5 py-1 rounded border text-center"
          style={{
            color: 'var(--color-text-primary)',
            backgroundColor: 'var(--color-surface)',
            borderColor: invalid ? '#ef4444' : 'var(--color-surface-border)',
          }}
        />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{title}</p>
      <div className="p-3 rounded-xl border space-y-2" style={{ borderColor: 'var(--color-surface-border)' }}>
        {children}
      </div>
    </div>
  );
}

function CustomEditor({ slot, onClose }: { slot: CustomSlotId; onClose: () => void }) {
  const {
    customSlots, setCustomSlot, customSlotIcons, setCustomSlotIcon,
    cloneBuiltInToSlot, allThemes, confirmTheme,
  } = useTheme();
  const [draft, setDraft] = useState<ThemeColors>({ ...customSlots[slot] });
  const currentIcon = customSlotIcons[slot];

  const upd = (key: keyof ThemeColors, val: string) => {
    const next = { ...draft, [key]: val };
    setDraft(next);
    setCustomSlot(slot, next);
  };

  const handleClone = (builtInId: string) => {
    cloneBuiltInToSlot(slot, builtInId);
    const builtIn = allThemes.find(t => t.id === builtInId);
    if (builtIn) setDraft({ ...builtIn.colors });
  };

  // Bezáráskor ("Vissza") véglegesítjük a témát: ekkor (és csak ekkor) vált
  // ténylegesen ikont az Android launcher-en, nem minden egyes szín/ikon
  // próbálgatásnál - így szerkesztés közben nem "dob ki" az alkalmazásból.
  const handleDone = () => {
    confirmTheme(slot);
    onClose();
  };

  const builtInThemes = allThemes.filter(t => ICON_THEME_IDS.includes(t.id as IconThemeId));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={handleDone} className="text-sm flex items-center gap-1 font-medium" style={{ color: 'var(--color-accent)' }}>
          ← Vissza (mentés + ikon alkalmazása)
        </button>
        <button onClick={() => { const d = { ...DEFAULT_CUSTOM }; setDraft(d); setCustomSlot(slot, d); }}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
          style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface-border)' }}>
          <RotateCcw className="w-3 h-3" /> Visszaállítás
        </button>
      </div>

      <Section title="📋 Klónozás beépített témából">
        <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
          Válassz egy beépített témát kiindulási alapnak, majd szabadon szerkeszd tovább.
        </p>
        <div className="flex flex-wrap gap-2">
          {builtInThemes.map(t => (
            <button key={t.id} type="button" onClick={() => handleClone(t.id)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors"
              style={{ borderColor: 'var(--color-surface-border)', backgroundColor: t.colors.surface, color: t.colors.textPrimary }}>
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.colors.accent }} />
              {t.name.replace(/^[^\s]+\s/, '')}
            </button>
          ))}
        </div>
      </Section>

      <Section title="📱 Alkalmazás ikon (Android)">
        <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
          Az Android launcher ikonja technikai okokból csak ennek az 5 előre elkészített
          változatnak egyike lehet - válassz egyet kiindulási alapnak. Az ikon csak akkor
          vált ténylegesen, ha a "← Vissza" gombbal megerősíted a témát.
        </p>
        <div className="grid grid-cols-5 gap-2">
          {ICON_THEME_IDS.map(iconId => {
            const active = currentIcon === iconId;
            const presetTune = ICON_TUNE_PRESETS[iconId];
            return (
              <button key={iconId} type="button"
                onClick={() => setCustomSlotIcon(slot, iconId)}
                title={ICON_PREVIEW_LABEL[iconId]}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all"
                style={{ borderColor: active ? 'var(--color-accent)' : 'var(--color-surface-border)' }}>
                <div className="relative">
                  <IconPreviewImg tune={presetTune} label={ICON_PREVIEW_LABEL[iconId]} />
                  {active && (
                    <div className="absolute -top-1 -right-1 rounded-full p-0.5" style={{ backgroundColor: 'var(--color-accent)' }}>
                      <Check className="w-2.5 h-2.5" style={{ color: 'var(--color-accent-text)' }} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Háttér">
        <ColorField label="Háttér (bal)" value={draft.bgGradientFrom} onChange={v => upd('bgGradientFrom', v)} />
        <ColorField label="Háttér (jobb)" value={draft.bgGradientTo} onChange={v => upd('bgGradientTo', v)} />
        <ColorField label="Kártya felület" value={draft.surface} onChange={v => upd('surface', v)} />
        <ColorField label="Kártya keret" value={draft.surfaceBorder} onChange={v => upd('surfaceBorder', v)} />
      </Section>

      <Section title="Szöveg">
        <ColorField label="Fő szöveg (cím)" value={draft.textPrimary} onChange={v => upd('textPrimary', v)} />
        <ColorField label="Másodlagos szöveg" value={draft.textSecondary} onChange={v => upd('textSecondary', v)} />
        <ColorField label="Halvány szöveg (dátum)" value={draft.textMuted} onChange={v => upd('textMuted', v)} />
      </Section>

      <Section title="Hangsúly szín (gombok, aktív nav)">
        <ColorField label="Hangsúly szín" value={draft.accent} onChange={v => upd('accent', v)} />
        <ColorField label="Hangsúly (hover)" value={draft.accentHover} onChange={v => upd('accentHover', v)} />
      </Section>

      <Section title="Kész jelölés ✅">
        <ColorField label="Pipa / ikon szín" value={draft.done} onChange={v => upd('done', v)} />
        <ColorField label="Kész badge háttér" value={draft.doneBg} onChange={v => upd('doneBg', v)} />
        <ColorField label="Kész badge szöveg" value={draft.doneText} onChange={v => upd('doneText', v)} />
      </Section>

      <Section title="Törlés (kuka) 🗑️">
        <ColorField label="Kuka ikon szín" value={draft.danger} onChange={v => upd('danger', v)} />
        <ColorField label="Kuka hover háttér" value={draft.dangerBg} onChange={v => upd('dangerBg', v)} />
      </Section>

      <Section title="Navigáció">
        <ColorField label="Aktív tab" value={draft.navActive} onChange={v => upd('navActive', v)} />
        <ColorField label="Inaktív tab" value={draft.navInactive} onChange={v => upd('navInactive', v)} />
        <ColorField label="Fejléc / nav háttér" value={draft.headerBg} onChange={v => upd('headerBg', v)} />
        <ColorField label="Fejléc keret" value={draft.headerBorder} onChange={v => upd('headerBorder', v)} />
      </Section>
    </div>
  );
}

export function Settings({ onClose }: SettingsProps) {
  const { theme, confirmTheme, allThemes, exportThemes, importThemes } = useTheme();
  const [editingSlot, setEditingSlot] = useState<CustomSlotId | null>(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  // Ha a felhasználó úgy zárja be a panelt, hogy közben egy egyéni téma
  // szerkesztő nyitva van, előbb véglegesítsük azt (ikon alkalmazása),
  // mielőtt a modal teljesen bezáródna.
  const handleFullClose = () => {
    if (editingSlot) confirmTheme(editingSlot);
    onClose();
  };

  const [themeExportMessage, setThemeExportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExportThemes = async () => {
    const data = exportThemes();
    const filename = `shadowarts-themes-${Date.now()}.json`;
    const result = await exportJsonFile(filename, data, {
      folder: 'theme-exports',
      title: 'ShadowArts témák export',
      text: 'ShadowArts egyéni színtémák JSON exportja',
    });
    if (!result.message) return; // felhasználó megszakította
    setThemeExportMessage({ type: result.success ? 'success' : 'error', text: result.message });
    setTimeout(() => setThemeExportMessage(null), result.success ? 3500 : 4000);
  };

  const handleImportThemes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      importThemes(text);
      setImportSuccess('Témák sikeresen importálva!');
      setImportError('');
      setTimeout(() => setImportSuccess(''), 3000);
    } catch {
      setImportError('Érvénytelen téma fájl!');
      setImportSuccess('');
    }
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--color-surface)', maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--color-surface-border)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            ⚙️ Beállítások
          </h2>
          <button onClick={handleFullClose} className="p-2 rounded-lg hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {editingSlot ? (
            <CustomEditor slot={editingSlot} onClose={() => setEditingSlot(null)} />
          ) : (
            <>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Válassz egy témát - kattintásra azonnal alkalmazódik a szín és az ikon is (Androidon).
                Egyéni témáknál a "🖌️ Szerkesztés" gombnál állíthatod be a színeket (hex kóddal is)
                és választhatsz a beépített ikonok közül; az ikonváltás csak a szerkesztő
                bezárásakor (megerősítéskor) történik meg.
              </p>

              {/* Built-in themes */}
              <div className="space-y-2">
                {allThemes.map(t => {
                  const isCustomSlot = CUSTOM_SLOT_IDS.includes(t.id as CustomSlotId);
                  const isActive = theme.id === t.id;
                  return (
                    <div key={t.id}
                      className="rounded-xl border-2 transition-all overflow-hidden"
                      style={{
                        backgroundColor: t.colors.surface,
                        borderColor: isActive ? 'var(--color-accent)' : 'var(--color-surface-border)',
                      }}>
                      <button onClick={() => confirmTheme(t.id)}
                        className="w-full text-left px-4 py-3 flex items-center gap-3">
                        <div className="flex gap-1 flex-shrink-0">
                          {[t.colors.bgGradientFrom, t.colors.accent, t.colors.done].map((c, i) => (
                            <div key={i} className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: c, borderColor: 'rgba(0,0,0,0.1)' }} />
                          ))}
                        </div>
                        <span className="text-sm font-medium flex-1" style={{ color: t.colors.textPrimary }}>{t.name}</span>
                        {isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: t.colors.accent, color: t.colors.accentText }}>Aktív</span>
                        )}
                      </button>
                      {isCustomSlot && (
                        <div className="border-t px-4 py-2 flex justify-end"
                          style={{ borderColor: 'var(--color-surface-border)' }}>
                          <button onClick={() => setEditingSlot(t.id as CustomSlotId)}
                            className="text-xs px-3 py-1 rounded-lg transition-colors"
                            style={{ backgroundColor: 'var(--color-surface-border)', color: 'var(--color-text-secondary)' }}>
                            🖌️ Szerkesztés
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Theme Import / Export */}
              <div className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--color-surface-border)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
                  Témák import / export
                </p>
                {importError && <p className="text-xs text-red-500">{importError}</p>}
                {importSuccess && <p className="text-xs text-green-500">{importSuccess}</p>}
                {themeExportMessage && (
                  <p className="text-xs" style={{ color: themeExportMessage.type === 'success' ? 'var(--color-done-text)' : '#ef4444' }}>
                    {themeExportMessage.text}
                  </p>
                )}
                <div className="flex gap-2">
                  <button onClick={handleExportThemes}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-text)' }}>
                    <Download className="w-4 h-4" /> Exportálás
                  </button>
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer border"
                    style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}>
                    <Upload className="w-4 h-4" /> Importálás
                    <input type="file" accept=".json" onChange={handleImportThemes} className="hidden" />
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--color-surface-border)' }}>
          <button onClick={handleFullClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-text)' }}>
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
}
