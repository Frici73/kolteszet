import { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { GenrePicker } from './GenrePicker';
import { DateInput, toDateValue, todayDateValue, parseDateValue } from './DateInput';
import type { DateValue } from './DateInput';
import type { Genre } from '../types';

interface BookFormProps {
  bookId?: string;
  onCancel: () => void;
  onSave: (id: string) => void;
}

export function BookForm({ bookId, onCancel, onSave }: BookFormProps) {
  const { addBook, updateBook, getBookById } = useStorage();
  const isEditing = !!bookId;

  const [title, setTitle] = useState('');
  const [thought, setThought] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [date, setDate] = useState<DateValue>(todayDateValue());
  const [status, setStatus] = useState<'finished' | 'unfinished'>('unfinished');
  const [errors, setErrors] = useState<string[]>([]);
  const [dateErrors, setDateErrors] = useState<{ year?: boolean; month?: boolean; day?: boolean }>({});

  useEffect(() => {
    if (bookId) {
      const b = getBookById(bookId);
      if (b) {
        setTitle(b.title); setThought(b.thought || ''); setGenres(b.genres);
        setDate(toDateValue(b.date)); setStatus(b.status);
      }
    }
  }, [bookId, getBookById]);

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!title.trim()) errs.push('A cím megadása kötelező');
    const parsed = parseDateValue(date);
    const dErr = {
      year: isNaN(parseInt(date.year)) || parseInt(date.year) < 1,
      month: isNaN(parseInt(date.month)) || parseInt(date.month) < 1 || parseInt(date.month) > 12,
      day: isNaN(parseInt(date.day)) || parseInt(date.day) < 1 || parseInt(date.day) > 31,
    };
    setDateErrors(dErr);
    if (!parsed) errs.push('Érvénytelen dátum');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const parsed = parseDateValue(date)!;
    if (isEditing && bookId) {
      updateBook(bookId, { title: title.trim(), thought: thought.trim(), genres, date: parsed, status });
      onSave(bookId);
    } else {
      const book = addBook({ title: title.trim(), thought: thought.trim(), genres, date: parsed, status, chapters: [] });
      onSave(book.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onCancel} className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-amber-900">{isEditing ? 'Könyv szerkesztése' : 'Új könyv'}</h2>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
            <AlertCircle className="w-5 h-5" /> Hibák:
          </div>
          <ul className="list-disc list-inside text-red-600 text-sm">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-1">Cím <span className="text-red-500">*</span></label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Könyv címe..."
            className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-700 mb-1">
            Gondolat / szinopszis <span className="text-amber-400 text-xs font-normal">(opcionális)</span>
          </label>
          <textarea value={thought} onChange={e => setThought(e.target.value)}
            placeholder="Rövid gondolat a könyvről..."
            rows={3}
            className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-700 mb-2">Műfajok (0 vagy több)</label>
          <GenrePicker selected={genres} onChange={setGenres} />
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-700 mb-1">Dátum</label>
          <DateInput value={date} onChange={setDate} errors={dateErrors} />
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-700 mb-2">Állapot</label>
          <div className="flex gap-4">
            {(['unfinished', 'finished'] as const).map(s => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value={s} checked={status === s}
                  onChange={() => setStatus(s)} className="w-4 h-4 text-amber-600" />
                <span className="text-amber-700">{s === 'finished' ? 'Kész' : 'Nincs kész'}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel}
            className="flex-1 px-4 py-3 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors font-medium">Mégse</button>
          <button type="submit"
            className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium">
            {isEditing ? 'Mentés' : 'Létrehozás'}
          </button>
        </div>
      </form>
    </div>
  );
}
