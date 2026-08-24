/**
 * Közös, platformfüggetlen fájl-exportáló segédfüggvény.
 * Ugyanazt a natív Android megosztás / mentés-választó láncot használja,
 * mint az alkalmazás adat-exportja (ImportExport.tsx), hogy a témák
 * exportálása Androidon is ténylegesen működjön (a sima <a download>
 * trükk natív WebView-ban nem mindig old meg semmit).
 */

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

interface ExportOptions {
  folder: string;   // pl. "poetry-exports" vagy "theme-exports"
  title: string;    // megosztási dialógus címe
  text: string;     // megosztási dialógus leírása
}

export interface ExportResult {
  success: boolean;
  message: string;
}

async function tryNativeShare(filename: string, data: string, opts: ExportOptions): Promise<boolean> {
  const capacitor = getNativeCapacitor();
  const filesystem = capacitor?.Plugins?.Filesystem;
  const share = capacitor?.Plugins?.Share;

  if (!capacitor?.isNativePlatform?.() || !filesystem || !share) return false;

  try {
    await filesystem.mkdir({ directory: 'CACHE', path: opts.folder, recursive: true });
  } catch {
    // A mappa már létezik, nem probléma
  }

  const path = `${opts.folder}/${filename}`;
  const writeResult = await filesystem.writeFile({
    directory: 'CACHE',
    path,
    data,
    encoding: 'UTF8',
  });

  const uri = writeResult.uri || (await filesystem.getUri({ directory: 'CACHE', path })).uri;

  await share.share({
    title: opts.title,
    text: opts.text,
    files: [uri],
    dialogTitle: 'Válassz mentési vagy megosztási helyet',
  });

  return true;
}

async function tryNativeSavePicker(filename: string, data: string): Promise<boolean> {
  const filePicker = (window as Window & {
    showSaveFilePicker?: (options: {
      suggestedName: string;
      types: Array<{ description: string; accept: Record<string, string[]> }>;
    }) => Promise<{ createWritable: () => Promise<{ write: (content: Blob | string) => Promise<void>; close: () => Promise<void> }> }>;
  }).showSaveFilePicker;

  if (!filePicker) return false;

  const handle = await filePicker({
    suggestedName: filename,
    types: [{ description: 'JSON fájl', accept: { 'application/json': ['.json'] } }],
  });

  const writable = await handle.createWritable();
  await writable.write(new Blob([data], { type: 'application/json' }));
  await writable.close();
  return true;
}

async function tryShareSheet(filename: string, data: string, opts: ExportOptions): Promise<boolean> {
  const file = new File([data], filename, { type: 'application/json' });
  const canShareFiles = typeof navigator.canShare === 'function'
    ? navigator.canShare({ files: [file] })
    : true;

  if (!navigator.share || !canShareFiles) return false;

  await navigator.share({ title: opts.title, text: opts.text, files: [file] });
  return true;
}

function downloadFallback(filename: string, data: string) {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * JSON adat exportálása. Sorrend: natív Android megosztás → File System Access
 * API (asztali böngésző) → Web Share API (mobil böngésző) → sima letöltés.
 */
export async function exportJsonFile(filename: string, data: string, opts: ExportOptions): Promise<ExportResult> {
  try {
    const capacitor = getNativeCapacitor();
    if (capacitor?.isNativePlatform?.()) {
      const shared = await tryNativeShare(filename, data, opts);
      if (shared) {
        return { success: true, message: 'Az Android rendszer megosztási ablaka nyílt meg. Ott választhatsz mentési célhelyet is.' };
      }
    }

    const saved = await tryNativeSavePicker(filename, data);
    if (saved) {
      return { success: true, message: 'A fájl a kiválasztott helyre lett mentve.' };
    }

    const shared = await tryShareSheet(filename, data, opts);
    if (shared) {
      return { success: true, message: 'A rendszer megosztási ablaka nyílt meg. Ott választhatsz mentési helyet is.' };
    }

    downloadFallback(filename, data);
    return { success: true, message: 'Az eszköz letöltötte a fájlt.' };
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      return { success: false, message: '' };
    }
    return { success: false, message: 'Hiba az exportálás során: ' + (err as Error).message };
  }
}
