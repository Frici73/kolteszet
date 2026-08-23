import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Edit2, CheckCircle2, Circle, ChevronUp, ChevronDown, Save, X } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
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

  // When addingChapter flips to true from outside, reset the form
  useEffect(() => {
    if (addingChapter) {
      setNewTitle('');
      setNewContent('');
    }
  }, [addingChapter]);

  if (!book) {
    return (
      <div className="text-center py-12">
        <p className="text-amber-600">A könyv nem található.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg">Vissza</button>
      </div>
    );
  }

  const sortedChapters = [...book.chapters].sort((a, b) => a.order - b.order);

  const handleAddChapter = () => {
    if (!newTitle.trim()) return;
    addChapter(bookId, {
      title: newTitle.trim(),
      content: newContent.trim(),
      order: book.chapters.length,
      status: 'unfinished',
    });
    setNewTitle('');
    setNewContent('');
    onAddingChapterChange(false);
  };

  const cancelAdd = () => {
    setNewTitle('');
    setNewContent('');
    onAddingChapterChange(false);
  };

  const startEdit = (c: Chapter) => {
    setEditingChapterId(c.id);
    setEditTitle(c.title);
    setEditContent(c.content);
  };

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

  const toggleChapterStatus = (c: Chapter) => {
    updateChapter(bookId, c.id, { status: c.status === 'finished' ? 'unfinished' : 'finished' });
  };

  const finishedCount = book.chapters.filter(c => c.status === 'finished').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-amber-900 break-words">{book.title}</h2>
          <p className="text-sm text-amber-500">
            {book.chapters.length} fejezet · {finishedCount} kész
            {book.genres.length > 0 && ' · ' + book.genres.join(', ')}
          </p>
        </div>
        <button onClick={() => onEditBook(bookId)}
          className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors">
          <Edit2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => updateBook(bookId, { status: book.status === 'finished' ? 'unfinished' : 'finished' })}
          className={`flex-shrink-0 ${book.status === 'finished' ? 'text-green-500' : 'text-amber-300'} hover:scale-110 transition-transform`}>
          {book.status === 'finished' ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
        </button>
      </div>

      {book.thought && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-amber-700 text-sm italic">
          "{book.thought}"
        </div>
      )}

      {/* New chapter form — triggered by the global "Új" button */}
      {addingChapter && (
        <div className="bg-white border border-amber-200 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-amber-900">Új fejezet</h3>
          <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
            placeholder="Fejezet címe..." autoFocus
            className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
          <textarea value={newContent} onChange={e => setNewContent(e.target.value)}
            placeholder="Tartalom (elhagyható)..." rows={5}
            className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-serif" />
          <div className="flex gap-2">
            <button onClick={cancelAdd}
              className="px-3 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 text-sm">
              Mégse
            </button>
            <button onClick={handleAddChapter} disabled={!newTitle.trim()}
              className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm disabled:opacity-50">
              Hozzáadás
            </button>
          </div>
        </div>
      )}

      {/* Chapter list */}
      <div className="space-y-3">
        {sortedChapters.length === 0 && !addingChapter && (
          <p className="text-center text-amber-400 py-6">
            Még nincsenek fejezetek. Adj hozzá egyet az "Új" gombra kattintva!
          </p>
        )}
        {sortedChapters.map((chapter, index) => (
          <div key={chapter.id} className="bg-white rounded-xl border border-amber-100 shadow-sm overflow-hidden">
            {editingChapterId === chapter.id ? (
              <div className="p-4 space-y-3">
                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold" />
                <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-serif text-sm" />
                <div className="flex gap-2">
                  <button onClick={() => setEditingChapterId(null)}
                    className="flex items-center gap-1 px-3 py-1.5 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 text-sm">
                    <X className="w-3.5 h-3.5" /> Mégse
                  </button>
                  <button onClick={saveEdit}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm">
                    <Save className="w-3.5 h-3.5" /> Mentés
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleChapterStatus(chapter)}
                    className={`flex-shrink-0 mt-0.5 ${chapter.status === 'finished' ? 'text-green-500' : 'text-amber-300'} hover:scale-110 transition-transform`}>
                    {chapter.status === 'finished' ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-400 font-medium">{index + 1}.</span>
                      <h4 className="font-semibold text-amber-900 break-words">{chapter.title}</h4>
                      {chapter.status === 'finished' && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Kész</span>
                      )}
                    </div>
                    {chapter.content && (
                      <p className="text-amber-600 text-sm line-clamp-2 mt-1">{chapter.content}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="flex flex-col">
                      <button onClick={() => moveChapter(index, 'up')} disabled={index === 0}
                        className="p-0.5 text-amber-400 hover:text-amber-700 disabled:opacity-20 transition-colors">
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button onClick={() => moveChapter(index, 'down')} disabled={index === sortedChapters.length - 1}
                        className="p-0.5 text-amber-400 hover:text-amber-700 disabled:opacity-20 transition-colors">
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    <button onClick={() => startEdit(chapter)}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if (confirm('Törlöd ezt a fejezetet?')) deleteChapter(bookId, chapter.id); }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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
