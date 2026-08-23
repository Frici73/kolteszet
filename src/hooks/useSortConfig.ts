import { useState, useCallback } from 'react';

export type SortKey = 'date' | 'abc' | 'state';
export type SortDirection = 'asc' | 'desc';

export interface SortCriterion {
  key: SortKey;
  dir: SortDirection;
}

export const SORT_LABELS: Record<SortKey, string> = {
  date: 'Dátum',
  abc: 'ABC',
  state: 'Állapot',
};

const DEFAULT_CRITERIA: SortCriterion[] = [
  { key: 'date', dir: 'desc' },
  { key: 'abc',  dir: 'asc'  },
  { key: 'state', dir: 'asc' },
];

export function useSortConfig(storageKey: string) {
  const [criteria, setCriteria] = useState<SortCriterion[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_CRITERIA;
  });

  const save = useCallback((next: SortCriterion[]) => {
    setCriteria(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }, [storageKey]);

  // Move an item up or down in the priority order
  const move = useCallback((index: number, direction: 'up' | 'down') => {
    setCriteria(prev => {
      const next = [...prev];
      const swapWith = direction === 'up' ? index - 1 : index + 1;
      if (swapWith < 0 || swapWith >= next.length) return prev;
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  // Toggle asc/desc for a criterion
  const toggleDir = useCallback((index: number) => {
    setCriteria(prev => {
      const next = prev.map((c, i) =>
        i === index ? { ...c, dir: (c.dir === 'asc' ? 'desc' : 'asc') as SortDirection } : c
      );
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  return { criteria, move, toggleDir, save };
}

// Generic multi-key sorter
interface SortableItem {
  date: { year: number; month: number; day: number };
  title: string;
  status: 'finished' | 'unfinished';
  updatedAt: number;
}

export function applySort<T extends SortableItem>(items: T[], criteria: SortCriterion[]): T[] {
  return [...items].sort((a, b) => {
    for (const { key, dir } of criteria) {
      let cmp = 0;

      if (key === 'date') {
        const da = a.date.year * 10000 + a.date.month * 100 + a.date.day;
        const db = b.date.year * 10000 + b.date.month * 100 + b.date.day;
        cmp = da - db;
      } else if (key === 'abc') {
        cmp = a.title.localeCompare(b.title, 'hu', { sensitivity: 'base' });
      } else if (key === 'state') {
        // finished = 1, unfinished = 0  →  asc: unfinished first, desc: finished first
        const sa = a.status === 'finished' ? 1 : 0;
        const sb = b.status === 'finished' ? 1 : 0;
        cmp = sa - sb;
      }

      if (cmp !== 0) return dir === 'asc' ? cmp : -cmp;
    }
    // Final tiebreaker: most recently edited first
    return b.updatedAt - a.updatedAt;
  });
}
