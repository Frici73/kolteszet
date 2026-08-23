import React from 'react';
import { BookOpen, FolderGit2, Download, Plus, Feather, BookMarked } from 'lucide-react';
import type { View } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  onNavigate: (view: View) => void;
  onNew?: () => void; // custom "Új" action (pl. könyv-detail fejezet)
}

const NAV_ITEMS: { view: View; label: string; activeViews: View[]; icon: React.ReactNode }[] = [
  { view: 'poems',    label: 'Versek',      activeViews: ['poems', 'poem-form'],         icon: <Feather className="w-4 h-4" /> },
  { view: 'cycles',   label: 'Ciklusok',    activeViews: ['cycles', 'cycle-form'],        icon: <FolderGit2 className="w-4 h-4" /> },
  { view: 'oneshots', label: 'One-shotok',  activeViews: ['oneshots', 'oneshot-form'],    icon: <BookOpen className="w-4 h-4" /> },
  { view: 'books',    label: 'Könyvek',     activeViews: ['books', 'book-detail'],        icon: <BookMarked className="w-4 h-4" /> },
];

// Views where the "Új" button is shown (default navigate action)
const NEW_VIEW: Partial<Record<View, View>> = {
  poems:    'poem-form',
  cycles:   'cycle-form',
  oneshots: 'oneshot-form',
};

export function Layout({ children, currentView, onNavigate, onNew }: LayoutProps) {
  const defaultNewTarget = NEW_VIEW[currentView];
  // Show "Új" if there's a default target OR a custom onNew callback
  const showNew = !!defaultNewTarget || !!onNew;

  const handleNew = () => {
    if (onNew) {
      onNew();
    } else if (defaultNewTarget) {
      onNavigate(defaultNewTarget);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-amber-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
              <BookOpen className="w-7 h-7" />
              ShadowArts
            </h1>
            <div className="flex items-center gap-2">
              {showNew && (
                <button
                  onClick={handleNew}
                  className="flex items-center gap-1 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Új
                </button>
              )}
              <button
                onClick={() => onNavigate('import-export')}
                className={`p-2 rounded-lg transition-colors ${
                  currentView === 'import-export'
                    ? 'bg-amber-100 text-amber-900'
                    : 'text-amber-700 hover:bg-amber-100'
                }`}
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white/60 border-b border-amber-100 overflow-x-auto">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-0 min-w-max">
            {NAV_ITEMS.map(item => {
              const isActive = item.activeViews.includes(currentView);
              return (
                <button
                  key={item.view}
                  onClick={() => onNavigate(item.view)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 whitespace-nowrap text-sm ${
                    isActive
                      ? 'border-amber-600 text-amber-900'
                      : 'border-transparent text-amber-600 hover:text-amber-900'
                  }`}
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
    </div>
  );
}
