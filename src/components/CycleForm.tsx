import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { toDateValue, todayDateValue, parseDateValue } from './DateInput';
import { TLabel, TInput, TTextarea, TButton, TRadio, TErrorBox, TFormHeader, TNumberInput } from './ThemedForm';
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
        setTitle(cycle.title); setThought(cycle.thought || '');
        setDate(toDateValue(cycle.date)); setStatus(cycle.status);
        setSelectedPoemIds(cycle.poemIds);
      }
    }
  }, [cycleId, getCycleById]);

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!title.trim()) errs.push('A cím megadása kötelező');
    const parsed = parseDateValue(date);
    const dErr = {
      year:  isNaN(parseInt(date.year))  || parseInt(date.year)  < 1,
      month: isNaN(parseInt(date.month)) || parseInt(date.month) < 1 || parseInt(date.month) > 12,
      day:   isNaN(parseInt(date.day))   || parseInt(date.day)   < 1 || parseInt(date.day)   > 31,
    };
    setDateErrors(dErr);
    if (!parsed) errs.push('Érvénytelen dátum');
    setErrors(errs); return errs.length === 0;
  };

  const togglePoem = (id: string) =>
    setSelectedPoemIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

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
    <div className="space-y-5">
      <TFormHeader title={isEditing ? 'Ciklus szerkesztése' : 'Új ciklus'} onBack={onCancel} />
      <TErrorBox errors={errors} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <TLabel required>Cím</TLabel>
          <TInput value={title} onChange={e => setTitle(e.target.value)} placeholder="Add meg a ciklus címét..." />
        </div>

        <div>
          <TLabel optional>Gondolat</TLabel>
          <TTextarea value={thought} onChange={e => setThought(e.target.value)}
            placeholder="Pár soros gondolat a ciklushoz..." rows={3} />
        </div>

        <div>
          <TLabel>Dátum</TLabel>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Év</span>
              <TNumberInput value={date.year} onChange={e => setDate(d => ({ ...d, year: e.target.value }))}
                onBlur={e => { if (!e.target.value) setDate(d => ({ ...d, year: '1' })); }}
                min={1} max={9999} hasError={dateErrors.year} />
            </div>
            <div>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Hónap</span>
              <TNumberInput value={date.month} onChange={e => setDate(d => ({ ...d, month: e.target.value }))}
                onBlur={e => { if (!e.target.value) setDate(d => ({ ...d, month: '1' })); }}
                min={1} max={12} hasError={dateErrors.month} />
            </div>
            <div>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Nap</span>
              <TNumberInput value={date.day} onChange={e => setDate(d => ({ ...d, day: e.target.value }))}
                onBlur={e => { if (!e.target.value) setDate(d => ({ ...d, day: '1' })); }}
                min={1} max={31} hasError={dateErrors.day} />
            </div>
          </div>
        </div>

        <div>
          <TLabel>Állapot</TLabel>
          <div className="flex gap-4">
            <TRadio name="status" value="unfinished" checked={status === 'unfinished'} onChange={() => setStatus('unfinished')} label="Nincs kész" />
            <TRadio name="status" value="finished" checked={status === 'finished'} onChange={() => setStatus('finished')} label="Kész" />
          </div>
        </div>

        {/* Poem selection */}
        <div>
          <TLabel>Versek hozzáadása ({selectedPoemIds.length} kiválasztva)</TLabel>
          {selectedPoems.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedPoems.map(p => (
                <button key={p.id} type="button" onClick={() => togglePoem(p.id)}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                  style={{ backgroundColor: 'var(--color-surface-border)', color: 'var(--color-text-secondary)' }}>
                  {p.title} <span>×</span>
                </button>
              ))}
            </div>
          )}
          <TInput value={poemSearch} onChange={e => setPoemSearch(e.target.value)}
            placeholder="Keresés versek között..." style={{ marginBottom: '8px' }} />
          <div className="max-h-48 overflow-y-auto rounded-lg border divide-y"
            style={{ borderColor: 'var(--color-surface-border)' }}>
            {poems.length === 0 ? (
              <p className="p-4 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>Még nincsenek verseid.</p>
            ) : filteredPoems.length === 0 ? (
              <p className="p-4 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>Nincs találat.</p>
            ) : filteredPoems.map(poem => {
              const sel = selectedPoemIds.includes(poem.id);
              return (
                <button key={poem.id} type="button" onClick={() => togglePoem(poem.id)}
                  className="w-full px-4 py-2 text-left flex items-center gap-3 transition-colors"
                  style={{ backgroundColor: sel ? 'var(--color-surface-border)' : 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface-border)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = sel ? 'var(--color-surface-border)' : 'transparent')}>
                  <div className="w-5 h-5 rounded border flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: sel ? 'var(--color-accent)' : 'transparent', borderColor: sel ? 'var(--color-accent)' : 'var(--color-surface-border)' }}>
                    {sel && <Check className="w-3 h-3" style={{ color: 'var(--color-accent-text)' }} />}
                  </div>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)', fontWeight: sel ? 600 : 400 }}>{poem.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <TButton type="button" variant="secondary" onClick={onCancel}>Mégse</TButton>
          <TButton type="submit">{isEditing ? 'Mentés' : 'Létrehozás'}</TButton>
        </div>
      </form>
    </div>
  );
}
