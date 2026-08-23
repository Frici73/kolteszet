import { useState } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, SlidersHorizontal, ChevronUp, ChevronDown } from 'lucide-react';
import type { SortCriterion, SortKey } from '../hooks/useSortConfig';
import { SORT_LABELS } from '../hooks/useSortConfig';

interface SortPanelProps {
  criteria: SortCriterion[];
  onMove: (index: number, dir: 'up' | 'down') => void;
  onToggleDir: (index: number) => void;
}

const KEY_ICONS: Record<SortKey, string> = {
  date: '📅',
  abc:  '🔤',
  state: '✅',
};

export function SortPanel({ criteria, onMove, onToggleDir }: SortPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors text-sm font-medium whitespace-nowrap ${
          open
            ? 'bg-amber-100 border-amber-400 text-amber-900'
            : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-50'
        }`}
      >
        <SlidersHorizontal className="w-4 h-4" />
        Rendezés
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-amber-200 rounded-xl shadow-lg p-3 min-w-[220px]">
          <p className="text-xs text-amber-500 mb-2 font-medium uppercase tracking-wide">
            Rendezési sorrend
          </p>
          <div className="space-y-1">
            {criteria.map((c, i) => (
              <div
                key={c.key}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-50 border border-amber-100"
              >
                {/* Priority number */}
                <span className="text-xs font-bold text-amber-400 w-4 text-center">
                  {i + 1}
                </span>

                {/* Icon + label */}
                <span className="text-sm flex-1 text-amber-800 font-medium">
                  {KEY_ICONS[c.key]} {SORT_LABELS[c.key]}
                </span>

                {/* Asc / Desc toggle */}
                <button
                  onClick={() => onToggleDir(i)}
                  title={c.dir === 'asc' ? 'Növekvő' : 'Csökkenő'}
                  className="p-1 rounded hover:bg-amber-200 text-amber-600 transition-colors"
                >
                  {c.dir === 'asc'
                    ? <ArrowUp className="w-3.5 h-3.5" />
                    : <ArrowDown className="w-3.5 h-3.5" />
                  }
                </button>

                {/* Move up / down */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => onMove(i, 'up')}
                    disabled={i === 0}
                    className="p-0.5 rounded hover:bg-amber-200 text-amber-500 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onMove(i, 'down')}
                    disabled={i === criteria.length - 1}
                    className="p-0.5 rounded hover:bg-amber-200 text-amber-500 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-2 pt-2 border-t border-amber-100 flex items-center gap-3 text-xs text-amber-400">
            <span className="flex items-center gap-1"><ArrowUp className="w-3 h-3" /> Növekvő</span>
            <span className="flex items-center gap-1"><ArrowDown className="w-3 h-3" /> Csökkenő</span>
            <span className="flex items-center gap-1"><ArrowUpDown className="w-3 h-3" /> Prioritás</span>
          </div>
        </div>
      )}
    </div>
  );
}
