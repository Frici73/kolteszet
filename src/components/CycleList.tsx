import { useState, useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Edit2, Trash2, Calendar, CheckCircle2, Circle, Search, BookOpen } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { useSortConfig, applySort } from '../hooks/useSortConfig';
import { SortPanel } from './SortPanel';
import type { Cycle } from '../types';

interface CycleListProps {
  onEdit: (id: string) => void;
}

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
  const [statusFilter] = useState<'all' | 'finished' | 'unfinished'>('all');

  const { criteria, move, toggleDir } = useSortConfig('cycle-sort-config');

  const parentRef = useRef<HTMLDivElement>(null);

  const filteredCycles = useMemo(() => {
    const term = searchTerm.trim();

    let result = cycles.filter(cycle => {
      if (statusFilter !== 'all' && cycle.status !== statusFilter) return false;
      if (!term) return true;
      return getCycleSearchScore(cycle, term) >= 1;
    });

    if (term) {
      result = result.sort((a, b) => {
        const scoreA = getCycleSearchScore(a, term);
        const scoreB = getCycleSearchScore(b, term);
        if (scoreB !== scoreA) return scoreB - scoreA;
        const sorted = applySort([a, b], criteria);
        return sorted[0] === a ? -1 : 1;
      });
    } else {
      result = applySort(result, criteria);
    }

    return result;
  }, [cycles, searchTerm, statusFilter, criteria]);

  const virtualizer = useVirtualizer({
    count: filteredCycles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180,
    overscan: 5,
  });

  const toggleStatus = useCallback((cycle: Cycle) => {
    updateCycle(cycle.id, {
      status: cycle.status === 'finished' ? 'unfinished' : 'finished',
    });
  }, [updateCycle]);

  const formatDate = (date: Cycle['date']) =>
    `${date.year}. ${String(date.month).padStart(2, '0')}. ${String(date.day).padStart(2, '0')}.`;

  if (cycles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📚</span>
        </div>
        <h3 className="text-lg font-medium text-amber-900 mb-2">Még nincsenek ciklusaid</h3>
        <p className="text-amber-600">Hozz létre egy új ciklust az "Új" gombra kattintva!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search row */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
        <input
          type="text"
          placeholder="Keresés cím vagy gondolat alapján..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
        />
      </div>

      {/* Sort row */}
      <SortPanel criteria={criteria} onMove={move} onToggleDir={toggleDir} />

      {/* Stats */}
      <div className="flex gap-4 text-sm text-amber-600">
        <span>Összesen: {cycles.length} ciklus</span>
        <span>Kész: {cycles.filter(c => c.status === 'finished').length}</span>
      </div>

      {filteredCycles.length === 0 ? (
        <div className="text-center py-8 text-amber-500">
          Nincs a keresési feltételeknek megfelelő ciklus.
        </div>
      ) : (
        <div
          ref={parentRef}
          className="overflow-y-auto"
          style={{ height: 'calc(100vh - 260px)', minHeight: '300px' }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const cycle = filteredCycles[virtualItem.index];
              const poems = getPoemsByIds(cycle.poemIds);
              return (
                <div
                  key={cycle.id}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                    paddingBottom: '12px',
                  }}
                >
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={() => toggleStatus(cycle)}
                            className={`flex-shrink-0 ${
                              cycle.status === 'finished' ? 'text-green-500' : 'text-amber-300'
                            } hover:scale-110 transition-transform`}
                          >
                            {cycle.status === 'finished'
                              ? <CheckCircle2 className="w-5 h-5" />
                              : <Circle className="w-5 h-5" />}
                          </button>
                          <h3 className={`min-w-0 flex-1 font-semibold text-lg whitespace-normal break-words ${
                            cycle.status === 'finished' ? 'text-amber-900' : 'text-amber-700'
                          }`}>
                            {cycle.title}
                          </h3>
                          {cycle.status === 'finished' && (
                            <span className="flex-shrink-0 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              Kész
                            </span>
                          )}
                        </div>

                        <p className="text-amber-600 text-sm mb-3 italic">
                          "{cycle.thought}"
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <div className="flex items-center gap-1 text-amber-400">
                            <Calendar className="w-3 h-3" />
                            {formatDate(cycle.date)}
                          </div>
                          <div className="flex items-center gap-1 text-amber-500">
                            <BookOpen className="w-3 h-3" />
                            {poems.length} vers
                          </div>
                        </div>

                        {poems.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-amber-100">
                            <p className="text-xs text-amber-400 mb-2">Versek a ciklusban:</p>
                            <div className="flex flex-wrap gap-1">
                              {poems.slice(0, 5).map((poem) => (
                                <span
                                  key={poem.id}
                                  className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded"
                                >
                                  {poem.title}
                                </span>
                              ))}
                              {poems.length > 5 && (
                                <span className="px-2 py-1 bg-amber-50 text-amber-500 text-xs rounded">
                                  +{poems.length - 5}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => onEdit(cycle.id)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Biztosan törölni szeretnéd ezt a ciklust?')) {
                              deleteCycle(cycle.id);
                            }
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
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
