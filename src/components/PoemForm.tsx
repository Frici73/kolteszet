import { useState, useEffect } from 'react';
import { useStorage } from '../context/StorageContext';
import { toDateValue, todayDateValue, parseDateValue } from './DateInput';
import { TLabel, TInput, TTextarea, TButton, TRadio, TErrorBox, TWarning, TInfo, TFormHeader, TNumberInput } from './ThemedForm';
import { Check } from 'lucide-react';
import type { DateValue } from './DateInput';

interface PoemFormProps {
  poemId?: string;
  onCancel: () => void;
  onSave: () => void;
}

export function PoemForm({ poemId, onCancel, onSave }: PoemFormProps) {
  const { addPoem, updatePoem, getPoemById, hasPoemWithTitle, cycles, getCyclesForPoem, togglePoemInCycle } = useStorage();
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
  const [savedPoemId] = useState<string | undefined>(poemId);

  useEffect(() => {
    if (poemId) {
      const poem = getPoemById(poemId);
      if (poem) {
        setTitle(poem.title); setContent(poem.content);
        setThought((poem as any).thought || '');
        setDate(toDateValue(poem.date)); setStatus(poem.status);
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
      year:  isNaN(parseInt(date.year))  || parseInt(date.year)  < 1,
      month: isNaN(parseInt(date.month)) || parseInt(date.month) < 1 || parseInt(date.month) > 12,
      day:   isNaN(parseInt(date.day))   || parseInt(date.day)   < 1 || parseInt(date.day)   > 31,
    };
    setDateErrors(dErr);
    if (!parsed) errs.push('Érvénytelen dátum');
    setErrors(errs); return errs.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const parsed = parseDateValue(date)!;
    const data = { title: title.trim(), content: content.trim(), thought: thought.trim(), date: parsed, status };
    if (isEditing && poemId) updatePoem(poemId, data);
    else addPoem(data);
    onSave();
  };

  const currentCycles = savedPoemId ? getCyclesForPoem(savedPoemId) : [];
  const currentCycleIds = new Set(currentCycles.map(c => c.id));
  const filteredCycles = cycles.filter(c => c.title.toLowerCase().includes(cycleSearch.toLowerCase()));

  return (
    <div className="space-y-5">
      <TFormHeader title={isEditing ? 'Vers szerkesztése' : 'Új vers'} onBack={onCancel} />
      <TErrorBox errors={errors} />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <TLabel required>Cím</TLabel>
          <TInput value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Add meg a vers címét..." hasWarning={titleWarning} />
          {titleWarning && <TWarning>Már létezik ilyen című vers!</TWarning>}
        </div>

        {/* Thought */}
        <div>
          <TLabel optional>Gondolat</TLabel>
          <TTextarea value={thought} onChange={e => setThought(e.target.value)}
            placeholder="Pár soros gondolat a versről..." rows={2} />
        </div>

        {/* Date */}
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

        {/* Status */}
        <div>
          <TLabel>Állapot</TLabel>
          <div className="flex gap-4">
            <TRadio name="status" value="unfinished" checked={status === 'unfinished'} onChange={() => setStatus('unfinished')} label="Nincs kész" />
            <TRadio name="status" value="finished" checked={status === 'finished'} onChange={() => setStatus('finished')} label="Kész" />
          </div>
        </div>

        {/* Content */}
        <div>
          <TLabel required>Tartalom</TLabel>
          <TTextarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="Írd ide a versed..." rows={12}
            style={{ fontFamily: 'serif', lineHeight: '1.75' }} />
        </div>

        {/* Cycle linking */}
        {isEditing && savedPoemId && (
          <div>
            <TLabel>Ciklusok ({currentCycles.length} hozzárendelve)</TLabel>
            {currentCycles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {currentCycles.map(c => (
                  <button key={c.id} type="button" onClick={() => togglePoemInCycle(savedPoemId, c.id)}
                    className="flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors"
                    style={{ backgroundColor: 'var(--color-surface-border)', color: 'var(--color-text-secondary)' }}>
                    {c.title} <span>×</span>
                  </button>
                ))}
              </div>
            )}
            <TInput value={cycleSearch} onChange={e => setCycleSearch(e.target.value)}
              placeholder="Keresés ciklusok között..." style={{ marginBottom: '8px' }} />
            <div className="max-h-40 overflow-y-auto rounded-lg border divide-y"
              style={{ borderColor: 'var(--color-surface-border)' }}>
              {cycles.length === 0 ? (
                <p className="p-4 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>Még nincsenek ciklusaid.</p>
              ) : filteredCycles.length === 0 ? (
                <p className="p-4 text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>Nincs találat.</p>
              ) : filteredCycles.map(cycle => {
                const sel = currentCycleIds.has(cycle.id);
                return (
                  <button key={cycle.id} type="button" onClick={() => togglePoemInCycle(savedPoemId, cycle.id)}
                    className="w-full px-4 py-2 text-left flex items-center gap-3 transition-colors"
                    style={{ backgroundColor: sel ? 'var(--color-surface-border)' : 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface-border)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = sel ? 'var(--color-surface-border)' : 'transparent')}>
                    <div className="w-5 h-5 rounded border flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: sel ? 'var(--color-accent)' : 'transparent', borderColor: sel ? 'var(--color-accent)' : 'var(--color-surface-border)' }}>
                      {sel && <Check className="w-3 h-3" style={{ color: 'var(--color-accent-text)' }} />}
                    </div>
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)', fontWeight: sel ? 600 : 400 }}>{cycle.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!isEditing && cycles.length > 0 && (
          <TInfo>💡 Ciklus hozzárendeléshez mentsd el a verset, majd nyisd meg szerkesztésre.</TInfo>
        )}

        <div className="flex gap-3 pt-2">
          <TButton type="button" variant="secondary" onClick={onCancel}>Mégse</TButton>
          <TButton type="submit">{isEditing ? 'Mentés' : 'Létrehozás'}</TButton>
        </div>
      </form>
    </div>
  );
}
