import { useState, useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Edit2, Trash2, Calendar, CheckCircle2, Circle, Search } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { useSortConfig, applySort } from '../hooks/useSortConfig';
import { SortPanel } from './SortPanel';
import type { Poem } from '../types';

interface PoemListProps {
  onEdit: (id: string) => void;
}

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
  const [statusFilter] = useState<'all' | 'finished' | 'unfinished'>('all');

  const { criteria, move, toggleDir } = useSortConfig('poem-sort-config');

  const parentRef = useRef<HTMLDivElement>(null);

  const filteredPoems = useMemo(() => {
    const term = searchTerm.trim();

    let result = poems.filter(poem => {
      if (statusFilter !== 'all' && poem.status !== statusFilter) return false;
      if (!term) return true;
      return getSearchScore(poem, term) >= 1;
    });

    if (term) {
      // When searching: relevance first, then apply user sort as tiebreaker
      result = result.sort((a, b) => {
        const scoreA = getSearchScore(a, term);
        const scoreB = getSearchScore(b, term);
        if (scoreB !== scoreA) return scoreB - scoreA;
        // Same relevance → apply user-defined sort
        const sorted = applySort([a, b], criteria);
        return sorted[0] === a ? -1 : 1;
      });
    } else {
      result = applySort(result, criteria);
    }

    return result;
  }, [poems, searchTerm, statusFilter, criteria]);

  const virtualizer = useVirtualizer({
    count: filteredPoems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 130,
    overscan: 8,
  });

  const toggleStatus = useCallback((poem: Poem) => {
    updatePoem(poem.id, {
      status: poem.status === 'finished' ? 'unfinished' : 'finished',
    });
  }, [updatePoem]);

  const formatDate = (date: Poem['date']) =>
    `${date.year}. ${String(date.month).padStart(2, '0')}. ${String(date.day).padStart(2, '0')}.`;

  if (poems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✍️</span>
        </div>
        <h3 className="text-lg font-medium text-amber-900 mb-2">Még nincsenek verseid</h3>
        <p className="text-amber-600">Kezdj el írni az "Új" gombra kattintva!</p>
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
          placeholder="Keresés cím vagy tartalom alapján..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
        />
      </div>

      {/* Sort row */}
      <SortPanel criteria={criteria} onMove={move} onToggleDir={toggleDir} />

      {/* Stats */}
      <div className="flex gap-4 text-sm text-amber-600">
        <span>Összesen: {poems.length} vers</span>
        <span>Kész: {poems.filter(p => p.status === 'finished').length}</span>
      </div>

      {filteredPoems.length === 0 ? (
        <div className="text-center py-8 text-amber-500">
          Nincs a keresési feltételeknek megfelelő vers.
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
              const poem = filteredPoems[virtualItem.index];
              return (
                <div
                  key={poem.id}
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
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            onClick={() => toggleStatus(poem)}
                            className={`flex-shrink-0 ${
                              poem.status === 'finished' ? 'text-green-500' : 'text-amber-300'
                            } hover:scale-110 transition-transform`}
                          >
                            {poem.status === 'finished'
                              ? <CheckCircle2 className="w-5 h-5" />
                              : <Circle className="w-5 h-5" />}
                          </button>
                          <h3 className={`min-w-0 flex-1 font-semibold text-lg whitespace-normal break-words ${
                            poem.status === 'finished' ? 'text-amber-900' : 'text-amber-700'
                          }`}>
                            {poem.title}
                          </h3>
                          {poem.status === 'finished' && (
                            <span className="flex-shrink-0 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              Kész
                            </span>
                          )}
                        </div>
                        <p className="text-amber-600 text-sm line-clamp-2 mb-2">
                          {poem.content}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-amber-400">
                          <Calendar className="w-3 h-3" />
                          {formatDate(poem.date)}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => onEdit(poem.id)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Biztosan törölni szeretnéd ezt a verset?')) {
                              deletePoem(poem.id);
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
