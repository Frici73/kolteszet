import { useState, useEffect } from 'react';
import { useStorage } from '../context/StorageContext';
import { GenrePicker } from './GenrePicker';
import { toDateValue, todayDateValue, parseDateValue } from './DateInput';
import { TLabel, TInput, TTextarea, TButton, TRadio, TErrorBox, TFormHeader, TNumberInput } from './ThemedForm';
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
        setGenres(o.genres); setDate(toDateValue(o.date)); setStatus(o.status);
      }
    }
  }, [oneShotId, getOneShotById]);

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
    const data = { title: title.trim(), content: content.trim(), thought: thought.trim(), genres, date: parsed, status };
    if (isEditing && oneShotId) updateOneShot(oneShotId, data);
    else addOneShot(data);
    onSave();
  };

  return (
    <div className="space-y-5">
      <TFormHeader title={isEditing ? 'One-shot szerkesztése' : 'Új one-shot'} onBack={onCancel} />
      <TErrorBox errors={errors} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <TLabel required>Cím</TLabel>
          <TInput value={title} onChange={e => setTitle(e.target.value)} placeholder="One-shot címe..." />
        </div>

        <div>
          <TLabel optional>Gondolat</TLabel>
          <TTextarea value={thought} onChange={e => setThought(e.target.value)}
            placeholder="Pár soros gondolat a sztorihoz..." rows={2} />
        </div>

        <div>
          <TLabel>Műfajok (0 vagy több)</TLabel>
          <GenrePicker selected={genres} onChange={setGenres} />
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

        <div>
          <TLabel required>Tartalom</TLabel>
          <TTextarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="Írd ide a sztorit..." rows={14}
            style={{ fontFamily: 'serif', lineHeight: '1.75' }} />
        </div>

        <div className="flex gap-3 pt-2">
          <TButton type="button" variant="secondary" onClick={onCancel}>Mégse</TButton>
          <TButton type="submit">{isEditing ? 'Mentés' : 'Létrehozás'}</TButton>
        </div>
      </form>
    </div>
  );
}
