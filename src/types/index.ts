export interface Poem {
  id: string;
  title: string;
  content: string;
  date: {
    year: number;
    month: number;
    day: number;
  };
  status: 'finished' | 'unfinished';
  createdAt: number;
  updatedAt: number;
}

export interface Cycle {
  id: string;
  title: string;
  thought: string;
  poemIds: string[];
  date: {
    year: number;
    month: number;
    day: number;
  };
  status: 'finished' | 'unfinished';
  createdAt: number;
  updatedAt: number;
}

export interface AppData {
  poems: Poem[];
  cycles: Cycle[];
}

export type View = 'poems' | 'cycles' | 'poem-form' | 'cycle-form' | 'import-export';
