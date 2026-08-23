import { useState, useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useStorage } from '../context/StorageContext';
import { useSortConfig, applySort } from '../hooks/useSortConfig';
import { SortPanel } from './SortPanel';
import { StatusButton, DoneBadge, CardTitle, CardPreview, CardDate, CardActions, CardWrapper, GenreBadge, SearchInput, StatRow, EmptyState } from './ThemedCard';
import type { OneShot } from '../types';

interface OneShotListProps { onEdit: (id: string) => void; }

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

  if (oneShots.length === 0) return <EmptyState icon="📝" title="Még nincsenek one-shotjaid" subtitle={'Hozz létre egyet az "Új" gombra kattintva!'} />;

  return (
    <div className="space-y-3">
      {/* Search + genre filter */}
      <div className="flex gap-3">
        <div className="flex-1">
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Keresés cím vagy tartalom alapján..." />
        </div>
        {allGenres.length > 0 && (
          <select value={genreFilter} onChange={e => setGenreFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm focus:outline-none"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-surface-border)',
              color: 'var(--color-text-primary)',
            }}>
            <option value="all">Összes műfaj</option>
            {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        )}
      </div>
      <SortPanel criteria={criteria} onMove={move} onToggleDir={toggleDir} />
      <StatRow total={oneShots.length} done={oneShots.filter(o => o.status === 'finished').length} label="one-shot" />

      {filtered.length === 0 ? (
        <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Nincs találat.</div>
      ) : (
        <div ref={parentRef} className="overflow-y-auto" style={{ height: 'calc(100vh - 260px)', minHeight: '300px' }}>
          <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            {virtualizer.getVirtualItems().map(virtualItem => {
              const o = filtered[virtualItem.index];
              return (
                <div key={o.id} data-index={virtualItem.index} ref={virtualizer.measureElement}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualItem.start}px)`, paddingBottom: '12px' }}>
                  <CardWrapper>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusButton finished={o.status === 'finished'} onToggle={() => toggleStatus(o)} />
                          <CardTitle finished={o.status === 'finished'}>{o.title}</CardTitle>
                          <DoneBadge show={o.status === 'finished'} />
                        </div>
                        {o.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {o.genres.map(g => <GenreBadge key={g} genre={g} />)}
                          </div>
                        )}
                        <CardPreview>{o.content}</CardPreview>
                        <CardDate date={o.date} />
                      </div>
                      <CardActions
                        onEdit={() => onEdit(o.id)}
                        onDelete={() => deleteOneShot(o.id)}
                        deleteConfirmText="Törlöd ezt a one-shotot?"
                      />
                    </div>
                  </CardWrapper>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
