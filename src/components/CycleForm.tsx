import { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Check } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { DateInput, toDateValue, todayDateValue, parseDateValue } from './DateInput';
import type { DateValue } from './DateInput';

interface CycleFormProps {
  cycleId?: string;
  onCancel: () => void;
  onSave: () => void;
}

export function CycleForm({ cycleId, onCancel, onSave }: CycleFormProps) {
  const { poems, addCycle, updateCycle, getCycleById, getPoemsByIds } = useStorage();
  const isEditing = !!cycleId;

  const [title, setTitle] = useState('');
  const [thought, setThought] = useState('');
  const [date, setDate] = useState<DateValue>(todayDateValue());
  const [status, setStatus] = useState<'finished' | 'unfinished'>('unfinished');
  const [selectedPoemIds, setSelectedPoemIds] = useState<string[]>([]);
  const [poemSearch, setPoemSearch] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [dateErrors, setDateErrors] = useState<{ year?: boolean; month?: boolean; day?: boolean }>({});

  useEffect(() => {
    if (cycleId) {
      const cycle = getCycleById(cycleId);
      if (cycle) {
        setTitle(cycle.title);
        setThought(cycle.thought || '');
        setDate(toDateValue(cycle.date));
        setStatus(cycle.status);
        setSelectedPoemIds(cycle.poemIds);
      }
    }
  }, [cycleId, getCycleById]);

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

  const togglePoem = (id: string) => {
    setSelectedPoemIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const parsed = parseDateValue(date)!;
    const data = { title: title.trim(), thought: thought.trim(), date: parsed, status, poemIds: selectedPoemIds };
    if (isEditing && cycleId) updateCycle(cycleId, data);
    else addCycle(data);
    onSave();
  };

  const filteredPoems = poems.filter(p =>
    p.title.toLowerCase().includes(poemSearch.toLowerCase()) ||
    p.content.toLowerCase().includes(poemSearch.toLowerCase())
  );
  const selectedPoems = getPoemsByIds(selectedPoemIds);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onCancel} className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-amber-900">{isEditing ? 'Ciklus szerkesztése' : 'Új ciklus'}</h2>
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
            placeholder="Add meg a ciklus címét..."
            className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>

        {/* Thought (optional) */}
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-1">
            Gondolat <span className="text-amber-400 text-xs font-normal">(opcionális)</span>
          </label>
          <textarea value={thought} onChange={e => setThought(e.target.value)}
            placeholder="Pár soros gondolat a ciklushoz..."
            rows={3}
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

        {/* Poem selection */}
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-2">
            Versek hozzáadása ({selectedPoemIds.length} kiválasztva)
          </label>
          {selectedPoems.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedPoems.map(p => (
                <button key={p.id} type="button" onClick={() => togglePoem(p.id)}
                  className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm hover:bg-amber-200 transition-colors">
                  {p.title} <span className="text-amber-600">×</span>
                </button>
              ))}
            </div>
          )}
          <input type="text" placeholder="Keresés versek között..."
            value={poemSearch} onChange={e => setPoemSearch(e.target.value)}
            className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 mb-2" />
          <div className="max-h-48 overflow-y-auto border border-amber-200 rounded-lg divide-y divide-amber-100">
            {poems.length === 0 ? (
              <p className="p-4 text-amber-500 text-center text-sm">Még nincsenek verseid.</p>
            ) : filteredPoems.length === 0 ? (
              <p className="p-4 text-amber-500 text-center text-sm">Nincs találat.</p>
            ) : filteredPoems.map(poem => {
              const sel = selectedPoemIds.includes(poem.id);
              return (
                <button key={poem.id} type="button" onClick={() => togglePoem(poem.id)}
                  className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-amber-50 transition-colors ${sel ? 'bg-amber-50' : ''}`}>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${sel ? 'bg-amber-500 border-amber-500' : 'border-amber-300'}`}>
                    {sel && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-sm ${sel ? 'text-amber-900 font-medium' : 'text-amber-700'}`}>{poem.title}</span>
                </button>
              );
            })}
          </div>
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
