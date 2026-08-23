/**
 * Dátum beviteli mező komponens.
 * A value string-ként van tárolva, így nem ugrik be 1-es,
 * ha a felhasználó törli a számot szerkesztés közben.
 * Mentéskor a validate() ellenőrzi, hogy érvényes-e.
 */

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  hasError?: boolean;
}

function DateField({ label, value, onChange, min, hasError }: DateFieldProps) {
  return (
    <div>
      <label className="text-xs text-amber-500">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={e => {
          // Csak blur-kor töltjük ki a minimummal, ha üres maradt
          if (e.target.value === '' || e.target.value === '-') {
            onChange(String(min));
          }
        }}
        placeholder={label}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
          hasError ? 'border-red-400 bg-red-50' : 'border-amber-200'
        }`}
      />
    </div>
  );
}

export interface DateValue {
  year: string;
  month: string;
  day: string;
}

interface DateInputProps {
  value: DateValue;
  onChange: (v: DateValue) => void;
  errors?: { year?: boolean; month?: boolean; day?: boolean };
}

export function DateInput({ value, onChange, errors }: DateInputProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <DateField label="Év" value={value.year}
        onChange={v => onChange({ ...value, year: v })}
        min={1} max={9999} hasError={errors?.year} />
      <DateField label="Hónap" value={value.month}
        onChange={v => onChange({ ...value, month: v })}
        min={1} max={12} hasError={errors?.month} />
      <DateField label="Nap" value={value.day}
        onChange={v => onChange({ ...value, day: v })}
        min={1} max={31} hasError={errors?.day} />
    </div>
  );
}

/** Konvertál egy { year, month, day } number objektumot DateValue stringgé */
export function toDateValue(d: { year: number; month: number; day: number }): DateValue {
  return { year: String(d.year), month: String(d.month), day: String(d.day) };
}

/** Validálja és konvertálja DateValue-t number objektummá. Hibák esetén null-t ad vissza. */
export function parseDateValue(d: DateValue): { year: number; month: number; day: number } | null {
  const year = parseInt(d.year);
  const month = parseInt(d.month);
  const day = parseInt(d.day);
  if (isNaN(year) || year < 1 || year > 9999) return null;
  if (isNaN(month) || month < 1 || month > 12) return null;
  if (isNaN(day) || day < 1 || day > 31) return null;
  return { year, month, day };
}

/** Mai dátum mint DateValue */
export function todayDateValue(): DateValue {
  const now = new Date();
  return {
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1),
    day: String(now.getDate()),
  };
}
