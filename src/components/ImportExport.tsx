import { useState, useRef } from 'react';
import { Download, Upload, FileJson, CheckCircle, AlertCircle, Copy, Share2 } from 'lucide-react';
import { useStorage } from '../context/StorageContext';

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
  const { poems, cycles, exportData, importData } = useStorage();
  const [importText, setImportText] = useState('');
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
      setImportText(content);
      setMessage({ type: 'success', text: 'Fájl beolvasva! Kattints az Importálás gombra a folytatáshoz.' });
    };
    reader.onerror = () => {
      setMessage({ type: 'error', text: 'Hiba a fájl beolvasása során!' });
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const stats = {
    poems: poems.length,
    cycles: cycles.length,
    finishedPoems: poems.filter(p => p.status === 'finished').length,
    finishedCycles: cycles.filter(c => c.status === 'finished').length,
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
        <FileJson className="w-6 h-6" />
        Import / Export
      </h2>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-amber-100">
          <div className="text-2xl font-bold text-amber-900">{stats.poems}</div>
          <div className="text-sm text-amber-600">Vers</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-amber-100">
          <div className="text-2xl font-bold text-green-600">{stats.finishedPoems}</div>
          <div className="text-sm text-amber-600">Kész vers</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-amber-100">
          <div className="text-2xl font-bold text-amber-900">{stats.cycles}</div>
          <div className="text-sm text-amber-600">Ciklus</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-amber-100">
          <div className="text-2xl font-bold text-green-600">{stats.finishedCycles}</div>
          <div className="text-sm text-amber-600">Kész ciklus</div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Export Section */}
      <div className="bg-white rounded-xl p-6 border border-amber-100">
        <h3 className="font-semibold text-amber-900 mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Exportálás
        </h3>
        <p className="text-amber-600 text-sm mb-4">
          Mentse el verseit és ciklusait JSON formátumban. Az adatok biztonsági mentésére szolgál, 
          vagy más eszközre való átvitelhez. Androidon a rendszer megosztási ablaka nyílik meg, 
          így a felhasználó választhatja ki, hová mentse vagy melyik alkalmazásba küldje.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExport('save')}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Mentés hely kiválasztásával
          </button>
          <button
            onClick={() => handleExport('share')}
            className="flex items-center gap-2 px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Megosztás / másik appba küldés
          </button>
          <button
            onClick={handleCopyToClipboard}
            className="flex items-center gap-2 px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Vágólapra másolás
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-xl p-6 border border-amber-100">
        <h3 className="font-semibold text-amber-900 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Importálás
        </h3>
        <p className="text-amber-600 text-sm mb-4">
            Töltsön be korábban exportált adatokat. Ha már léteznek azonos adatok, 
            új ID-k lesznek hozzájuk rendelve, de minden tartalom megmarad.
        </p>
        
        {/* File Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-amber-700 mb-2">
            JSON fájl feltöltése
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200"
          />
        </div>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-amber-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-2 bg-white text-amber-500 text-sm">vagy</span>
          </div>
        </div>

        {/* Text Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-amber-700 mb-2">
            JSON szöveg beillesztése
          </label>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Illeszd be ide a JSON adatokat..."
            rows={6}
            className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-xs"
          />
        </div>

        <button
          onClick={handleImportClick}
          disabled={!importText.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4" />
          Importálás
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="font-semibold text-amber-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Importálás megerősítése
            </h3>
            <p className="text-amber-600 text-sm mb-6">
              Biztosan importálni szeretnéd az adatokat? A meglévő adatok nem törlődnek, 
              de az importált elemek új ID-kat kapnak, ha az eredeti ID-k már léteznek.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
              >
                Mégse
              </button>
              <button
                onClick={confirmImport}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Importálás
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
