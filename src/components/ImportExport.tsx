import React, { useState, useRef } from 'react';
import { Download, Upload, FileJson, CheckCircle, AlertCircle, Copy, Share2 } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { useTheme } from '../context/ThemeContext';

type NativeCapacitor = {
  isNativePlatform?: () => boolean;
  Plugins?: {
    Filesystem?: {
      mkdir: (options: { directory: 'CACHE'; path: string; recursive?: boolean }) => Promise<void>;
      writeFile: (options: {
        directory: 'CACHE';
        path: string;
        data: string;
        encoding?: 'UTF8';
      }) => Promise<{ uri?: string }>;
      getUri: (options: { directory: 'CACHE'; path: string }) => Promise<{ uri: string }>;
    };
    Share?: {
      share: (options: {
        title?: string;
        text?: string;
        files?: string[];
        dialogTitle?: string;
      }) => Promise<void>;
    };
  };
};

function getNativeCapacitor() {
  return (window as Window & { Capacitor?: NativeCapacitor }).Capacitor;
}

export function ImportExport() {
  const { poems, cycles, oneShots, books, exportData, importData } = useStorage();
  const { importThemes } = useTheme();
  const [importText, setImportText] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingImport, setPendingImport] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getExportFileName = () => {
    const timestamp = Date.now();
    return `versek-ciklusok-${timestamp}.json`;
  };
  const getExportPath = () => {
    const timestamp = Date.now();
    return `poetry-exports/versek-ciklusok-${timestamp}.json`;
  };

  const downloadFallback = (data: string) => {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getExportFileName();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tryNativeShare = async (data: string) => {
    const capacitor = getNativeCapacitor();
    const filesystem = capacitor?.Plugins?.Filesystem;
    const share = capacitor?.Plugins?.Share;

    if (!capacitor?.isNativePlatform?.() || !filesystem || !share) return false;

    // Try to create directory, but don't fail if it already exists
    try {
      await filesystem.mkdir({
        directory: 'CACHE',
        path: 'poetry-exports',
        recursive: true,
      });
    } catch {
      // Directory already exists, that's fine
    }

    const path = getExportPath();
    const writeResult = await filesystem.writeFile({
      directory: 'CACHE',
      path,
      data,
      encoding: 'UTF8',
    });

    const uri = writeResult.uri || (await filesystem.getUri({
      directory: 'CACHE',
      path,
    })).uri;

    await share.share({
      title: 'ShadowArts export',
      text: 'Versek és ciklusok JSON exportja',
      files: [uri],
      dialogTitle: 'Válassz mentési vagy megosztási helyet',
    });

    return true;
  };

  const tryNativeSavePicker = async (data: string) => {
    const filePicker = (window as Window & {
      showSaveFilePicker?: (options: {
        suggestedName: string;
        types: Array<{
          description: string;
          accept: Record<string, string[]>;
        }>;
      }) => Promise<{ createWritable: () => Promise<{ write: (content: Blob | string) => Promise<void>; close: () => Promise<void> }> }>;
    }).showSaveFilePicker;

    if (!filePicker) return false;

    const handle = await filePicker({
      suggestedName: getExportFileName(),
      types: [
        {
          description: 'JSON fájl',
          accept: { 'application/json': ['.json'] },
        },
      ],
    });

    const writable = await handle.createWritable();
    await writable.write(new Blob([data], { type: 'application/json' }));
    await writable.close();
    return true;
  };

  const tryShareSheet = async (data: string) => {
    const file = new File([data], getExportFileName(), { type: 'application/json' });
    const canShareFiles = typeof navigator.canShare === 'function'
      ? navigator.canShare({ files: [file] })
      : true;

    if (!navigator.share || !canShareFiles) return false;

    await navigator.share({
      title: 'ShadowArts export',
      text: 'Versek és ciklusok JSON exportja',
      files: [file],
    });
    return true;
  };

  const handleExport = async (mode: 'save' | 'share') => {
    const data = exportData();

    try {
      const capacitor = getNativeCapacitor();
      if (capacitor?.isNativePlatform?.()) {
        const shared = await tryNativeShare(data);
        if (shared) {
          setMessage({
            type: 'success',
            text: 'Az Android rendszer megosztási ablaka nyílt meg. Ott választhatsz mentési célhelyet is.',
          });
          setTimeout(() => setMessage(null), 3500);
          return;
        }
      }

      if (mode === 'save') {
        const saved = await tryNativeSavePicker(data);
        if (saved) {
          setMessage({ type: 'success', text: 'Az export fájl a kiválasztott helyre lett mentve.' });
          setTimeout(() => setMessage(null), 3000);
          return;
        }

        const shared = await tryShareSheet(data);
        if (shared) {
          setMessage({ type: 'success', text: 'A rendszer megosztási ablaka nyílt meg. Ott választhatsz mentési helyet is.' });
          setTimeout(() => setMessage(null), 3000);
          return;
        }

        downloadFallback(data);
        setMessage({ type: 'success', text: 'Az eszköz letöltötte a JSON fájlt.' });
        setTimeout(() => setMessage(null), 3000);
        return;
      }

      const saved = await tryNativeSavePicker(data);
      if (saved) {
        setMessage({ type: 'success', text: 'Az export fájl mentése sikeres.' });
        setTimeout(() => setMessage(null), 3000);
        return;
      }

      const shared = await tryShareSheet(data);
      if (shared) {
        setMessage({ type: 'success', text: 'A fájl megosztási panelre került.' });
        setTimeout(() => setMessage(null), 3000);
        return;
      }

      downloadFallback(data);
      setMessage({ type: 'success', text: 'Az eszköz letöltötte a JSON fájlt.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return;
      }

      setMessage({ type: 'error', text: 'Hiba az exportálás során: ' + (err as Error).message });
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleCopyToClipboard = () => {
    const data = exportData();
    navigator.clipboard.writeText(data);
    setMessage({ type: 'success', text: 'Vágólapra másolva!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleImportClick = () => {
    if (!importText.trim()) {
      setMessage({ type: 'error', text: 'Kérlek adj meg importálandó adatokat!' });
      return;
    }
    setPendingImport(importText);
    setShowConfirmModal(true);
  };

  const confirmImport = () => {
    try {
      importData(pendingImport);
      setImportText('');
      setPendingImport('');
      setShowConfirmModal(false);
      setMessage({ type: 'success', text: 'Adatok sikeresen importálva! Az azonos adatok ID-ja módosult, de minden tartalom megmaradt.' });
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Hiba az importálás során: ' + (err as Error).message });
      setShowConfirmModal(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const parsed = JSON.parse(content);
        // Auto-detect theme file
        if (parsed.__shadowarts_themes__) {
          importThemes(content);
          setMessage({ type: 'success', text: 'Témák sikeresen importálva!' });
          setTimeout(() => setMessage(null), 3000);
        } else {
          setImportText(content);
          setMessage({ type: 'success', text: 'Fájl beolvasva! Kattints az Importálás gombra a folytatáshoz.' });
        }
      } catch {
        setMessage({ type: 'error', text: 'Érvénytelen JSON fájl!' });
      }
    };
    reader.onerror = () => {
      setMessage({ type: 'error', text: 'Hiba a fájl beolvasása során!' });
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const stats = [
    { label: 'Vers',     total: poems.length,    done: poems.filter(p => p.status === 'finished').length,    icon: '✍️' },
    { label: 'Ciklus',   total: cycles.length,   done: cycles.filter(c => c.status === 'finished').length,   icon: '📂' },
    { label: 'One-shot', total: oneShots.length,  done: oneShots.filter(o => o.status === 'finished').length, icon: '📝' },
    { label: 'Könyv',    total: books.length,     done: books.filter(b => b.status === 'finished').length,    icon: '📖' },
  ];

  const totalChapters = books.reduce((sum, b) => sum + b.chapters.length, 0);
  const doneChapters  = books.reduce((sum, b) => sum + b.chapters.filter(c => c.status === 'finished').length, 0);

  // ── helper: themed button styles ─────────────────────────────────────────
  const btnPrimary: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 16px', borderRadius: '8px',
    backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-text)',
    fontSize: '14px', cursor: 'pointer', border: 'none',
  };
  const btnSecondary: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 16px', borderRadius: '8px',
    backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)',
    fontSize: '14px', cursor: 'pointer',
    border: '1px solid var(--color-surface-border)',
  };
  const card: React.CSSProperties = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-surface-border)',
    borderRadius: '12px', padding: '24px',
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
        <FileJson className="w-6 h-6" />
        Import / Export
      </h2>

      {/* Stats — collapsible */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)' }}>
        <button
          onClick={() => setShowStats(s => !s)}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>📊 Statisztika</span>
          <span className="text-lg" style={{ color: 'var(--color-text-muted)' }}>{showStats ? '▲' : '▼'}</span>
        </button>
        {showStats && (
          <div className="px-5 pb-5 grid grid-cols-2 gap-3 border-t" style={{ borderColor: 'var(--color-surface-border)' }}>
            {stats.map(s => (
              <div key={s.label} className="rounded-lg p-3 border"
                style={{ backgroundColor: 'var(--color-bg-from)', borderColor: 'var(--color-surface-border)' }}>
                <div className="text-xl mb-0.5">{s.icon}</div>
                <div className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{s.total}</div>
                <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{s.label}</div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{s.done} kész</div>
              </div>
            ))}
            {books.length > 0 && (
              <div className="col-span-2 rounded-lg p-3 border"
                style={{ backgroundColor: 'var(--color-bg-from)', borderColor: 'var(--color-surface-border)' }}>
                <div className="text-xl mb-0.5">📑</div>
                <div className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{totalChapters}</div>
                <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Fejezet összesen</div>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{doneChapters} kész</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className="flex items-center gap-2 p-4 rounded-lg" style={
          message.type === 'success'
            ? { backgroundColor: 'var(--color-done-bg)', border: '1px solid var(--color-done)', color: 'var(--color-done-text)' }
            : { backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }
        }>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Export Section */}
      <div style={card}>
        <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <Download className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          Exportálás
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Mentsd el adataidat JSON formátumban. Androidon a rendszer megosztási ablaka nyílik meg,
          ahol kiválaszthatod, hová mentsd vagy melyik alkalmazásba küldd.
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => handleExport('save')} style={btnPrimary}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}>
            <Download className="w-4 h-4" /> Mentés hely kiválasztásával
          </button>
          <button onClick={() => handleExport('share')} style={btnSecondary}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface-border)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface)')}>
            <Share2 className="w-4 h-4" /> Megosztás
          </button>
          <button onClick={handleCopyToClipboard} style={btnSecondary}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface-border)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface)')}>
            <Copy className="w-4 h-4" /> Vágólapra
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div style={card}>
        <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <Upload className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          Importálás
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Tölts be korábban exportált adatokat vagy téma fájlt. Ha már léteznek azonos adatok,
          új ID-k lesznek hozzájuk rendelve, de minden tartalom megmarad.
        </p>

        {/* File upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            JSON fájl feltöltése
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="w-full px-4 py-2 rounded-lg border text-sm"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-surface-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        {/* Divider */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: 'var(--color-surface-border)' }} />
          </div>
          <div className="relative flex justify-center">
            <span className="px-2 text-sm" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>
              vagy
            </span>
          </div>
        </div>

        {/* Text paste */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            JSON szöveg beillesztése
          </label>
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder="Illeszd be ide a JSON adatokat..."
            rows={6}
            className="w-full px-4 py-2 rounded-lg border font-mono text-xs focus:outline-none"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-surface-border)',
              color: 'var(--color-text-primary)',
            }}
            onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-accent)'; e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
            onBlur={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--color-surface-border)'; }}
          />
        </div>

        <button
          onClick={handleImportClick}
          disabled={!importText.trim()}
          style={{ ...btnPrimary, opacity: importText.trim() ? 1 : 0.5, cursor: importText.trim() ? 'pointer' : 'not-allowed' }}
          onMouseEnter={e => { if (importText.trim()) e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'; }}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
        >
          <Upload className="w-4 h-4" /> Importálás
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="rounded-xl p-6 max-w-md w-full" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)' }}>
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <AlertCircle className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
              Importálás megerősítése
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Biztosan importálni szeretnéd az adatokat? A meglévő adatok nem törlődnek,
              de az importált elemek új ID-kat kapnak, ha az eredeti ID-k már léteznek.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)} style={btnSecondary}
                className="flex-1 justify-center"
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface-border)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface)')}>
                Mégse
              </button>
              <button onClick={confirmImport} style={btnPrimary}
                className="flex-1 justify-center"
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}>
                Importálás
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
