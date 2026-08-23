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
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              active
                ? 'bg-amber-500 border-amber-500 text-white'
                : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-50'
            }`}
          >
            {g}
          </button>
        );
      })}
    </div>
  );
}
