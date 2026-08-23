import { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { GenrePicker } from './GenrePicker';
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
  const [genres, setGenres] = useState<Genre[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [day, setDay] = useState(new Date().getDate());
  const [status, setStatus] = useState<'finished' | 'unfinished'>('unfinished');
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (oneShotId) {
      const o = getOneShotById(oneShotId);
      if (o) {
        setTitle(o.title); setContent(o.content); setGenres(o.genres);
        setYear(o.date.year); setMonth(o.date.month); setDay(o.date.day);
        setStatus(o.status);
      }
    }
  }, [oneShotId, getOneShotById]);

  const validate = () => {
    const e: string[] = [];
    if (!title.trim()) e.push('A cím megadása kötelező');
    if (!content.trim()) e.push('A tartalom megadása kötelező');
    setErrors(e);
    return e.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const data = { title: title.trim(), content: content.trim(), genres, date: { year, month, day }, status };
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
        <h2 className="text-xl font-bold text-amber-900">
          {isEditing ? 'One-shot szerkesztése' : 'Új one-shot'}
        </h2>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
            <AlertCircle className="w-5 h-5" /> Hibák:
          </div>
          <ul className="list-disc list-inside text-red-600 text-sm">
            {errors.map((err, i) => <li key={i}>{err}</li>)}
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
          <label className="block text-sm font-medium text-amber-700 mb-2">Műfajok (0 vagy több)</label>
          <GenrePicker selected={genres} onChange={setGenres} />
        </div>

        <div>
          <label className="block text-sm font-medium text-amber-700 mb-1">Dátum</label>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-amber-500">Év</label>
              <input type="number" value={year} onChange={e => setYear(+e.target.value)} min={1} max={9999}
                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
            <div><label className="text-xs text-amber-500">Hónap</label>
              <input type="number" value={month} onChange={e => setMonth(+e.target.value)} min={1} max={12}
                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
            <div><label className="text-xs text-amber-500">Nap</label>
              <input type="number" value={day} onChange={e => setDay(+e.target.value)} min={1} max={31}
                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
          </div>
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
            className="flex-1 px-4 py-3 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors font-medium">
            Mégse
          </button>
          <button type="submit"
            className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium">
            {isEditing ? 'Mentés' : 'Létrehozás'}
          </button>
        </div>
      </form>
    </div>
  );
}
