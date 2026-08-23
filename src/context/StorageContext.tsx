import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Poem, Cycle, OneShot, Book, Chapter, AppData } from '../types';

interface StorageContextType {
  // Poems
  poems: Poem[];
  addPoem: (p: Omit<Poem, 'id' | 'createdAt' | 'updatedAt'>) => Poem;
  updatePoem: (id: string, p: Partial<Poem>) => void;
  deletePoem: (id: string) => void;
  getPoemById: (id: string) => Poem | undefined;
  hasPoemWithTitle: (title: string, excludeId?: string) => boolean;
  getPoemsByIds: (ids: string[]) => Poem[];
  getCyclesForPoem: (poemId: string) => Cycle[];
  togglePoemInCycle: (poemId: string, cycleId: string) => void;
  // Cycles
  cycles: Cycle[];
  addCycle: (c: Omit<Cycle, 'id' | 'createdAt' | 'updatedAt'>) => Cycle;
  updateCycle: (id: string, c: Partial<Cycle>) => void;
  deleteCycle: (id: string) => void;
  getCycleById: (id: string) => Cycle | undefined;
  // OneShots
  oneShots: OneShot[];
  addOneShot: (o: Omit<OneShot, 'id' | 'createdAt' | 'updatedAt'>) => OneShot;
  updateOneShot: (id: string, o: Partial<OneShot>) => void;
  deleteOneShot: (id: string) => void;
  getOneShotById: (id: string) => OneShot | undefined;
  // Books
  books: Book[];
  addBook: (b: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>) => Book;
  updateBook: (id: string, b: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  getBookById: (id: string) => Book | undefined;
  addChapter: (bookId: string, c: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateChapter: (bookId: string, chapterId: string, c: Partial<Chapter>) => void;
  deleteChapter: (bookId: string, chapterId: string) => void;
  // Import / Export
  exportData: () => string;
  importData: (json: string) => void;
  isLoading: boolean;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);
const STORAGE_KEY = 'poetry-app-data';

function genId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const FALLBACK_DATE = { year: new Date().getFullYear(), month: new Date().getMonth() + 1, day: new Date().getDate() };

/**
 * Visszafelé kompatibilitás: a korábbi formátumban a Book-nak egyetlen
 * "date" mezője volt. Az új formátumban "startDate" és "endDate" van.
 * Ha egy régi exportot/mentést töltünk be, ezt a régi "date" mezőt
 * másoljuk mindkét új mezőbe, hogy semmi ne törjön el.
 */
function migrateBook(raw: any): Book {
  if (raw && !raw.startDate && raw.date) {
    return { ...raw, startDate: raw.date, endDate: raw.date };
  }
  return {
    ...raw,
    startDate: raw?.startDate || FALLBACK_DATE,
    endDate: raw?.endDate || raw?.startDate || FALLBACK_DATE,
  };
}

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [oneShots, setOneShots] = useState<OneShot[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data: AppData = JSON.parse(stored);
        setPoems(data.poems || []);
        setCycles(data.cycles || []);
        setOneShots(data.oneShots || []);
        setBooks((data.books || []).map(migrateBook));
      } catch (e) { console.error(e); }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ poems, cycles, oneShots, books }));
    }
  }, [poems, cycles, oneShots, books, isLoading]);

  // ── Poems ──────────────────────────────────────────────────────────────────
  const addPoem = useCallback((data: Omit<Poem, 'id' | 'createdAt' | 'updatedAt'>): Poem => {
    const p = { ...data, id: genId(), createdAt: Date.now(), updatedAt: Date.now() };
    setPoems(prev => [...prev, p]);
    return p;
  }, []);
  const updatePoem = useCallback((id: string, data: Partial<Poem>) => {
    setPoems(prev => prev.map(p => p.id === id ? { ...p, ...data, updatedAt: Date.now() } : p));
  }, []);
  const deletePoem = useCallback((id: string) => {
    setPoems(prev => prev.filter(p => p.id !== id));
    setCycles(prev => prev.map(c => ({ ...c, poemIds: c.poemIds.filter(pid => pid !== id) })));
  }, []);
  const getPoemById = useCallback((id: string) => poems.find(p => p.id === id), [poems]);
  const hasPoemWithTitle = useCallback((title: string, excludeId?: string) =>
    poems.some(p => p.title.toLowerCase().trim() === title.toLowerCase().trim() && p.id !== excludeId),
  [poems]);
  const getPoemsByIds = useCallback((ids: string[]) => poems.filter(p => ids.includes(p.id)), [poems]);

  const getCyclesForPoem = useCallback((poemId: string) =>
    cycles.filter(c => c.poemIds.includes(poemId)),
  [cycles]);

  const togglePoemInCycle = useCallback((poemId: string, cycleId: string) => {
    setCycles(prev => prev.map(c => {
      if (c.id !== cycleId) return c;
      const has = c.poemIds.includes(poemId);
      return {
        ...c,
        poemIds: has ? c.poemIds.filter(id => id !== poemId) : [...c.poemIds, poemId],
        updatedAt: Date.now(),
      };
    }));
  }, []);

  // ── Cycles ─────────────────────────────────────────────────────────────────
  const addCycle = useCallback((data: Omit<Cycle, 'id' | 'createdAt' | 'updatedAt'>): Cycle => {
    const c = { ...data, id: genId(), createdAt: Date.now(), updatedAt: Date.now() };
    setCycles(prev => [...prev, c]);
    return c;
  }, []);
  const updateCycle = useCallback((id: string, data: Partial<Cycle>) => {
    setCycles(prev => prev.map(c => c.id === id ? { ...c, ...data, updatedAt: Date.now() } : c));
  }, []);
  const deleteCycle = useCallback((id: string) => setCycles(prev => prev.filter(c => c.id !== id)), []);
  const getCycleById = useCallback((id: string) => cycles.find(c => c.id === id), [cycles]);

  // ── OneShots ───────────────────────────────────────────────────────────────
  const addOneShot = useCallback((data: Omit<OneShot, 'id' | 'createdAt' | 'updatedAt'>): OneShot => {
    const o = { ...data, id: genId(), createdAt: Date.now(), updatedAt: Date.now() };
    setOneShots(prev => [...prev, o]);
    return o;
  }, []);
  const updateOneShot = useCallback((id: string, data: Partial<OneShot>) => {
    setOneShots(prev => prev.map(o => o.id === id ? { ...o, ...data, updatedAt: Date.now() } : o));
  }, []);
  const deleteOneShot = useCallback((id: string) => setOneShots(prev => prev.filter(o => o.id !== id)), []);
  const getOneShotById = useCallback((id: string) => oneShots.find(o => o.id === id), [oneShots]);

  // ── Books ──────────────────────────────────────────────────────────────────
  const addBook = useCallback((data: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>): Book => {
    const b = { ...data, id: genId(), createdAt: Date.now(), updatedAt: Date.now() };
    setBooks(prev => [...prev, b]);
    return b;
  }, []);
  const updateBook = useCallback((id: string, data: Partial<Book>) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, ...data, updatedAt: Date.now() } : b));
  }, []);
  const deleteBook = useCallback((id: string) => setBooks(prev => prev.filter(b => b.id !== id)), []);
  const getBookById = useCallback((id: string) => books.find(b => b.id === id), [books]);

  const addChapter = useCallback((bookId: string, data: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>) => {
    setBooks(prev => prev.map(b => {
      if (b.id !== bookId) return b;
      const chapter: Chapter = { ...data, id: genId(), createdAt: Date.now(), updatedAt: Date.now() };
      return { ...b, chapters: [...b.chapters, chapter], updatedAt: Date.now() };
    }));
  }, []);
  const updateChapter = useCallback((bookId: string, chapterId: string, data: Partial<Chapter>) => {
    setBooks(prev => prev.map(b => {
      if (b.id !== bookId) return b;
      return {
        ...b,
        chapters: b.chapters.map(c => c.id === chapterId ? { ...c, ...data, updatedAt: Date.now() } : c),
        updatedAt: Date.now(),
      };
    }));
  }, []);
  const deleteChapter = useCallback((bookId: string, chapterId: string) => {
    setBooks(prev => prev.map(b => {
      if (b.id !== bookId) return b;
      return { ...b, chapters: b.chapters.filter(c => c.id !== chapterId), updatedAt: Date.now() };
    }));
  }, []);

  // ── Import / Export ────────────────────────────────────────────────────────
  const exportData = useCallback(() =>
    JSON.stringify({ poems, cycles, oneShots, books }, null, 2),
  [poems, cycles, oneShots, books]);

  const importData = useCallback((jsonData: string) => {
    const data: AppData = JSON.parse(jsonData);
    if (!Array.isArray(data.poems) || !Array.isArray(data.cycles)) throw new Error('Invalid structure');

    const merge = <T extends { id: string }>(existing: T[], incoming: T[]): T[] => {
      const existingIds = new Set(existing.map(e => e.id));
      const idMap = new Map<string, string>();
      const processed = incoming.map(item => {
        if (existingIds.has(item.id)) {
          const newId = genId();
          idMap.set(item.id, newId);
          return { ...item, id: newId, updatedAt: Date.now() };
        }
        return { ...item, updatedAt: Date.now() };
      });
      const newItems = processed.filter(p => !existingIds.has(p.id));
      return [...existing, ...newItems];
    };

    setPoems(prev => merge(prev, data.poems || []));
    setCycles(prev => merge(prev, data.cycles || []));
    setOneShots(prev => merge(prev, data.oneShots || []));
    setBooks(prev => merge(prev, (data.books || []).map(migrateBook)));
  }, [poems, cycles, oneShots, books]);

  return (
    <StorageContext.Provider value={{
      poems, addPoem, updatePoem, deletePoem, getPoemById, hasPoemWithTitle, getPoemsByIds,
      getCyclesForPoem, togglePoemInCycle,
      cycles, addCycle, updateCycle, deleteCycle, getCycleById,
      oneShots, addOneShot, updateOneShot, deleteOneShot, getOneShotById,
      books, addBook, updateBook, deleteBook, getBookById, addChapter, updateChapter, deleteChapter,
      exportData, importData, isLoading,
    }}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorage must be used within StorageProvider');
  return ctx;
}
