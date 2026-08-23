import { useState, useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { BookOpen } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { useSortConfig, applySort } from '../hooks/useSortConfig';
import { SortPanel } from './SortPanel';
import { StatusButton, DoneBadge, CardTitle, CardDate, CardActions, CardWrapper, SearchInput, StatRow, EmptyState } from './ThemedCard';
import type { Cycle } from '../types';

interface CycleListProps { onEdit: (id: string) => void; }

function getCycleSearchScore(cycle: Cycle, term: string): number {
  if (!term) return 0;
  const t = term.toLowerCase();
  const title = cycle.title.toLowerCase();
  const thought = cycle.thought.toLowerCase();
  if (title === t) return 4;
  if (title.startsWith(t)) return 3;
  if (title.includes(t)) return 2;
  if (thought.includes(t)) return 1;
  return -1;
}

export function CycleList({ onEdit }: CycleListProps) {
  const { cycles, deleteCycle, updateCycle, getPoemsByIds } = useStorage();
  const [searchTerm, setSearchTerm] = useState('');
  const { criteria, move, toggleDir } = useSortConfig('cycle-sort-config');
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredCycles = useMemo(() => {
    const term = searchTerm.trim();
    let result = cycles.filter(c => !term || getCycleSearchScore(c, term) >= 1);
    if (term) {
      result = result.sort((a, b) => {
        const diff = getCycleSearchScore(b, term) - getCycleSearchScore(a, term);
        if (diff !== 0) return diff;
        const sorted = applySort([a, b], criteria);
        return sorted[0] === a ? -1 : 1;
      });
    } else {
      result = applySort(result, criteria);
    }
    return result;
  }, [cycles, searchTerm, criteria]);

  const virtualizer = useVirtualizer({
    count: filteredCycles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180,
    overscan: 5,
  });

  const toggleStatus = useCallback((cycle: Cycle) => {
    updateCycle(cycle.id, { status: cycle.status === 'finished' ? 'unfinished' : 'finished' });
  }, [updateCycle]);

  if (cycles.length === 0) return <EmptyState icon="📚" title="Még nincsenek ciklusaid" subtitle={'Hozz létre egyet az "Új" gombra kattintva!'} />;

  return (
    <div className="space-y-3">
      <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Keresés cím vagy gondolat alapján..." />
      <SortPanel criteria={criteria} onMove={move} onToggleDir={toggleDir} />
      <StatRow total={cycles.length} done={cycles.filter(c => c.status === 'finished').length} label="ciklus" />

      {filteredCycles.length === 0 ? (
        <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
          Nincs a keresési feltételeknek megfelelő ciklus.
        </div>
      ) : (
        <div ref={parentRef} className="overflow-y-auto" style={{ height: 'calc(100vh - 260px)', minHeight: '300px' }}>
          <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            {virtualizer.getVirtualItems().map(virtualItem => {
              const cycle = filteredCycles[virtualItem.index];
              const poems = getPoemsByIds(cycle.poemIds);
              return (
                <div key={cycle.id} data-index={virtualItem.index} ref={virtualizer.measureElement}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualItem.start}px)`, paddingBottom: '12px' }}>
                  <CardWrapper>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <StatusButton finished={cycle.status === 'finished'} onToggle={() => toggleStatus(cycle)} />
                          <CardTitle finished={cycle.status === 'finished'}>{cycle.title}</CardTitle>
                          <DoneBadge show={cycle.status === 'finished'} />
                        </div>
                        {cycle.thought && (
                          <p className="text-sm italic mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                            "{cycle.thought}"
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          <CardDate date={cycle.date} />
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />{poems.length} vers
                          </span>
                        </div>
                        {poems.length > 0 && (
                          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-surface-border)' }}>
                            <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>Versek a ciklusban:</p>
                            <div className="flex flex-wrap gap-1">
                              {poems.slice(0, 5).map(p => (
                                <span key={p.id} className="px-2 py-1 text-xs rounded"
                                  style={{ backgroundColor: 'var(--color-surface-border)', color: 'var(--color-text-secondary)' }}>
                                  {p.title}
                                </span>
                              ))}
                              {poems.length > 5 && (
                                <span className="px-2 py-1 text-xs rounded"
                                  style={{ backgroundColor: 'var(--color-surface-border)', color: 'var(--color-text-muted)' }}>
                                  +{poems.length - 5}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <CardActions
                        onEdit={() => onEdit(cycle.id)}
                        onDelete={() => deleteCycle(cycle.id)}
                        deleteConfirmText="Biztosan törölni szeretnéd ezt a ciklust?"
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
