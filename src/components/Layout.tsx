import React from 'react';
import { BookOpen, FolderGit2, Download, Plus } from 'lucide-react';
import type { View } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  onNavigate: (view: View) => void;
}

export function Layout({ children, currentView, onNavigate }: LayoutProps) {
  const isPoems = currentView === 'poems' || currentView === 'poem-form';
  const isCycles = currentView === 'cycles' || currentView === 'cycle-form';

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
              {(currentView === 'poems' || currentView === 'cycles') && (
                <button
                  onClick={() => onNavigate(currentView === 'poems' ? 'poem-form' : 'cycle-form')}
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
      <nav className="bg-white/60 border-b border-amber-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => onNavigate('poems')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                isPoems
                  ? 'border-amber-600 text-amber-900'
                  : 'border-transparent text-amber-600 hover:text-amber-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Versek
            </button>
            <button
              onClick={() => onNavigate('cycles')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                isCycles
                  ? 'border-amber-600 text-amber-900'
                  : 'border-transparent text-amber-600 hover:text-amber-900'
              }`}
            >
              <FolderGit2 className="w-4 h-4" />
              Ciklusok
            </button>
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
