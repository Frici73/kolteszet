import { useState } from 'react';
import { Edit2, Trash2, Calendar, CheckCircle2, Circle, Search } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import type { Poem } from '../types';

interface PoemListProps {
  onEdit: (id: string) => void;
}

export function PoemList({ onEdit }: PoemListProps) {
  const { poems, deletePoem, updatePoem } = useStorage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'finished' | 'unfinished'>('all');

  const sortedPoems = [...poems].sort((a, b) => b.updatedAt - a.updatedAt);

  const filteredPoems = sortedPoems.filter(poem => {
    const matchesSearch = 
      poem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poem.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || poem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleStatus = (poem: Poem) => {
    updatePoem(poem.id, {
      status: poem.status === 'finished' ? 'unfinished' : 'finished',
    });
  };

  const formatDate = (date: Poem['date']) => {
    return `${date.year}. ${String(date.month).padStart(2, '0')}. ${String(date.day).padStart(2, '0')}.`;
  };

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
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
          <input
            type="text"
            placeholder="Keresés cím vagy tartalom alapján..."
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
        <span>Összesen: {poems.length} vers</span>
        <span>Kész: {poems.filter(p => p.status === 'finished').length}</span>
        <span>Folyamatban: {poems.filter(p => p.status === 'unfinished').length}</span>
      </div>

      {/* Poem List */}
      <div className="grid gap-3">
        {filteredPoems.map((poem) => (
          <div
            key={poem.id}
            className="bg-white rounded-xl p-4 shadow-sm border border-amber-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => toggleStatus(poem)}
                    className={`flex-shrink-0 ${
                      poem.status === 'finished' ? 'text-green-500' : 'text-amber-300'
                    } hover:scale-110 transition-transform`}
                  >
                    {poem.status === 'finished' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
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
        ))}
      </div>

      {filteredPoems.length === 0 && poems.length > 0 && (
        <div className="text-center py-8 text-amber-500">
          Nincs a keresési feltételeknek megfelelő vers.
        </div>
      )}
    </div>
  );
}
