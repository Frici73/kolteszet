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
          className="flex-1 flex items-center justify-between gap-1 px-3 py-2 rounded-lg"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-surface-border)',
          }}
        >
          {/* Priority + move buttons */}
          <div className="flex flex-col items-center gap-0">
            <button
              onClick={() => onMove(i, 'up')}
              disabled={i === 0}
              className="p-0.5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={e => { if (i !== 0) e.currentTarget.style.color = 'var(--color-text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            <span className="text-xs font-bold leading-none" style={{ color: 'var(--color-text-muted)' }}>
              {i + 1}
            </span>
            <button
              onClick={() => onMove(i, 'down')}
              disabled={i === criteria.length - 1}
              className="p-0.5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              style={{ color: 'var(--color-text-muted)' }}
              onMouseEnter={e => { if (i !== criteria.length - 1) e.currentTarget.style.color = 'var(--color-text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Label */}
          <span className="text-sm font-medium flex-1 text-center select-none" style={{ color: 'var(--color-text-secondary)' }}>
            {KEY_ICONS[c.key]} {SORT_LABELS[c.key]}
          </span>

          {/* Asc / Desc toggle */}
          <button
            onClick={() => onToggleDir(i)}
            title={c.dir === 'asc' ? 'Növekvő' : 'Csökkenő'}
            className="p-1 rounded transition-colors flex-shrink-0"
            style={{ color: 'var(--color-accent)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface-border)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
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
