export interface Poem {
  id: string;
  title: string;
  content: string;
  date: { year: number; month: number; day: number };
  status: 'finished' | 'unfinished';
  createdAt: number;
  updatedAt: number;
}

export interface Cycle {
  id: string;
  title: string;
  thought: string;
  poemIds: string[];
  date: { year: number; month: number; day: number };
  status: 'finished' | 'unfinished';
  createdAt: number;
  updatedAt: number;
}

// ── Genres ──────────────────────────────────────────────────────────────────
export const GENRES = [
  'Akció', 'Kaland', 'Fantasy', 'Sci-fi', 'Horror', 'Thriller',
  'Romantika', 'Dráma', 'Vígjáték', 'Komédia', 'Misztérium', 'Történelmi',
  'Dystopia', 'Utopia', 'Mitológia', 'Slam poetry', 'Lírai próza',
] as const;
export type Genre = typeof GENRES[number];

// ── One-shot ─────────────────────────────────────────────────────────────────
export interface OneShot {
  id: string;
  title: string;
  content: string;
  genres: Genre[];
  date: { year: number; month: number; day: number };
  status: 'finished' | 'unfinished';
  createdAt: number;
  updatedAt: number;
}

// ── Book / Chapter ────────────────────────────────────────────────────────────
export interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  status: 'finished' | 'unfinished';
  createdAt: number;
  updatedAt: number;
}

export interface Book {
  id: string;
  title: string;
  thought: string;
  genres: Genre[];
  chapters: Chapter[];
  // Két külön dátum, mert egy könyv írása jóval hosszabb folyamat, mint egy versé:
  // mikor kezdődött és mikor fejeződött be (vagy fejeződik majd be) az írás.
  startDate: { year: number; month: number; day: number };
  endDate: { year: number; month: number; day: number };
  status: 'finished' | 'unfinished';
  createdAt: number;
  updatedAt: number;
}

// ── App data ─────────────────────────────────────────────────────────────────
export interface AppData {
  poems: Poem[];
  cycles: Cycle[];
  oneShots: OneShot[];
  books: Book[];
}

export type View =
  | 'poems' | 'poem-form'
  | 'cycles' | 'cycle-form'
  | 'oneshots' | 'oneshot-form'
  | 'books' | 'book-detail'
  | 'import-export';
