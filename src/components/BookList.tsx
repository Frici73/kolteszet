import { useState } from 'react';
import { Trash2, BookOpen, Edit2, ChevronRight } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import type { Book } from '../types';

interface BookListProps {
  onOpenBook: (id: string) => void;
  onEditBook: (id: string) => void;
}

export function BookList({ onOpenBook, onEditBook }: BookListProps) {
  const { books, deleteBook } = useStorage();
  const [search, setSearch] = useState('');

  const filtered = books
    .filter(b => b.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📖</span>
        </div>
        <h3 className="text-lg font-medium text-amber-900 mb-2">Még nincsenek könyveid</h3>
        <p className="text-amber-500 text-sm">Hozz létre egyet az "Új" gombra kattintva!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input type="text" placeholder="Keresés könyvcím alapján..." value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white" />

      <div className="flex gap-4 text-sm text-amber-600">
        <span>Összesen: {books.length} könyv</span>
        <span>Kész: {books.filter(b => b.status === 'finished').length}</span>
      </div>

      <div className="grid gap-4">
        {filtered.map(book => (
          <BookCard key={book.id} book={book}
            onOpen={() => onOpenBook(book.id)}
            onEdit={() => onEditBook(book.id)}
            onDelete={() => { if (confirm(`Törlöd a "${book.title}" könyvet?`)) deleteBook(book.id); }} />
        ))}
      </div>

      {filtered.length === 0 && books.length > 0 && (
        <div className="text-center py-8 text-amber-500">Nincs találat.</div>
      )}
    </div>
  );
}

function BookCard({ book, onOpen, onEdit, onDelete }: {
  book: Book;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const finishedChapters = book.chapters.filter(c => c.status === 'finished').length;

  return (
    <div className="bg-white rounded-xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <button onClick={onOpen} className="w-full text-left p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <h3 className="font-bold text-lg text-amber-900 break-words">{book.title}</h3>
              {book.status === 'finished' && (
                <span className="flex-shrink-0 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Kész</span>
              )}
            </div>
            {book.thought && (
              <p className="text-amber-600 text-sm italic mb-2 line-clamp-2">"{book.thought}"</p>
            )}
            {book.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {book.genres.map(g => (
                  <span key={g} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">{g}</span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 text-xs text-amber-400">
              <span>{book.date.year}. {String(book.date.month).padStart(2, '0')}. {String(book.date.day).padStart(2, '0')}.</span>
              <span>{book.chapters.length} fejezet ({finishedChapters} kész)</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-amber-300 flex-shrink-0 mt-1" />
        </div>
      </button>

      <div className="border-t border-amber-50 px-4 py-2 flex justify-end gap-1">
        <button onClick={onEdit} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
