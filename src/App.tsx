import { useState } from 'react';
import { StorageProvider } from './context/StorageContext';
import { Layout } from './components/Layout';
import { PoemList } from './components/PoemList';
import { PoemForm } from './components/PoemForm';
import { CycleList } from './components/CycleList';
import { CycleForm } from './components/CycleForm';
import { ImportExport } from './components/ImportExport';
import type { View } from './types';

function AppContent() {
  const [view, setView] = useState<View>('poems');
  const [editingPoemId, setEditingPoemId] = useState<string | undefined>();
  const [editingCycleId, setEditingCycleId] = useState<string | undefined>();

  const handleNavigate = (newView: View) => {
    setView(newView);
    if (newView !== 'poem-form') setEditingPoemId(undefined);
    if (newView !== 'cycle-form') setEditingCycleId(undefined);
  };

  const handleEditPoem = (id: string) => {
    setEditingPoemId(id);
    setView('poem-form');
  };

  const handleEditCycle = (id: string) => {
    setEditingCycleId(id);
    setView('cycle-form');
  };

  const handleSavePoem = () => {
    setEditingPoemId(undefined);
    setView('poems');
  };

  const handleSaveCycle = () => {
    setEditingCycleId(undefined);
    setView('cycles');
  };

  const renderContent = () => {
    switch (view) {
      case 'poems':
        return <PoemList onEdit={handleEditPoem} />;
      case 'poem-form':
        return (
          <PoemForm
            poemId={editingPoemId}
            onCancel={() => handleNavigate('poems')}
            onSave={handleSavePoem}
          />
        );
      case 'cycles':
        return <CycleList onEdit={handleEditCycle} />;
      case 'cycle-form':
        return (
          <CycleForm
            cycleId={editingCycleId}
            onCancel={() => handleNavigate('cycles')}
            onSave={handleSaveCycle}
          />
        );
      case 'import-export':
        return <ImportExport />;
      default:
        return <PoemList onEdit={handleEditPoem} />;
    }
  };

  return (
    <Layout currentView={view} onNavigate={handleNavigate}>
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <StorageProvider>
      <AppContent />
    </StorageProvider>
  );
}
