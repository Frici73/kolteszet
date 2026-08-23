import { useState } from 'react';
import { StorageProvider } from './context/StorageContext';
import { Layout } from './components/Layout';
import { PoemList } from './components/PoemList';
import { PoemForm } from './components/PoemForm';
import { CycleList } from './components/CycleList';
import { CycleForm } from './components/CycleForm';
import { OneShotList } from './components/OneShotList';
import { OneShotForm } from './components/OneShotForm';
import { BookList } from './components/BookList';
import { BookForm } from './components/BookForm';
import { BookDetail } from './components/BookDetail';
import { ImportExport } from './components/ImportExport';
import type { View } from './types';

function AppContent() {
  const [view, setView] = useState<View>('poems');
  const [editingPoemId, setEditingPoemId] = useState<string | undefined>();
  const [editingCycleId, setEditingCycleId] = useState<string | undefined>();
  const [editingOneShotId, setEditingOneShotId] = useState<string | undefined>();
  // undefined = not editing, '' = new book, 'id' = editing existing
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [openBookId, setOpenBookId] = useState<string | undefined>();

  const navigate = (v: View) => {
    setView(v);
    if (v !== 'poem-form') setEditingPoemId(undefined);
    if (v !== 'cycle-form') setEditingCycleId(undefined);
    if (v !== 'oneshot-form') setEditingOneShotId(undefined);
    if (v !== 'book-detail') setOpenBookId(undefined);
    setEditingBookId(null);
  };

  // Show book form (new or edit) as full-page overlay
  if (editingBookId !== null) {
    return (
      <Layout currentView={view} onNavigate={navigate}>
        <BookForm
          bookId={editingBookId === '' ? undefined : editingBookId}
          onCancel={() => setEditingBookId(null)}
          onSave={id => {
            setEditingBookId(null);
            setOpenBookId(id);
            setView('book-detail');
          }}
        />
      </Layout>
    );
  }

  const content = () => {
    switch (view) {
      case 'poems':
        return <PoemList onEdit={id => { setEditingPoemId(id); setView('poem-form'); }} />;
      case 'poem-form':
        return <PoemForm poemId={editingPoemId}
          onCancel={() => navigate('poems')}
          onSave={() => { setEditingPoemId(undefined); navigate('poems'); }} />;

      case 'cycles':
        return <CycleList onEdit={id => { setEditingCycleId(id); setView('cycle-form'); }} />;
      case 'cycle-form':
        return <CycleForm cycleId={editingCycleId}
          onCancel={() => navigate('cycles')}
          onSave={() => { setEditingCycleId(undefined); navigate('cycles'); }} />;

      case 'oneshots':
        return <OneShotList onEdit={id => { setEditingOneShotId(id); setView('oneshot-form'); }} />;
      case 'oneshot-form':
        return <OneShotForm oneShotId={editingOneShotId}
          onCancel={() => navigate('oneshots')}
          onSave={() => { setEditingOneShotId(undefined); navigate('oneshots'); }} />;

      case 'books':
        return <BookList
          onOpenBook={id => { setOpenBookId(id); setView('book-detail'); }}
          onEditBook={id => setEditingBookId(id)}
          onNewBook={() => setEditingBookId('')}
        />;

      case 'book-detail':
        return openBookId
          ? <BookDetail
              bookId={openBookId}
              onBack={() => navigate('books')}
              onEditBook={id => setEditingBookId(id)}
            />
          : null;

      case 'import-export':
        return <ImportExport />;
    }
  };

  return (
    <Layout currentView={view} onNavigate={navigate}>
      {content()}
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
