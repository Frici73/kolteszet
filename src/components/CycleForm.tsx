import { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Check } from 'lucide-react';
import { useStorage } from '../context/StorageContext';

interface CycleFormProps {
  cycleId?: string;
  onCancel: () => void;
  onSave: () => void;
}

export function CycleForm({ cycleId, onCancel, onSave }: CycleFormProps) {
  const { poems, addCycle, updateCycle, getCycleById, getPoemsByIds } = useStorage();
  const isEditing = !!cycleId;

  const [title, setTitle] = useState('');
  const [thought, setThought] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [day, setDay] = useState(new Date().getDate());
  const [status, setStatus] = useState<'finished' | 'unfinished'>('unfinished');
  const [selectedPoemIds, setSelectedPoemIds] = useState<string[]>([]);
  const [poemSearch, setPoemSearch] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  // Load existing cycle data
  useEffect(() => {
    if (cycleId) {
      const cycle = getCycleById(cycleId);
      if (cycle) {
        setTitle(cycle.title);
        setThought(cycle.thought);
        setYear(cycle.date.year);
        setMonth(cycle.date.month);
        setDay(cycle.date.day);
        setStatus(cycle.status);
        setSelectedPoemIds(cycle.poemIds);
      }
    }
  }, [cycleId, getCycleById]);

  const validate = (): boolean => {
    const newErrors: string[] = [];
    if (!title.trim()) newErrors.push('A cím megadása kötelező');
    if (!thought.trim()) newErrors.push('A gondolat megadása kötelező');
    if (year < 1 || year > 9999) newErrors.push('Érvénytelen év');
    if (month < 1 || month > 12) newErrors.push('Érvénytelen hónap');
    if (day < 1 || day > 31) newErrors.push('Érvénytelen nap');
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const togglePoem = (poemId: string) => {
    setSelectedPoemIds(prev =>
      prev.includes(poemId)
        ? prev.filter(id => id !== poemId)
        : [...prev, poemId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const cycleData = {
      title: title.trim(),
      thought: thought.trim(),
      date: { year, month, day },
      status,
      poemIds: selectedPoemIds,
    };

    if (isEditing && cycleId) {
      updateCycle(cycleId, cycleData);
    } else {
      addCycle(cycleData);
    }
    onSave();
  };

  const filteredPoems = poems.filter(poem =>
    poem.title.toLowerCase().includes(poemSearch.toLowerCase()) ||
    poem.content.toLowerCase().includes(poemSearch.toLowerCase())
  );

  const selectedPoems = getPoemsByIds(selectedPoemIds);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onCancel}
          className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-amber-900">
          {isEditing ? 'Ciklus szerkesztése' : 'Új ciklus'}
        </h2>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
            <AlertCircle className="w-5 h-5" />
            Kérlek javítsd a következő hibákat:
          </div>
          <ul className="list-disc list-inside text-red-600 text-sm">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-1">
            Cím <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add meg a ciklus címét..."
            className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Thought */}
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-1">
            Gondolat <span className="text-red-500">*</span>
          </label>
          <textarea
            value={thought}
            onChange={(e) => setThought(e.target.value)}
            placeholder="Írd le a ciklushoz tartozó gondolatot, ötletet..."
            rows={3}
            className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-1">
            Dátum
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-amber-500">Év</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || 0)}
                min={1}
                max={9999}
                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-amber-500">Hónap</label>
              <input
                type="number"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value) || 1)}
                min={1}
                max={12}
                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-amber-500">Nap</label>
              <input
                type="number"
                value={day}
                onChange={(e) => setDay(parseInt(e.target.value) || 1)}
                min={1}
                max={31}
                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-2">
            Állapot
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="unfinished"
                checked={status === 'unfinished'}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="w-4 h-4 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-amber-700">Nincs kész</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="finished"
                checked={status === 'finished'}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="w-4 h-4 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-amber-700">Kész</span>
            </label>
          </div>
        </div>

        {/* Poem Selection */}
        <div>
          <label className="block text-sm font-medium text-amber-700 mb-2">
            Versek hozzáadása ({selectedPoemIds.length} kiválasztva)
          </label>
          
          {/* Selected poems chips */}
          {selectedPoems.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedPoems.map(poem => (
                <button
                  key={poem.id}
                  type="button"
                  onClick={() => togglePoem(poem.id)}
                  className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm hover:bg-amber-200 transition-colors"
                >
                  {poem.title}
                  <span className="text-amber-600">×</span>
                </button>
              ))}
            </div>
          )}

          {/* Poem search */}
          <input
            type="text"
            placeholder="Keresés versek között..."
            value={poemSearch}
            onChange={(e) => setPoemSearch(e.target.value)}
            className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 mb-2"
          />

          {/* Available poems */}
          <div className="max-h-48 overflow-y-auto border border-amber-200 rounded-lg divide-y divide-amber-100">
            {poems.length === 0 ? (
              <p className="p-4 text-amber-500 text-center text-sm">
                Még nincsenek verseid. Előbb hozz létre verseket!
              </p>
            ) : filteredPoems.length === 0 ? (
              <p className="p-4 text-amber-500 text-center text-sm">
                Nincs a keresésnek megfelelő vers.
              </p>
            ) : (
              filteredPoems.map(poem => {
                const isSelected = selectedPoemIds.includes(poem.id);
                return (
                  <button
                    key={poem.id}
                    type="button"
                    onClick={() => togglePoem(poem.id)}
                    className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-amber-50 transition-colors ${
                      isSelected ? 'bg-amber-50' : ''
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      isSelected 
                        ? 'bg-amber-500 border-amber-500' 
                        : 'border-amber-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm ${isSelected ? 'text-amber-900 font-medium' : 'text-amber-700'}`}>
                      {poem.title}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors font-medium"
          >
            Mégse
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            {isEditing ? 'Mentés' : 'Létrehozás'}
          </button>
        </div>
      </form>
    </div>
  );
}
