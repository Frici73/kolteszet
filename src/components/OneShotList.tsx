import { useState, useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Edit2, Trash2, Calendar, CheckCircle2, Circle, Search } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { useSortConfig, applySort } from '../hooks/useSortConfig';
import { SortPanel } from './SortPanel';
import type { OneShot } from '../types';

interface OneShotListProps {
  onEdit: (id: string) => void;
}

function score(o: OneShot, term: string): number {
  if (!term) return 0;
  const t = term.toLowerCase();
  const title = o.title.toLowerCase();
  const content = o.content.toLowerCase();
  if (title === t) return 4;
  if (title.startsWith(t)) return 3;
  if (title.includes(t)) return 2;
  if (content.includes(t)) return 1;
  return -1;
}

export function OneShotList({ onEdit }: OneShotListProps) {
  const { oneShots, deleteOneShot, updateOneShot } = useStorage();
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const { criteria, move, toggleDir } = useSortConfig('oneshot-sort-config');
  const parentRef = useRef<HTMLDivElement>(null);

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    oneShots.forEach(o => o.genres.forEach(g => set.add(g)));
    return Array.from(set).sort();
  }, [oneShots]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim();
    let result = oneShots.filter(o => {
      if (genreFilter !== 'all' && !o.genres.includes(genreFilter as OneShot['genres'][number])) return false;
      if (!term) return true;
      return score(o, term) >= 1;
    });
    if (term) {
      result = result.sort((a, b) => {
        const diff = score(b, term) - score(a, term);
        if (diff !== 0) return diff;
        const sorted = applySort([a, b], criteria);
        return sorted[0] === a ? -1 : 1;
      });
    } else {
      result = applySort(result, criteria);
    }
    return result;
  }, [oneShots, searchTerm, genreFilter, criteria]);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    overscan: 8,
  });

  const toggleStatus = useCallback((o: OneShot) => {
    updateOneShot(o.id, { status: o.status === 'finished' ? 'unfinished' : 'finished' });
  }, [updateOneShot]);

  const fmtDate = (d: OneShot['date']) =>
    `${d.year}. ${String(d.month).padStart(2, '0')}. ${String(d.day).padStart(2, '0')}.`;

  if (oneShots.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📝</span>
        </div>
        <h3 className="text-lg font-medium text-amber-900 mb-2">Még nincsenek one-shotjaid</h3>
        <p className="text-amber-600">Hozz létre egy újat az "Új" gombra kattintva!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
          <input type="text" placeholder="Keresés cím vagy tartalom alapján..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white" />
        </div>
        {allGenres.length > 0 && (
          <select value={genreFilter} onChange={e => setGenreFilter(e.target.value)}
            className="px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
            <option value="all">Összes műfaj</option>
            {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        )}
        <SortPanel criteria={criteria} onMove={move} onToggleDir={toggleDir} />
      </div>

      <div className="flex gap-4 text-sm text-amber-600">
        <span>Összesen: {oneShots.length} one-shot</span>
        <span>Kész: {oneShots.filter(o => o.status === 'finished').length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-amber-500">Nincs találat.</div>
      ) : (
        <div ref={parentRef} className="overflow-y-auto" style={{ height: 'calc(100vh - 260px)', minHeight: '300px' }}>
          <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            {virtualizer.getVirtualItems().map(virtualItem => {
              const o = filtered[virtualItem.index];
              return (
                <div key={o.id} data-index={virtualItem.index} ref={virtualizer.measureElement}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualItem.start}px)`, paddingBottom: '12px' }}>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <button onClick={() => toggleStatus(o)}
                            className={`flex-shrink-0 ${o.status === 'finished' ? 'text-green-500' : 'text-amber-300'} hover:scale-110 transition-transform`}>
                            {o.status === 'finished' ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                          </button>
                          <h3 className={`min-w-0 flex-1 font-semibold text-lg break-words ${o.status === 'finished' ? 'text-amber-900' : 'text-amber-700'}`}>
                            {o.title}
                          </h3>
                          {o.status === 'finished' && (
                            <span className="flex-shrink-0 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Kész</span>
                          )}
                        </div>
                        {o.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {o.genres.map(g => (
                              <span key={g} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">{g}</span>
                            ))}
                          </div>
                        )}
                        <p className="text-amber-600 text-sm line-clamp-2 mb-2">{o.content}</p>
                        <div className="flex items-center gap-1 text-xs text-amber-400">
                          <Calendar className="w-3 h-3" />{fmtDate(o.date)}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => onEdit(o.id)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (confirm('Törlöd ezt a one-shotot?')) deleteOneShot(o.id); }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
