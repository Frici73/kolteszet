import { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { GenrePicker } from './GenrePicker';
import { DateInput, toDateValue, todayDateValue, parseDateValue } from './DateInput';
import type { DateValue } from './DateInput';
import type { Genre } from '../types';

interface OneShotFormProps {
  oneShotId?: string;
  onCancel: () => void;
  onSave: () => void;
}

export function OneShotForm({ oneShotId, onCancel, onSave }: OneShotFormProps) {
  const { addOneShot, updateOneShot, getOneShotById } = useStorage();
  const isEditing = !!oneShotId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [thought, setThought] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [date, setDate] = useState<DateValue>(todayDateValue());
  const [status, setStatus] = useState<'finished' | 'unfinished'>('unfinished');
  const [errors, setErrors] = useState<string[]>([]);
  const [dateErrors, setDateErrors] = useState<{ year?: boolean; month?: boolean; day?: boolean }>({});

  useEffect(() => {
    if (oneShotId) {
      const o = getOneShotById(oneShotId);
      if (o) {
        setTitle(o.title); setContent(o.content);
        setThought((o as any).thought || '');
        setGenres(o.genres);
        setDate(toDateValue(o.date));
        setStatus(o.status);
      }
    }
  }, [oneShotId, getOneShotById]);

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!title.trim()) errs.push('A cím megadása kötelező');
    if (!content.trim()) errs.push('A tartalom megadása kötelező');
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
    const data = { title: title.trim(), content: content.trim(), thought: thought.trim(), genres, date: parsed, status };
    if (isEditing && oneShotId) updateOneShot(oneShotId, data);
    else addOneShot(data);
    onSave();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onCancel} className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-amber-900">{isEditing ? 'One-shot szerkesztése' : 'Új one-shot'}</h2>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
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
            placeholder="One-shot címe..."
            className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-700 mb-1">
            Gondolat <span className="text-amber-400 text-xs font-normal">(opcionális)</span>
          </label>
          <textarea value={thought} onChange={e => setThought(e.target.value)}
            placeholder="Pár soros gondolat a sztorihoz..."
            rows={2}
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

        <div>
          <label className="block text-sm font-medium text-amber-700 mb-1">Tartalom <span className="text-red-500">*</span></label>
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="Írd ide a sztorit..."
            rows={14}
            className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-serif leading-relaxed" />
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
