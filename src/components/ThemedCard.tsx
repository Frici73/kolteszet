/**
 * Újrafelhasználható, témafüggő kártyaelemek.
 * Minden szín CSS változóból jön, nem hardcoded Tailwind osztályból.
 */

import { CheckCircle2, Circle, Edit2, Trash2, Calendar } from 'lucide-react';

interface StatusButtonProps {
  finished: boolean;
  onToggle: () => void;
}

export function StatusButton({ finished, onToggle }: StatusButtonProps) {
  return (
    <button
      onClick={onToggle}
      className="flex-shrink-0 hover:scale-110 transition-transform"
      style={{ color: finished ? 'var(--color-done)' : 'var(--color-text-muted)' }}
    >
      {finished ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
    </button>
  );
}

interface DoneBadgeProps {
  show: boolean;
}

export function DoneBadge({ show }: DoneBadgeProps) {
  if (!show) return null;
  return (
    <span
      className="flex-shrink-0 px-2 py-0.5 text-xs rounded-full"
      style={{ backgroundColor: 'var(--color-done-bg)', color: 'var(--color-done-text)' }}
    >
      Kész
    </span>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  finished: boolean;
}

export function CardTitle({ children, finished }: CardTitleProps) {
  return (
    <h3
      className="min-w-0 flex-1 font-semibold text-lg whitespace-normal break-words"
      style={{ color: finished ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}
    >
      {children}
    </h3>
  );
}

interface CardPreviewProps {
  children: React.ReactNode;
  italic?: boolean;
}

export function CardPreview({ children, italic }: CardPreviewProps) {
  return (
    <p
      className={`text-sm line-clamp-2 mb-2 ${italic ? 'italic' : ''}`}
      style={{ color: 'var(--color-text-secondary)' }}
    >
      {children}
    </p>
  );
}

interface CardDateProps {
  date: { year: number; month: number; day: number };
}

export function CardDate({ date }: CardDateProps) {
  return (
    <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
      <Calendar className="w-3 h-3" />
      {date.year}. {String(date.month).padStart(2, '0')}. {String(date.day).padStart(2, '0')}.
    </div>
  );
}

interface CardActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  deleteConfirmText?: string;
}

export function CardActions({ onEdit, onDelete, deleteConfirmText = 'Biztosan törölni szeretnéd?' }: CardActionsProps) {
  return (
    <div className="flex gap-1 flex-shrink-0">
      <button
        onClick={onEdit}
        className="p-2 rounded-lg transition-colors hover:opacity-80"
        style={{ color: 'var(--color-accent)' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface-border)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        onClick={() => { if (confirm(deleteConfirmText)) onDelete(); }}
        className="p-2 rounded-lg transition-colors"
        style={{ color: 'var(--color-danger)' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-danger-bg)')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

interface CardWrapperProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function CardWrapper({ children, style }: CardWrapperProps) {
  return (
    <div
      className="rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--color-surface-border)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface GenreBadgeProps {
  genre: string;
}

export function GenreBadge({ genre }: GenreBadgeProps) {
  return (
    <span
      className="px-2 py-0.5 text-xs rounded-full"
      style={{ backgroundColor: 'var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
    >
      {genre}
    </span>
  );
}

interface StatRowProps {
  total: number;
  done: number;
  label: string;
}

export function StatRow({ total, done, label }: StatRowProps) {
  return (
    <div className="flex gap-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
      <span>Összesen: {total} {label}</span>
      <span style={{ color: 'var(--color-done)' }}>Kész: {done}</span>
    </div>
  );
}

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        placeholder={placeholder ?? 'Keresés...'}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm focus:outline-none"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-surface-border)',
          color: 'var(--color-text-primary)',
          '--tw-ring-color': 'var(--color-accent)',
        } as React.CSSProperties}
        onFocus={e => {
          e.currentTarget.style.boxShadow = `0 0 0 2px var(--color-accent)`;
          e.currentTarget.style.borderColor = 'var(--color-accent)';
        }}
        onBlur={e => {
          e.currentTarget.style.boxShadow = '';
          e.currentTarget.style.borderColor = 'var(--color-surface-border)';
        }}
      />
    </div>
  );
}

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor: 'var(--color-surface-border)' }}
      >
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
      {subtitle && <p style={{ color: 'var(--color-text-secondary)' }}>{subtitle}</p>}
    </div>
  );
}
