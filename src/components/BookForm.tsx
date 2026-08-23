import { useState, useEffect } from 'react';
import { useStorage } from '../context/StorageContext';
import { GenrePicker } from './GenrePicker';
import { toDateValue, todayDateValue, parseDateValue } from './DateInput';
import { TLabel, TInput, TTextarea, TButton, TRadio, TErrorBox, TFormHeader, TDateTriplet } from './ThemedForm';
import type { DateValue } from './DateInput';
import type { Genre } from '../types';

interface BookFormProps {
  bookId?: string;
  onCancel: () => void;
  onSave: (id: string) => void;
}

type DateErrors = { year?: boolean; month?: boolean; day?: boolean };

export function BookForm({ bookId, onCancel, onSave }: BookFormProps) {
  const { addBook, updateBook, getBookById } = useStorage();
  const isEditing = !!bookId;

  const [title, setTitle] = useState('');
  const [thought, setThought] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [startDate, setStartDate] = useState<DateValue>(todayDateValue());
  const [endDate, setEndDate] = useState<DateValue>(todayDateValue());
  const [status, setStatus] = useState<'finished' | 'unfinished'>('unfinished');
  const [errors, setErrors] = useState<string[]>([]);
  const [startDateErrors, setStartDateErrors] = useState<DateErrors>({});
  const [endDateErrors, setEndDateErrors] = useState<DateErrors>({});

  useEffect(() => {
    if (bookId) {
      const b = getBookById(bookId);
      if (b) {
        setTitle(b.title); setThought(b.thought || ''); setGenres(b.genres);
        setStartDate(toDateValue(b.startDate));
        setEndDate(toDateValue(b.endDate));
        setStatus(b.status);
      }
    }
  }, [bookId, getBookById]);

  const validateDate = (d: DateValue): DateErrors => ({
    year:  isNaN(parseInt(d.year))  || parseInt(d.year)  < 1,
    month: isNaN(parseInt(d.month)) || parseInt(d.month) < 1 || parseInt(d.month) > 12,
    day:   isNaN(parseInt(d.day))   || parseInt(d.day)   < 1 || parseInt(d.day)   > 31,
  });

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!title.trim()) errs.push('A cím megadása kötelező');

    const parsedStart = parseDateValue(startDate);
    const sErr = validateDate(startDate);
    setStartDateErrors(sErr);
    if (!parsedStart) errs.push('Érvénytelen "írás kezdete" dátum');

    const parsedEnd = parseDateValue(endDate);
    const eErr = validateDate(endDate);
    setEndDateErrors(eErr);
    if (!parsedEnd) errs.push('Érvénytelen "írás befejezése" dátum');

    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const parsedStart = parseDateValue(startDate)!;
    const parsedEnd = parseDateValue(endDate)!;
    if (isEditing && bookId) {
      updateBook(bookId, { title: title.trim(), thought: thought.trim(), genres, startDate: parsedStart, endDate: parsedEnd, status });
      onSave(bookId);
    } else {
      const book = addBook({ title: title.trim(), thought: thought.trim(), genres, startDate: parsedStart, endDate: parsedEnd, status, chapters: [] });
      onSave(book.id);
    }
  };

  return (
    <div className="space-y-5">
      <TFormHeader title={isEditing ? 'Könyv szerkesztése' : 'Új könyv'} onBack={onCancel} />
      <TErrorBox errors={errors} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <TLabel required>Cím</TLabel>
          <TInput value={title} onChange={e => setTitle(e.target.value)} placeholder="Könyv címe..." />
        </div>

        <div>
          <TLabel optional>Gondolat / szinopszis</TLabel>
          <TTextarea value={thought} onChange={e => setThought(e.target.value)}
            placeholder="Rövid gondolat a könyvről..." rows={3} />
        </div>

        <div>
          <TLabel>Műfajok (0 vagy több)</TLabel>
          <GenrePicker selected={genres} onChange={setGenres} />
        </div>

        <TDateTriplet label="Írás kezdete" value={startDate} onChange={setStartDate} errors={startDateErrors} />
        <TDateTriplet label="Írás befejezése" value={endDate} onChange={setEndDate} errors={endDateErrors} />

        <div>
          <TLabel>Állapot</TLabel>
          <div className="flex gap-4">
            <TRadio name="status" value="unfinished" checked={status === 'unfinished'} onChange={() => setStatus('unfinished')} label="Nincs kész" />
            <TRadio name="status" value="finished" checked={status === 'finished'} onChange={() => setStatus('finished')} label="Kész" />
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
