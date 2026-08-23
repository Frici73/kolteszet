import { useState } from 'react';
import { X, RotateCcw, Download, Upload, Check } from 'lucide-react';
import { useTheme, DEFAULT_CUSTOM, CUSTOM_SLOT_IDS, ICON_THEME_IDS } from '../context/ThemeContext';
import type { ThemeColors, CustomSlotId, IconThemeId } from '../context/ThemeContext';
import { ICON_RECOLOR_FILTER } from '../utils/iconRecolor';
// A valódi launcher-ikon mester képe (ebből jönnek létre az összes téma variánsa
// színforgatással a natív build során - lásd scripts/generate-theme-icons.cjs).
// Vite ezt base64-be ágyazza a build során, így offline is működik.
import masterIconSrc from '../../native/icons/icon-amber.png';

interface SettingsProps { onClose: () => void; }

const ICON_PREVIEW_LABEL: Record<IconThemeId, string> = {
  amber:  '🟤 Borostyán',
  slate:  '🔵 Palaszürke',
  forest: '🌿 Erdő',
  rose:   '🌹 Rózsa',
  night:  '🌙 Éjszaka',
};

/** A valódi generált ikon kicsinyített előnézete, a témának megfelelő színforgatással. */
function IconPreviewImg({ iconId, size = 36 }: { iconId: IconThemeId; size?: number }) {
  return (
    <img
      src={masterIconSrc}
      alt={ICON_PREVIEW_LABEL[iconId]}
      width={size}
      height={size}
      className="rounded-lg object-cover"
      style={{
        filter: ICON_RECOLOR_FILTER[iconId],
        border: '1px solid rgba(0,0,0,0.08)',
      }}
    />
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm flex-1" style={{ color: 'var(--color-text-secondary)' }}>{label}</label>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded border-2 overflow-hidden" style={{ borderColor: 'var(--color-surface-border)' }}>
          <input type="color" value={value} onChange={e => onChange(e.target.value)}
            className="w-10 h-10 -ml-1 -mt-1 cursor-pointer border-0 p-0" />
        </div>
        <span className="text-xs font-mono w-16" style={{ color: 'var(--color-text-muted)' }}>{value}</span>
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
  const { customSlots, setCustomSlot, customSlotIcons, setCustomSlotIcon, cloneBuiltInToSlot, allThemes } = useTheme();
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

  const builtInThemes = allThemes.filter(t => ICON_THEME_IDS.includes(t.id as IconThemeId));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="text-sm flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
          ← Vissza
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
          Válaszd ki, melyik beépített téma ikonját használja ez az egyéni téma a telefon kezdőképernyőjén.
        </p>
        <div className="grid grid-cols-5 gap-2">
          {ICON_THEME_IDS.map(iconId => {
            const active = currentIcon === iconId;
            return (
              <button key={iconId} type="button"
                onClick={() => setCustomSlotIcon(slot, iconId)}
                title={ICON_PREVIEW_LABEL[iconId]}
                className="flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all"
                style={{ borderColor: active ? 'var(--color-accent)' : 'var(--color-surface-border)' }}>
                <div className="relative">
                  <IconPreviewImg iconId={iconId} />
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
  const { theme, setThemeById, allThemes, exportThemes, importThemes } = useTheme();
  const [editingSlot, setEditingSlot] = useState<CustomSlotId | null>(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  const handleExportThemes = () => {
    const data = exportThemes();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shadowarts-themes-${Date.now()}.json`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
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
          <button onClick={onClose} className="p-2 rounded-lg hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>
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
                Válassz egy témát. Beépített témáknál az alkalmazás ikonja automatikusan a témához igazodik
                (Androidon). Egyéni témáknál a "🖌️ Szerkesztés" gombnál választhatod ki az ikont.
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
                      <button onClick={() => setThemeById(t.id)}
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
          <button onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-text)' }}>
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
}
