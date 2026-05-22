import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Edit2, Trash2, Calendar, CheckCircle2, Circle, Search, BookOpen } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import type { Cycle } from '../types';

interface CycleListProps {
  onEdit: (id: string) => void;
}

const VISIBLE_COUNT = 15;

export function CycleList({ onEdit }: CycleListProps) {
  const { cycles, deleteCycle, updateCycle, getPoemsByIds } = useStorage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'finished' | 'unfinished'>('all');
  const [visibleCount, setVisibleCount] = useState(VISIBLE_COUNT);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(VISIBLE_COUNT);
  }, [searchTerm, statusFilter]);

  const filteredCycles = useMemo(() => {
    return cycles
      .filter(cycle => {
        const matchesSearch = searchTerm.trim()
          ? (cycle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             cycle.thought.toLowerCase().includes(searchTerm.toLowerCase()))
          : true;
        const matchesStatus = statusFilter === 'all' || cycle.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'finished' ? -1 : 1;
        }
        return b.updatedAt - a.updatedAt;
      });
  }, [cycles, searchTerm, statusFilter]);

  const visibleCycles = useMemo(() => {
    return filteredCycles.slice(0, visibleCount);
  }, [filteredCycles, visibleCount]);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && visibleCount < filteredCycles.length) {
      setVisibleCount(prev => Math.min(prev + VISIBLE_COUNT, filteredCycles.length));
    }
  }, [visibleCount, filteredCycles.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '200px',
      threshold: 0,
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleObserver]);

  const toggleStatus = (cycle: Cycle) => {
    updateCycle(cycle.id, {
      status: cycle.status === 'finished' ? 'unfinished' : 'finished',
    });
  };

  const formatDate = (date: Cycle['date']) => {
    return `${date.year}. ${String(date.month).padStart(2, '0')}. ${String(date.day).padStart(2, '0')}.`;
  };

  // Custom search: title match gets priority over content/thought match
  const getSearchHighlight = (cycle: Cycle): 'title-match' | 'content-match' | 'none' => {
    if (!searchTerm.trim()) return 'none';
    const term = searchTerm.toLowerCase().trim();
    if (cycle.title.toLowerCase().includes(term)) return 'title-match';
    if (cycle.thought.toLowerCase().includes(term)) return 'content-match';
    return 'none';
  };

  if (cycles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📚</span>
        </div>
        <h3 className="text-lg font-medium text-amber-900 mb-2">Még nincsenek ciklusaid</h3>
        <p className="text-amber-600">Hozz létre egy új ciklust az &quot;Új&quot; gombra kattintva!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
          <input
            type="text"
            placeholder="Keresés cím vagy gondolat alapján..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
        >
          <option value="all">Összes állapot</option>
          <option value="finished">Kész</option>
          <option value="unfinished">Nincs kész</option>
        </select>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-amber-600">
        <span>Összesen: {cycles.length} ciklus</span>
        <span>Kész: {cycles.filter(c => c.status === 'finished').length}</span>
        <span>Folyamatban: {cycles.filter(c => c.status === 'unfinished').length}</span>
        {searchTerm && <span>Keresés eredménye: {filteredCycles.length}</span>}
      </div>

      {/* Cycle List with virtual scrolling */}
      <div className="grid gap-3">
        {visibleCycles.map((cycle) => {
          const highlight = getSearchHighlight(cycle);
          const poems = getPoemsByIds(cycle.poemIds);
          return (
            <div
              key={cycle.id}
              className={`bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow ${
                highlight === 'title-match' ? 'border-amber-400 bg-amber-50/50' :
                highlight === 'content-match' ? 'border-amber-200' : 'border-amber-100'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => toggleStatus(cycle)}
                      className={`flex-shrink-0 ${
                        cycle.status === 'finished' ? 'text-green-500' : 'text-amber-300'
                      } hover:scale-110 transition-transform`}
                    >
                      {cycle.status === 'finished' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
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
                    {highlight === 'title-match' && (
                      <span className="flex-shrink-0 px-2 py-0.5 bg-amber-200 text-amber-800 text-xs rounded-full">
                        Cím egyezés
                      </span>
                    )}
                  </div>

                  <p className="text-amber-600 text-sm mb-3 italic">
                    &quot;{cycle.thought}&quot;
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
          );
        })}
      </div>

      {/* Sentinel element for infinite scroll */}
      {visibleCount < filteredCycles.length && (
        <div ref={sentinelRef} className="h-4" />
      )}

      {/* Load more indicator */}
      {visibleCount < filteredCycles.length && (
        <div className="text-center py-4">
          <button
            onClick={() => setVisibleCount(prev => Math.min(prev + VISIBLE_COUNT, filteredCycles.length))}
            className="px-6 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium"
          >
            További {Math.min(VISIBLE_COUNT, filteredCycles.length - visibleCount)} ciklus betöltése ({filteredCycles.length - visibleCount} hátra)
          </button>
        </div>
      )}

      {filteredCycles.length === 0 && cycles.length > 0 && (
        <div className="text-center py-8 text-amber-500">
          Nincs a keresési feltételeknek megfelelő ciklus.
        </div>
      )}
    </div>
  );
}
