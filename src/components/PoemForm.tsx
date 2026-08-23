import { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Check } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { DateInput, toDateValue, todayDateValue, parseDateValue } from './DateInput';
import type { DateValue } from './DateInput';

interface PoemFormProps {
  poemId?: string;
  onCancel: () => void;
  onSave: () => void;
}

export function PoemForm({ poemId, onCancel, onSave }: PoemFormProps) {
  const {
    addPoem, updatePoem, getPoemById, hasPoemWithTitle,
    cycles, getCyclesForPoem, togglePoemInCycle,
  } = useStorage();
  const isEditing = !!poemId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [thought, setThought] = useState('');
  const [date, setDate] = useState<DateValue>(todayDateValue());
  const [status, setStatus] = useState<'finished' | 'unfinished'>('unfinished');
  const [titleWarning, setTitleWarning] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [dateErrors, setDateErrors] = useState<{ year?: boolean; month?: boolean; day?: boolean }>({});
  const [cycleSearch, setCycleSearch] = useState('');

  // Saved poem id after creation (needed for cycle linking before save)
  const [savedPoemId, setSavedPoemId] = useState<string | undefined>(poemId);

  useEffect(() => {
    if (poemId) {
      const poem = getPoemById(poemId);
      if (poem) {
        setTitle(poem.title);
        setContent(poem.content);
        setThought((poem as any).thought || '');
        setDate(toDateValue(poem.date));
        setStatus(poem.status);
        setSavedPoemId(poemId);
      }
    }
  }, [poemId, getPoemById]);

  useEffect(() => {
    setTitleWarning(title.trim() ? hasPoemWithTitle(title, poemId) : false);
  }, [title, poemId, hasPoemWithTitle]);

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
    const data = { title: title.trim(), content: content.trim(), thought: thought.trim(), date: parsed, status };
    if (isEditing && poemId) {
      updatePoem(poemId, data);
    } else {
      addPoem(data);
    }
    onSave();
  };

  // Ciklus párosítás: csak szerkesztési módban érhető el azonnal.
  // Új versnél a mentés után lehet ciklust hozzáadni a ciklus szerkesztőn keresztül.
  const currentCycles = savedPoemId ? getCyclesForPoem(savedPoemId) : [];
  const currentCycleIds = new Set(currentCycles.map(c => c.id));

  const filteredCycles = cycles.filter(c =>
    c.title.toLowerCase().includes(cycleSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onCancel} className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-amber-900">{isEditing ? 'Vers szerkesztése' : 'Új vers'}</h2>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
            <AlertCircle className="w-5 h-5" /> Kérlek javítsd a következő hibákat:
          </div>
          <ul className="list-disc list-inside text-red-600 text-sm">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-1">
            Cím <span className="text-red-500">*</span>
          </label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Add meg a vers címét..."
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              titleWarning ? 'border-orange-400 focus:ring-orange-500 bg-orange-50' : 'border-amber-200 focus:ring-amber-500'
            }`} />
          {titleWarning && (
            <p className="mt-1 text-sm text-orange-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" /> Már létezik ilyen című vers!
            </p>
          )}
        </div>

        {/* Thought (optional) */}
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-1">
            Gondolat <span className="text-amber-400 text-xs font-normal">(opcionális)</span>
          </label>
          <textarea value={thought} onChange={e => setThought(e.target.value)}
            placeholder="Pár soros gondolat a versről..."
            rows={2}
            className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-1">Dátum</label>
          <DateInput value={date} onChange={setDate} errors={dateErrors} />
        </div>

        {/* Status */}
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

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-1">
            Tartalom <span className="text-red-500">*</span>
          </label>
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="Írd ide a versed..."
            rows={12}
            className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-serif leading-relaxed" />
        </div>

        {/* Cycle linking — only when editing an existing poem */}
        {isEditing && savedPoemId && (
          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">
              Ciklusok ({currentCycles.length} hozzárendelve)
            </label>

            {/* Selected cycle chips */}
            {currentCycles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {currentCycles.map(c => (
                  <button key={c.id} type="button"
                    onClick={() => togglePoemInCycle(savedPoemId, c.id)}
                    className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm hover:bg-amber-200 transition-colors">
                    {c.title} <span className="text-amber-600">×</span>
                  </button>
                ))}
              </div>
            )}

            <input type="text" placeholder="Keresés ciklusok között..."
              value={cycleSearch} onChange={e => setCycleSearch(e.target.value)}
              className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 mb-2" />

            <div className="max-h-40 overflow-y-auto border border-amber-200 rounded-lg divide-y divide-amber-100">
              {cycles.length === 0 ? (
                <p className="p-4 text-amber-500 text-center text-sm">Még nincsenek ciklusaid.</p>
              ) : filteredCycles.length === 0 ? (
                <p className="p-4 text-amber-500 text-center text-sm">Nincs találat.</p>
              ) : filteredCycles.map(cycle => {
                const selected = currentCycleIds.has(cycle.id);
                return (
                  <button key={cycle.id} type="button"
                    onClick={() => togglePoemInCycle(savedPoemId, cycle.id)}
                    className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-amber-50 transition-colors ${selected ? 'bg-amber-50' : ''}`}>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${selected ? 'bg-amber-500 border-amber-500' : 'border-amber-300'}`}>
                      {selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm ${selected ? 'text-amber-900 font-medium' : 'text-amber-700'}`}>
                      {cycle.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!isEditing && cycles.length > 0 && (
          <p className="text-xs text-amber-400 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            💡 Ciklus hozzárendeléshez mentsd el a verset, majd nyisd meg szerkesztésre.
          </p>
        )}

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
