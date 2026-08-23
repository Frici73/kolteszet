import { useState, useEffect } from 'react';
import { Trash2, Edit2, ChevronUp, ChevronDown, Save, X } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { StatusButton, DoneBadge } from './ThemedCard';
import { TInput, TTextarea, TButton, TFormHeader } from './ThemedForm';
import type { Chapter } from '../types';

interface BookDetailProps {
  bookId: string;
  addingChapter: boolean;
  onAddingChapterChange: (v: boolean) => void;
  onBack: () => void;
  onEditBook: (id: string) => void;
}

export function BookDetail({ bookId, addingChapter, onAddingChapterChange, onBack, onEditBook }: BookDetailProps) {
  const { getBookById, addChapter, updateChapter, deleteChapter, updateBook } = useStorage();
  const book = getBookById(bookId);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (addingChapter) { setNewTitle(''); setNewContent(''); }
  }, [addingChapter]);

  if (!book) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--color-text-secondary)' }}>A könyv nem található.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 rounded-lg"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-text)' }}>Vissza</button>
      </div>
    );
  }

  const sortedChapters = [...book.chapters].sort((a, b) => a.order - b.order);
  const finishedCount = book.chapters.filter(c => c.status === 'finished').length;

  const handleAddChapter = () => {
    if (!newTitle.trim()) return;
    addChapter(bookId, { title: newTitle.trim(), content: newContent.trim(), order: book.chapters.length, status: 'unfinished' });
    setNewTitle(''); setNewContent(''); onAddingChapterChange(false);
  };

  const startEdit = (c: Chapter) => { setEditingChapterId(c.id); setEditTitle(c.title); setEditContent(c.content); };
  const saveEdit = () => {
    if (!editingChapterId) return;
    updateChapter(bookId, editingChapterId, { title: editTitle.trim(), content: editContent.trim() });
    setEditingChapterId(null);
  };
  const moveChapter = (index: number, dir: 'up' | 'down') => {
    const sorted = [...sortedChapters];
    const swapIdx = dir === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    updateChapter(bookId, sorted[index].id, { order: sorted[swapIdx].order });
    updateChapter(bookId, sorted[swapIdx].id, { order: sorted[index].order });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <TFormHeader title="" onBack={onBack} />
        <div className="flex-1 min-w-0 -ml-4">
          <h2 className="text-xl font-bold break-words" style={{ color: 'var(--color-text-primary)' }}>{book.title}</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {book.chapters.length} fejezet · {finishedCount} kész
            {book.genres.length > 0 && ' · ' + book.genres.join(', ')}
          </p>
        </div>
        <button onClick={() => onEditBook(bookId)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--color-accent)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface-border)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
          <Edit2 className="w-5 h-5" />
        </button>
        <StatusButton
          finished={book.status === 'finished'}
          onToggle={() => updateBook(bookId, { status: book.status === 'finished' ? 'unfinished' : 'finished' })}
        />
      </div>

      {book.thought && (
        <div className="rounded-lg p-3 text-sm italic border"
          style={{ backgroundColor: 'var(--color-surface-border)', color: 'var(--color-text-secondary)', borderColor: 'var(--color-surface-border)' }}>
          "{book.thought}"
        </div>
      )}

      {/* New chapter form */}
      {addingChapter && (
        <div className="rounded-xl p-4 border space-y-3"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-surface-border)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Új fejezet</h3>
          <TInput value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Fejezet címe..." autoFocus />
          <TTextarea value={newContent} onChange={e => setNewContent(e.target.value)}
            placeholder="Tartalom (elhagyható)..." rows={5} style={{ fontFamily: 'serif' }} />
          <div className="flex gap-2">
            <TButton type="button" variant="secondary" onClick={() => onAddingChapterChange(false)} style={{ flex: 'none', padding: '8px 16px' }}>Mégse</TButton>
            <TButton type="button" onClick={handleAddChapter} style={{ flex: 'none', padding: '8px 16px' }}
              disabled={!newTitle.trim()}>Hozzáadás</TButton>
          </div>
        </div>
      )}

      {/* Chapter list */}
      <div className="space-y-3">
        {sortedChapters.length === 0 && !addingChapter && (
          <p className="text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
            Még nincsenek fejezetek. Adj hozzá egyet az "Új" gombra kattintva!
          </p>
        )}
        {sortedChapters.map((chapter, index) => (
          <div key={chapter.id} className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-surface-border)' }}>
            {editingChapterId === chapter.id ? (
              <div className="p-4 space-y-3">
                <TInput value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ fontWeight: 600 }} />
                <TTextarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={8} style={{ fontFamily: 'serif', fontSize: '14px' }} />
                <div className="flex gap-2">
                  <button onClick={() => setEditingChapterId(null)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border transition-colors"
                    style={{ borderColor: 'var(--color-surface-border)', color: 'var(--color-text-secondary)' }}>
                    <X className="w-3.5 h-3.5" /> Mégse
                  </button>
                  <button onClick={saveEdit}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm"
                    style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-text)' }}>
                    <Save className="w-3.5 h-3.5" /> Mentés
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <StatusButton
                    finished={chapter.status === 'finished'}
                    onToggle={() => updateChapter(bookId, chapter.id, { status: chapter.status === 'finished' ? 'unfinished' : 'finished' })}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{index + 1}.</span>
                      <h4 className="font-semibold break-words" style={{ color: 'var(--color-text-primary)' }}>{chapter.title}</h4>
                      <DoneBadge show={chapter.status === 'finished'} />
                    </div>
                    {chapter.content && (
                      <p className="text-sm line-clamp-2 mt-1" style={{ color: 'var(--color-text-secondary)' }}>{chapter.content}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="flex flex-col">
                      <button onClick={() => moveChapter(index, 'up')} disabled={index === 0}
                        className="p-0.5 transition-colors disabled:opacity-20"
                        style={{ color: 'var(--color-text-muted)' }}>
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button onClick={() => moveChapter(index, 'down')} disabled={index === sortedChapters.length - 1}
                        className="p-0.5 transition-colors disabled:opacity-20"
                        style={{ color: 'var(--color-text-muted)' }}>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    <button onClick={() => startEdit(chapter)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--color-accent)' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface-border)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if (confirm('Törlöd ezt a fejezetet?')) deleteChapter(bookId, chapter.id); }}
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: 'var(--color-danger)' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-danger-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
