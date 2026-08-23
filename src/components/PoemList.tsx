import { useState, useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useStorage } from '../context/StorageContext';
import { useSortConfig, applySort } from '../hooks/useSortConfig';
import { SortPanel } from './SortPanel';
import { StatusButton, DoneBadge, CardTitle, CardPreview, CardDate, CardActions, CardWrapper, SearchInput, StatRow, EmptyState } from './ThemedCard';
import type { Poem } from '../types';

interface PoemListProps { onEdit: (id: string) => void; }

function getSearchScore(poem: Poem, term: string): number {
  if (!term) return 0;
  const t = term.toLowerCase();
  const title = poem.title.toLowerCase();
  const content = poem.content.toLowerCase();
  if (title === t) return 4;
  if (title.startsWith(t)) return 3;
  if (title.includes(t)) return 2;
  if (content.includes(t)) return 1;
  return -1;
}

export function PoemList({ onEdit }: PoemListProps) {
  const { poems, deletePoem, updatePoem } = useStorage();
  const [searchTerm, setSearchTerm] = useState('');
  const { criteria, move, toggleDir } = useSortConfig('poem-sort-config');
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredPoems = useMemo(() => {
    const term = searchTerm.trim();
    let result = poems.filter(poem => !term || getSearchScore(poem, term) >= 1);
    if (term) {
      result = result.sort((a, b) => {
        const diff = getSearchScore(b, term) - getSearchScore(a, term);
        if (diff !== 0) return diff;
        const sorted = applySort([a, b], criteria);
        return sorted[0] === a ? -1 : 1;
      });
    } else {
      result = applySort(result, criteria);
    }
    return result;
  }, [poems, searchTerm, criteria]);

  const virtualizer = useVirtualizer({
    count: filteredPoems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 130,
    overscan: 8,
  });

  const toggleStatus = useCallback((poem: Poem) => {
    updatePoem(poem.id, { status: poem.status === 'finished' ? 'unfinished' : 'finished' });
  }, [updatePoem]);

  if (poems.length === 0) return <EmptyState icon="✍️" title="Még nincsenek verseid" subtitle={'Kezdj el írni az "Új" gombra kattintva!'} />;

  return (
    <div className="space-y-3">
      <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Keresés cím vagy tartalom alapján..." />
      <SortPanel criteria={criteria} onMove={move} onToggleDir={toggleDir} />
      <StatRow total={poems.length} done={poems.filter(p => p.status === 'finished').length} label="vers" />

      {filteredPoems.length === 0 ? (
        <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
          Nincs a keresési feltételeknek megfelelő vers.
        </div>
      ) : (
        <div ref={parentRef} className="overflow-y-auto" style={{ height: 'calc(100vh - 260px)', minHeight: '300px' }}>
          <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            {virtualizer.getVirtualItems().map(virtualItem => {
              const poem = filteredPoems[virtualItem.index];
              return (
                <div key={poem.id} data-index={virtualItem.index} ref={virtualizer.measureElement}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualItem.start}px)`, paddingBottom: '12px' }}>
                  <CardWrapper>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusButton finished={poem.status === 'finished'} onToggle={() => toggleStatus(poem)} />
                          <CardTitle finished={poem.status === 'finished'}>{poem.title}</CardTitle>
                          <DoneBadge show={poem.status === 'finished'} />
                        </div>
                        <CardPreview>{poem.content}</CardPreview>
                        <CardDate date={poem.date} />
                      </div>
                      <CardActions
                        onEdit={() => onEdit(poem.id)}
                        onDelete={() => deletePoem(poem.id)}
                        deleteConfirmText="Biztosan törölni szeretnéd ezt a verset?"
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
