import React, { useState, useEffect } from 'react';
import { ProductOffer, ReferenceBase, SavedComparison } from '../types';
import { History, Trash2, ExternalLink, BookmarkPlus, X, ShoppingCart } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOffers: ProductOffer[];
  currentReferenceBase: ReferenceBase;
  onLoadComparison: (offers: ProductOffer[], refBase: ReferenceBase) => void;
}

const LOCAL_STORAGE_KEY = 'bargain_hunter_saved_comparisons';

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  currentOffers,
  currentReferenceBase,
  onLoadComparison,
}) => {
  const [savedLists, setSavedLists] = useState<SavedComparison[]>([]);
  const [tripTitle, setTripTitle] = useState<string>('');
  const [conflictItem, setConflictItem] = useState<SavedComparison | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setSavedLists(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load saved comparisons from storage', e);
    }
  }, [isOpen]);

  // Reset conflict item when modal closes
  useEffect(() => {
    if (!isOpen) {
      setConflictItem(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoadClick = (item: SavedComparison) => {
    if (currentOffers && currentOffers.length > 0) {
      setConflictItem(item);
    } else {
      onLoadComparison(item.products, item.referenceBase);
      onClose();
    }
  };

  const handleResolveConflict = (action: 'replace' | 'merge') => {
    if (!conflictItem) return;

    if (action === 'replace') {
      onLoadComparison(conflictItem.products, conflictItem.referenceBase);
    } else {
      // Merge with newly generated IDs to prevent key conflicts
      const mergedOffers = [
        ...currentOffers,
        ...conflictItem.products.map((p, idx) => ({
          ...p,
          id: `p_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
        })),
      ];
      // Keep existing reference base to maintain the current context
      onLoadComparison(mergedOffers, currentReferenceBase);
    }

    setConflictItem(null);
    onClose();
  };

  const handleSaveCurrent = () => {
    if (!currentOffers || currentOffers.length === 0) return;

    const titleToUse = tripTitle.trim() || `Bargain Trip ${new Date().toLocaleDateString()}`;
    const newEntry: SavedComparison = {
      id: Date.now().toString(),
      title: titleToUse,
      category: 'General',
      date: new Date().toLocaleDateString(),
      referenceBase: currentReferenceBase,
      products: currentOffers,
    };

    const updated = [newEntry, ...savedLists];
    setSavedLists(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save to storage', e);
    }
    setTripTitle('');
  };

  const handleDelete = (id: string) => {
    const updated = savedLists.filter((item) => item.id !== id);
    setSavedLists(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update storage', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative space-y-4 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
          <History className="w-4 h-4" /> Saved Shopping Trips & History
        </div>
        <h3 className="text-xl font-black text-slate-900">
          Saved Bargain Comparisons
        </h3>

        {/* Save Current Session Box */}
        <div className="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100 space-y-2 shrink-0">
          <label className="block text-xs font-bold text-indigo-950">
            Save Current Active Comparison
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tripTitle}
              onChange={(e) => setTripTitle(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="e.g. Costco vs Target Rice Run"
              className="flex-1 text-xs bg-white border border-indigo-200 rounded-xl px-3 py-2 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleSaveCurrent}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
            >
              <BookmarkPlus className="w-4 h-4" /> Save
            </button>
          </div>
        </div>

        {/* Saved Items List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {savedLists.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs space-y-2">
              <ShoppingCart className="w-8 h-8 mx-auto opacity-40" />
              <p>No saved trips yet. Save your current comparison above!</p>
            </div>
          ) : (
            savedLists.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {item.products.length} Items • Saved on {item.date} • Base: {item.referenceBase}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleLoadClick(item)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold text-xs flex items-center gap-1"
                    title="Load into Calculator"
                  >
                    <ExternalLink className="w-4 h-4" /> Load
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Conflict Resolution Dialog Overlay */}
        {conflictItem && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs rounded-3xl p-6 flex flex-col justify-center items-center text-center space-y-4 z-50 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 animate-pulse">
              <History className="w-6 h-6" />
            </div>
            
            <div className="space-y-1.5 px-4">
              <h4 className="text-base font-black text-white">
                Active Comparison Found
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                You currently have <b>{currentOffers.length} item(s)</b> in your active list. What would you like to do?
              </p>
            </div>

            <div className="w-full max-w-xs flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleResolveConflict('merge')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99]"
              >
                <span>Merge & Combine Lists</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleResolveConflict('replace')}
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-sm active:scale-[0.99]"
              >
                <span>Replace Current List</span>
              </button>
              
              <button
                type="button"
                onClick={() => setConflictItem(null)}
                className="w-full text-slate-400 hover:text-white font-semibold text-xs py-2 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
