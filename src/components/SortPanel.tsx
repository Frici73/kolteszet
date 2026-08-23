import { ArrowUp, ArrowDown, ChevronUp, ChevronDown } from 'lucide-react';
import type { SortCriterion, SortKey } from '../hooks/useSortConfig';
import { SORT_LABELS } from '../hooks/useSortConfig';

interface SortPanelProps {
  criteria: SortCriterion[];
  onMove: (index: number, dir: 'up' | 'down') => void;
  onToggleDir: (index: number) => void;
}

const KEY_ICONS: Record<SortKey, string> = {
  date:  '📅',
  abc:   '🔤',
  state: '✅',
};

export function SortPanel({ criteria, onMove, onToggleDir }: SortPanelProps) {
  return (
    <div className="flex gap-2 w-full">
      {criteria.map((c, i) => (
        <div
          key={c.key}
          className="flex-1 flex items-center justify-between gap-1 px-3 py-2 bg-white border border-amber-200 rounded-lg"
        >
          {/* Priority + move buttons */}
          <div className="flex flex-col items-center gap-0">
            <button
              onClick={() => onMove(i, 'up')}
              disabled={i === 0}
              className="p-0.5 text-amber-400 hover:text-amber-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            <span className="text-xs font-bold text-amber-400 leading-none">{i + 1}</span>
            <button
              onClick={() => onMove(i, 'down')}
              disabled={i === criteria.length - 1}
              className="p-0.5 text-amber-400 hover:text-amber-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Label */}
          <span className="text-sm text-amber-800 font-medium flex-1 text-center select-none">
            {KEY_ICONS[c.key]} {SORT_LABELS[c.key]}
          </span>

          {/* Asc / Desc toggle */}
          <button
            onClick={() => onToggleDir(i)}
            title={c.dir === 'asc' ? 'Növekvő' : 'Csökkenő'}
            className="p-1 rounded hover:bg-amber-100 text-amber-600 transition-colors flex-shrink-0"
          >
            {c.dir === 'asc'
              ? <ArrowUp className="w-3.5 h-3.5" />
              : <ArrowDown className="w-3.5 h-3.5" />
            }
          </button>
        </div>
      ))}
    </div>
  );
}
