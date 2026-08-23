import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { CardActions, GenreBadge, EmptyState } from './ThemedCard';
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
    return <EmptyState icon="📖" title="Még nincsenek könyveid" subtitle={'Hozz létre egyet az "Új" gombra kattintva!'} />;
  }

  return (
    <div className="space-y-4">
      <input type="text" placeholder="Keresés könyvcím alapján..." value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-2 rounded-lg border text-sm focus:outline-none"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-surface-border)',
          color: 'var(--color-text-primary)',
        }}
        onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 2px var(--color-accent)`; e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
        onBlur={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--color-surface-border)'; }}
      />

      <div className="flex gap-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        <span>Összesen: {books.length} könyv</span>
        <span style={{ color: 'var(--color-done)' }}>Kész: {books.filter(b => b.status === 'finished').length}</span>
      </div>

      <div className="grid gap-4">
        {filtered.map(book => (
          <BookCard key={book.id} book={book}
            onOpen={() => onOpenBook(book.id)}
            onEdit={() => onEditBook(book.id)}
            onDelete={() => deleteBook(book.id)} />
        ))}
      </div>

      {filtered.length === 0 && books.length > 0 && (
        <div className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Nincs találat.</div>
      )}
    </div>
  );
}

function BookCard({ book, onOpen, onEdit, onDelete }: {
  book: Book; onOpen: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const finishedChapters = book.chapters.filter(c => c.status === 'finished').length;

  return (
    <div className="rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden"
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-surface-border)' }}>
      <button onClick={onOpen} className="w-full text-left p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">📖</span>
              <h3 className="font-bold text-lg break-words" style={{ color: 'var(--color-text-primary)' }}>{book.title}</h3>
              {book.status === 'finished' && (
                <span className="flex-shrink-0 px-2 py-0.5 text-xs rounded-full"
                  style={{ backgroundColor: 'var(--color-done-bg)', color: 'var(--color-done-text)' }}>Kész</span>
              )}
            </div>
            {book.thought && (
              <p className="text-sm italic mb-2 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                "{book.thought}"
              </p>
            )}
            {book.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {book.genres.map(g => <GenreBadge key={g} genre={g} />)}
              </div>
            )}
            <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <span>{book.date.year}. {String(book.date.month).padStart(2, '0')}. {String(book.date.day).padStart(2, '0')}.</span>
              <span>{book.chapters.length} fejezet ({finishedChapters} kész)</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: 'var(--color-text-muted)' }} />
        </div>
      </button>
      <div className="border-t px-4 py-2 flex justify-end gap-1" style={{ borderColor: 'var(--color-surface-border)' }}>
        <CardActions onEdit={onEdit} onDelete={onDelete} deleteConfirmText={`Törlöd a "${book.title}" könyvet?`} />
      </div>
    </div>
  );
}
