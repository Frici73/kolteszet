import { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useStorage } from '../context/StorageContext';

interface PoemFormProps {
  poemId?: string;
  onCancel: () => void;
  onSave: () => void;
}

export function PoemForm({ poemId, onCancel, onSave }: PoemFormProps) {
  const { addPoem, updatePoem, getPoemById, hasPoemWithTitle } = useStorage();
  const isEditing = !!poemId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [day, setDay] = useState(new Date().getDate());
  const [status, setStatus] = useState<'finished' | 'unfinished'>('unfinished');
  const [titleWarning, setTitleWarning] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Load existing poem data
  useEffect(() => {
    if (poemId) {
      const poem = getPoemById(poemId);
      if (poem) {
        setTitle(poem.title);
        setContent(poem.content);
        setYear(poem.date.year);
        setMonth(poem.date.month);
        setDay(poem.date.day);
        setStatus(poem.status);
      }
    }
  }, [poemId, getPoemById]);

  // Check for duplicate title
  useEffect(() => {
    if (title.trim()) {
      const exists = hasPoemWithTitle(title, poemId);
      setTitleWarning(exists);
    } else {
      setTitleWarning(false);
    }
  }, [title, poemId, hasPoemWithTitle]);

  const validate = (): boolean => {
    const newErrors: string[] = [];
    if (!title.trim()) newErrors.push('A cím megadása kötelező');
    if (!content.trim()) newErrors.push('A tartalom megadása kötelező');
    if (year < 1 || year > 9999) newErrors.push('Érvénytelen év');
    if (month < 1 || month > 12) newErrors.push('Érvénytelen hónap');
    if (day < 1 || day > 31) newErrors.push('Érvénytelen nap');
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const poemData = {
      title: title.trim(),
      content: content.trim(),
      date: { year, month, day },
      status,
    };

    if (isEditing && poemId) {
      updatePoem(poemId, poemData);
    } else {
      addPoem(poemData);
    }
    onSave();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onCancel}
          className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-amber-900">
          {isEditing ? 'Vers szerkesztése' : 'Új vers'}
        </h2>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
            <AlertCircle className="w-5 h-5" />
            Kérlek javítsd a következő hibákat:
          </div>
          <ul className="list-disc list-inside text-red-600 text-sm">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-1">
            Cím <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add meg a vers címét..."
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              titleWarning
                ? 'border-orange-400 focus:ring-orange-500 bg-orange-50'
                : 'border-amber-200 focus:ring-amber-500'
            }`}
          />
          {titleWarning && (
            <p className="mt-1 text-sm text-orange-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Már létezik ilyen című vers!
            </p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-1">
            Dátum
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-amber-500">Év</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || 0)}
                min={1}
                max={9999}
                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-amber-500">Hónap</label>
              <input
                type="number"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value) || 1)}
                min={1}
                max={12}
                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-amber-500">Nap</label>
              <input
                type="number"
                value={day}
                onChange={(e) => setDay(parseInt(e.target.value) || 1)}
                min={1}
                max={31}
                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-2">
            Állapot
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="unfinished"
                checked={status === 'unfinished'}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="w-4 h-4 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-amber-700">Nincs kész</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="finished"
                checked={status === 'finished'}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="w-4 h-4 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-amber-700">Kész</span>
            </label>
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-1">
            Tartalom <span className="text-red-500">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Írd ide a versed..."
            rows={12}
            className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-serif leading-relaxed"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors font-medium"
          >
            Mégse
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            {isEditing ? 'Mentés' : 'Létrehozás'}
          </button>
        </div>
      </form>
    </div>
  );
}
