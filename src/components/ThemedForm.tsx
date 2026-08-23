/**
 * Témafüggő form alap-stílusok.
 * Inline CSS változókkal, nem hardcoded Tailwind osztályokkal.
 */

import React from 'react';

// ── Input / Textarea közös stílusok ──────────────────────────────────────
const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '8px 16px',
  borderRadius: '8px',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'var(--color-surface-border)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
  fontSize: '14px',
  outline: 'none',
};

const focusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-accent)';
    e.currentTarget.style.borderColor = 'var(--color-accent)';
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.boxShadow = '';
    e.currentTarget.style.borderColor = 'var(--color-surface-border)';
  },
};

// ── Components ────────────────────────────────────────────────────────────

interface LabelProps {
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
}

export function TLabel({ children, required, optional }: LabelProps) {
  return (
    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
      {optional && <span className="text-xs font-normal ml-1" style={{ color: 'var(--color-text-muted)' }}>(opcionális)</span>}
    </label>
  );
}

interface TInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasWarning?: boolean;
}

export function TInput({ hasWarning, style, ...props }: TInputProps) {
  const warningStyle: React.CSSProperties = hasWarning
    ? { borderColor: '#f97316', backgroundColor: '#fff7ed' }
    : {};
  return (
    <input
      {...props}
      style={{ ...inputBase, ...warningStyle, ...style }}
      {...focusHandlers}
    />
  );
}

interface TTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function TTextarea({ style, ...props }: TTextareaProps) {
  return (
    <textarea
      {...props}
      style={{ ...inputBase, padding: '12px 16px', ...style }}
      {...focusHandlers}
    />
  );
}

interface TSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export function TSelect({ style, children, ...props }: TSelectProps) {
  return (
    <select
      {...props}
      style={{ ...inputBase, padding: '8px 16px', ...style }}
      {...focusHandlers}
    >
      {children}
    </select>
  );
}

interface TNumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function TNumberInput({ hasError, style, ...props }: TNumberInputProps) {
  const errorStyle: React.CSSProperties = hasError
    ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' }
    : {};
  return (
    <input
      type="number"
      {...props}
      style={{ ...inputBase, padding: '8px 12px', ...errorStyle, ...style }}
      {...focusHandlers}
    />
  );
}

interface TButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export function TButton({ variant = 'primary', style, children, ...props }: TButtonProps) {
  const variantStyle: React.CSSProperties =
    variant === 'primary'
      ? { backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-text)' }
      : variant === 'secondary'
      ? { backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)', borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--color-surface-border)' }
      : { backgroundColor: '#ef4444', color: '#ffffff' };

  return (
    <button
      {...props}
      style={{
        flex: 1,
        padding: '12px 16px',
        borderRadius: '8px',
        fontWeight: 500,
        fontSize: '14px',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.5 : 1,
        transition: 'opacity 0.15s',
        ...variantStyle,
        ...style,
      }}
      onMouseEnter={e => {
        if (!props.disabled) e.currentTarget.style.opacity = '0.85';
      }}
      onMouseLeave={e => {
        if (!props.disabled) e.currentTarget.style.opacity = '1';
      }}
    >
      {children}
    </button>
  );
}

interface TRadioProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}

export function TRadio({ name, value, checked, onChange, label }: TRadioProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4"
        style={{ accentColor: 'var(--color-accent)' }}
      />
      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
    </label>
  );
}

interface TFormSectionProps {
  children: React.ReactNode;
}

export function TFormCard({ children }: TFormSectionProps) {
  return (
    <div className="space-y-5">
      {children}
    </div>
  );
}

interface TErrorBoxProps {
  errors: string[];
}

export function TErrorBox({ errors }: TErrorBoxProps) {
  if (!errors.length) return null;
  return (
    <div className="rounded-lg p-4 border" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}>
      <div className="flex items-center gap-2 font-medium mb-2 text-sm">
        ⚠️ Kérlek javítsd a következő hibákat:
      </div>
      <ul className="list-disc list-inside text-sm space-y-0.5">
        {errors.map((e, i) => <li key={i}>{e}</li>)}
      </ul>
    </div>
  );
}

interface TWarningProps {
  children: React.ReactNode;
}

export function TWarning({ children }: TWarningProps) {
  return (
    <p className="mt-1 text-sm flex items-center gap-1" style={{ color: '#f97316' }}>
      ⚠️ {children}
    </p>
  );
}

interface TInfoProps {
  children: React.ReactNode;
}

export function TInfo({ children }: TInfoProps) {
  return (
    <p className="text-xs rounded-lg px-3 py-2 border"
      style={{ backgroundColor: 'var(--color-surface-border)', color: 'var(--color-text-muted)', borderColor: 'var(--color-surface-border)' }}>
      {children}
    </p>
  );
}

// ── Back header ───────────────────────────────────────────────────────────
interface TFormHeaderProps {
  title: string;
  onBack: () => void;
}

export function TFormHeader({ title, onBack }: TFormHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onBack}
        className="p-2 rounded-lg transition-colors hover:opacity-70"
        style={{ color: 'var(--color-accent)' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface-border)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
    </div>
  );
}
