import React, { useState } from 'react';
import { ProductOffer, ReferenceBase } from '../types';
import { ChevronDown, ChevronUp, LayoutGrid } from 'lucide-react';
import { CATEGORY_PRESETS } from '../config/presets';

interface CategoryPresetsProps {
  onSelectPreset: (offers: ProductOffer[], referenceBase: ReferenceBase, title: string) => void;
}

export const CategoryPresets: React.FC<CategoryPresetsProps> = ({ onSelectPreset }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const presets = CATEGORY_PRESETS;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
      {/* Header Toggle */}
      <button
        id="toggle-presets-btn"
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-3.5 h-3.5 text-indigo-500" />
          <span>Quick Example Presets</span>
          <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
            ({presets.map((p) => p.name).join(', ')})
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-semibold">
          <span>{isExpanded ? 'Hide' : 'Show'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expanded Preset Chips */}
      {isExpanded && (
        <div className="p-3 pt-1.5 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {presets.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.id}
                  id={`preset-btn-${preset.id}`}
                  type="button"
                  onClick={() => {
                    onSelectPreset(preset.offers, preset.referenceBase, preset.title);
                    setIsExpanded(false);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border shrink-0 transition-all ${preset.color}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
