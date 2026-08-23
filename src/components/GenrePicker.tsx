import { GENRES } from '../types';
import type { Genre } from '../types';

interface GenrePickerProps {
  selected: Genre[];
  onChange: (genres: Genre[]) => void;
}

export function GenrePicker({ selected, onChange }: GenrePickerProps) {
  const toggle = (g: Genre) => {
    onChange(selected.includes(g) ? selected.filter(s => s !== g) : [...selected, g]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {GENRES.map(g => {
        const active = selected.includes(g);
        return (
          <button
            key={g}
            type="button"
            onClick={() => toggle(g)}
            className="px-3 py-1 rounded-full text-sm border transition-colors"
            style={active
              ? { backgroundColor: 'var(--color-accent)', borderColor: 'var(--color-accent)', color: 'var(--color-accent-text)' }
              : { backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-surface-border)', color: 'var(--color-text-secondary)' }
            }
            onMouseEnter={e => {
              if (!active) e.currentTarget.style.backgroundColor = 'var(--color-surface-border)';
            }}
            onMouseLeave={e => {
              if (!active) e.currentTarget.style.backgroundColor = 'var(--color-surface)';
            }}
          >
            {g}
          </button>
        );
      })}
    </div>
  );
}
