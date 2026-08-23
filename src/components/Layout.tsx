import React, { useState } from 'react';
import { BookOpen, FolderGit2, Download, Plus, Feather, BookMarked, Settings as SettingsIcon } from 'lucide-react';
import type { View } from '../types';
import { Settings } from './Settings';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  onNavigate: (view: View) => void;
  onNew?: () => void;
}

const NAV_ITEMS: { view: View; label: string; activeViews: View[]; icon: React.ReactNode }[] = [
  { view: 'poems',    label: 'Versek',      activeViews: ['poems', 'poem-form'],        icon: <Feather className="w-4 h-4" /> },
  { view: 'cycles',   label: 'Ciklusok',    activeViews: ['cycles', 'cycle-form'],       icon: <FolderGit2 className="w-4 h-4" /> },
  { view: 'oneshots', label: 'One-shotok',  activeViews: ['oneshots', 'oneshot-form'],   icon: <BookOpen className="w-4 h-4" /> },
  { view: 'books',    label: 'Könyvek',     activeViews: ['books', 'book-detail'],       icon: <BookMarked className="w-4 h-4" /> },
];

const NEW_VIEW: Partial<Record<View, View>> = {
  poems:    'poem-form',
  cycles:   'cycle-form',
  oneshots: 'oneshot-form',
};

export function Layout({ children, currentView, onNavigate, onNew }: LayoutProps) {
  const [showSettings, setShowSettings] = useState(false);
  const defaultNewTarget = NEW_VIEW[currentView];
  const showNew = !!defaultNewTarget || !!onNew;

  const handleNew = () => {
    if (onNew) onNew();
    else if (defaultNewTarget) onNavigate(defaultNewTarget);
  };

  return (
    <div className="min-h-screen theme-bg">
      {/* Header */}
      <header className="theme-header backdrop-blur-md border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold theme-text-primary flex items-center gap-2">
              <BookOpen className="w-7 h-7" />
              ShadowArts
            </h1>
            <div className="flex items-center gap-2">
              {showNew && (
                <button
                  onClick={handleNew}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium theme-accent theme-accent-hover"
                >
                  <Plus className="w-4 h-4" />
                  Új
                </button>
              )}
              <button
                onClick={() => onNavigate('import-export')}
                className="p-2 rounded-lg transition-colors theme-text-secondary hover:opacity-70"
                style={{
                  backgroundColor: currentView === 'import-export' ? 'var(--color-surface-border)' : 'transparent',
                }}
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg transition-colors theme-text-secondary hover:opacity-70"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="theme-nav border-b overflow-x-auto">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-0 min-w-max">
            {NAV_ITEMS.map(item => {
              const isActive = item.activeViews.includes(currentView);
              return (
                <button
                  key={item.view}
                  onClick={() => onNavigate(item.view)}
                  className="flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 whitespace-nowrap text-sm"
                  style={{
                    borderColor: isActive ? 'var(--color-nav-active)' : 'transparent',
                    color: isActive ? 'var(--color-nav-active)' : 'var(--color-nav-inactive)',
                    opacity: isActive ? 1 : 0.7,
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Settings modal */}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
