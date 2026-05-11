import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Poem, Cycle, AppData } from '../types';

interface StorageContextType {
  poems: Poem[];
  cycles: Cycle[];
  addPoem: (poem: Omit<Poem, 'id' | 'createdAt' | 'updatedAt'>) => Poem;
  updatePoem: (id: string, poem: Partial<Poem>) => void;
  deletePoem: (id: string) => void;
  getPoemById: (id: string) => Poem | undefined;
  hasPoemWithTitle: (title: string, excludeId?: string) => boolean;
  addCycle: (cycle: Omit<Cycle, 'id' | 'createdAt' | 'updatedAt'>) => Cycle;
  updateCycle: (id: string, cycle: Partial<Cycle>) => void;
  deleteCycle: (id: string) => void;
  getCycleById: (id: string) => Cycle | undefined;
  getPoemsByIds: (ids: string[]) => Poem[];
  exportData: () => string;
  importData: (jsonData: string) => void;
  isLoading: boolean;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

const STORAGE_KEY = 'poetry-app-data';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data: AppData = JSON.parse(stored);
        setPoems(data.poems || []);
        setCycles(data.cycles || []);
      } catch (e) {
        console.error('Failed to parse stored data:', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      const data: AppData = { poems, cycles };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [poems, cycles, isLoading]);

  const addPoem = useCallback((poemData: Omit<Poem, 'id' | 'createdAt' | 'updatedAt'>): Poem => {
    const newPoem: Poem = {
      ...poemData,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setPoems(prev => [...prev, newPoem]);
    return newPoem;
  }, []);

  const updatePoem = useCallback((id: string, poemData: Partial<Poem>) => {
    setPoems(prev =>
      prev.map(poem =>
        poem.id === id
          ? { ...poem, ...poemData, updatedAt: Date.now() }
          : poem
      )
    );
  }, []);

  const deletePoem = useCallback((id: string) => {
    setPoems(prev => prev.filter(poem => poem.id !== id));
    // Also remove from cycles
    setCycles(prev =>
      prev.map(cycle => ({
        ...cycle,
        poemIds: cycle.poemIds.filter(pid => pid !== id),
      }))
    );
  }, []);

  const getPoemById = useCallback((id: string) => {
    return poems.find(poem => poem.id === id);
  }, [poems]);

  const hasPoemWithTitle = useCallback((title: string, excludeId?: string) => {
    return poems.some(
      poem => 
        poem.title.toLowerCase().trim() === title.toLowerCase().trim() &&
        poem.id !== excludeId
    );
  }, [poems]);

  const addCycle = useCallback((cycleData: Omit<Cycle, 'id' | 'createdAt' | 'updatedAt'>): Cycle => {
    const newCycle: Cycle = {
      ...cycleData,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setCycles(prev => [...prev, newCycle]);
    return newCycle;
  }, []);

  const updateCycle = useCallback((id: string, cycleData: Partial<Cycle>) => {
    setCycles(prev =>
      prev.map(cycle =>
        cycle.id === id
          ? { ...cycle, ...cycleData, updatedAt: Date.now() }
          : cycle
      )
    );
  }, []);

  const deleteCycle = useCallback((id: string) => {
    setCycles(prev => prev.filter(cycle => cycle.id !== id));
  }, []);

  const getCycleById = useCallback((id: string) => {
    return cycles.find(cycle => cycle.id === id);
  }, [cycles]);

  const getPoemsByIds = useCallback((ids: string[]) => {
    return poems.filter(poem => ids.includes(poem.id));
  }, [poems]);

  const exportData = useCallback(() => {
    const data: AppData = { poems, cycles };
    return JSON.stringify(data, null, 2);
  }, [poems, cycles]);

  const importData = useCallback((jsonData: string) => {
    try {
      const data: AppData = JSON.parse(jsonData);
      
      if (!data.poems || !Array.isArray(data.poems) || !data.cycles || !Array.isArray(data.cycles)) {
        throw new Error('Invalid data structure');
      }

      // Create maps of existing IDs
      const existingPoemIds = new Set(poems.map(p => p.id));
      const existingCycleIds = new Set(cycles.map(c => c.id));

      // ID mapping for duplicates
      const poemIdMap = new Map<string, string>();
      const cycleIdMap = new Map<string, string>();

      // Process poems - keep all but assign new IDs if duplicate
      const processedPoems: Poem[] = data.poems.map(poem => {
        let newId = poem.id;
        if (existingPoemIds.has(poem.id)) {
          newId = generateId();
          poemIdMap.set(poem.id, newId);
        }
        return {
          ...poem,
          id: newId,
          createdAt: poem.createdAt || Date.now(),
          updatedAt: Date.now(),
        };
      });

      // Process cycles - keep all but assign new IDs if duplicate
      const processedCycles: Cycle[] = data.cycles.map(cycle => {
        let newId = cycle.id;
        if (existingCycleIds.has(cycle.id)) {
          newId = generateId();
          cycleIdMap.set(cycle.id, newId);
        }
        
        // Update poem IDs in cycle if they were remapped
        const updatedPoemIds = cycle.poemIds.map(pid => poemIdMap.get(pid) || pid);
        
        return {
          ...cycle,
          id: newId,
          poemIds: updatedPoemIds,
          createdAt: cycle.createdAt || Date.now(),
          updatedAt: Date.now(),
        };
      });

      // Merge data - keep existing and add new
      setPoems(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newPoems = processedPoems.filter(p => !existingIds.has(p.id));
        return [...prev, ...newPoems];
      });

      setCycles(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const newCycles = processedCycles.filter(c => !existingIds.has(c.id));
        return [...prev, ...newCycles];
      });

    } catch (e) {
      throw new Error('Failed to import data: ' + (e as Error).message);
    }
  }, [poems, cycles]);

  return (
    <StorageContext.Provider
      value={{
        poems,
        cycles,
        addPoem,
        updatePoem,
        deletePoem,
        getPoemById,
        hasPoemWithTitle,
        addCycle,
        updateCycle,
        deleteCycle,
        getCycleById,
        getPoemsByIds,
        exportData,
        importData,
        isLoading,
      }}
    >
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}
