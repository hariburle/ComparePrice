import React from 'react';
import { ROADMAP_PHASES } from '../data/roadmapData';
import { CheckCircle2, Clock, Sparkles, Layers, Scale, RefreshCw, Sliders, TrendingDown, Tag, Store, Percent, BookmarkCheck, History, Share2, Camera, Zap, ChevronRight } from 'lucide-react';

interface RoadmapViewProps {
  onClose?: () => void;
  onStartTesting?: () => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({ onClose, onStartTesting }) => {
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Scale': return Scale;
      case 'RefreshCw': return RefreshCw;
      case 'Sliders': return Sliders;
      case 'TrendingDown': return TrendingDown;
      case 'Layers': return Layers;
      case 'Tag': return Tag;
      case 'Sparkles': return Sparkles;
      case 'Store': return Store;
      case 'Percent': return Percent;
      case 'BookmarkCheck': return BookmarkCheck;
      case 'History': return History;
      case 'Share2': return Share2;
      case 'Camera': return Camera;
      case 'Zap': return Zap;
      default: return Sparkles;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">
          <Sparkles className="w-4 h-4" /> Feature Specification & Roadmap
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Bargain Hunter Unit Price Comparator
        </h2>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
          Here is the complete phased roadmap designed to give you instant, effortless unit price comparisons, unit standardizations (grams, kg, ml, L, fl oz), deal calculations, and AI shelf tag scanning.
        </p>

        {onStartTesting && (
          <button
            id="start-testing-roadmap-btn"
            type="button"
            onClick={onStartTesting}
            className="mt-4 inline-flex items-center gap-2 bg-emerald-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-emerald-400 transition-all shadow-md"
          >
            Launch Live Unit Price Calculator <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Phased Cards */}
      <div className="space-y-5">
        {ROADMAP_PHASES.map((phase) => {
          const isDone = phase.status === 'completed';
          const isInProgress = phase.status === 'in_progress';

          return (
            <div
              key={phase.phase}
              className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all ${
                isDone
                  ? 'border-emerald-200 shadow-sm'
                  : isInProgress
                  ? 'border-indigo-300 ring-2 ring-indigo-500/20 shadow-md'
                  : 'border-slate-200 bg-slate-50/50 opacity-90'
              }`}
            >
              {/* Phase Title Row */}
              <div className="flex items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-white ${
                      isDone
                        ? 'bg-emerald-600'
                        : isInProgress
                        ? 'bg-indigo-600'
                        : 'bg-slate-400'
                    }`}
                  >
                    P{phase.phase}
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Phase {phase.phase}: {phase.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{phase.description}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  {isDone ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Fully Ready
                    </span>
                  ) : isInProgress ? (
                    <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full border border-indigo-300">
                      <Clock className="w-3.5 h-3.5 animate-spin" /> In Active Development
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">
                      Planned
                    </span>
                  )}
                </div>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {phase.features.map((feat, fIdx) => {
                  const IconComp = getIconComponent(feat.icon);
                  return (
                    <div
                      key={fIdx}
                      className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-start gap-3"
                    >
                      <div className="p-2 bg-white rounded-lg text-slate-700 shadow-2xs border border-slate-200 shrink-0">
                        <IconComp className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {feat.name}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                          {feat.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
