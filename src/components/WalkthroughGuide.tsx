import React, { useState } from 'react';
import { BookOpen, Check, ExternalLink, HelpCircle, Info, Key, Plus, Scale, Sparkles, TrendingDown, X, ChevronDown, ChevronUp } from 'lucide-react';

interface WalkthroughGuideProps {
  onClose: () => void;
  onOpenSettings?: () => void;
  className?: string;
}

export const WalkthroughGuide: React.FC<WalkthroughGuideProps> = ({ onClose, onOpenSettings, className = '' }) => {
  const [showApiKeyGuide, setShowApiKeyGuide] = useState<boolean>(false);
  return (
    <div
      id="walkthrough-guide"
      className={`bg-white border border-indigo-100 rounded-3xl p-5 shadow-sm relative overflow-hidden transition-all ${className}`}
    >
      {/* Decorative accent top line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-indigo-50/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">How Unit Comparison Saves You Money</h3>
            <p className="text-[11px] text-slate-500">Master unit price shopping in 3 easy steps</p>
          </div>
        </div>
        <button
          id="close-guide-btn"
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors shrink-0"
          title="Dismiss Guide"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3 Step Visual Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 pb-2">
        {/* Step 1 */}
        <div className="space-y-2 flex flex-col">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center shrink-0">
              1
            </span>
            <h4 className="text-xs font-bold text-slate-800">Add Different Offerings</h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed flex-1">
            Add multiple sizes or packaging styles (e.g., a **$4.99 jar of 16oz** vs. a **$8.49 jar of 32oz**) to compare.
          </p>
          <div className="bg-slate-50 border border-slate-100/80 p-2 rounded-xl flex items-center gap-1.5 mt-1 text-[10px] text-slate-600">
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Use <b className="font-semibold text-slate-800">"Add Another Item"</b> below to build your comparison.</span>
          </div>
        </div>

        {/* Step 2 */}
        <div className="space-y-2 flex flex-col">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center shrink-0">
              2
            </span>
            <h4 className="text-xs font-bold text-slate-800">Let the App Normalize</h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed flex-1">
            We automatically mathematically convert all product sizes to a standardized weight or volume metric.
          </p>
          <div className="bg-slate-50 border border-slate-100/80 p-2 rounded-xl flex items-center gap-1.5 mt-1 text-[10px] text-slate-600">
            <Scale className="w-3.5 h-3.5 text-indigo-600" />
            <span>Switch comparison bases (e.g. <b className="font-semibold text-slate-800">per oz</b> vs <b className="font-semibold text-slate-800">per lb</b>) on the fly.</span>
          </div>
        </div>

        {/* Step 3 */}
        <div className="space-y-2 flex flex-col">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center shrink-0">
              3
            </span>
            <h4 className="text-xs font-bold text-slate-800">Spot the Winner & Save</h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed flex-1">
            The app clearly marks the winner (the 🥇 best deal) and details exactly how much you save over the worst.
          </p>
          <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-xl flex items-center gap-1.5 mt-1 text-[10px] text-emerald-800">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sometimes the larger size is actually more expensive! Check carefully.</span>
          </div>
        </div>
      </div>

      {/* Free Unlimited AI Scans & API Key Help Section */}
      <div className="mt-4 bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Key className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">
                How to Get Free Unlimited AI Scans (Free Gemini API Key)
              </h4>
              <p className="text-[10px] text-slate-500">
                100% free from Google AI Studio &bull; Takes less than 1 minute
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowApiKeyGuide(!showApiKeyGuide)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <span>{showApiKeyGuide ? 'Hide Instructions' : 'View Steps'}</span>
            {showApiKeyGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showApiKeyGuide && (
          <div className="pt-2 border-t border-slate-200/70 space-y-2 text-[11px] text-slate-600 animate-fade-in">
            <ol className="space-y-1.5 list-decimal list-inside pl-1 text-slate-700">
              <li>
                Visit Google's developer portal at{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 font-bold underline inline-flex items-center gap-0.5"
                >
                  aistudio.google.com/app/apikey <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>Sign in with your regular Google account.</li>
              <li>
                Click the blue <b className="text-slate-900 font-semibold">"Create API Key"</b> button.
              </li>
              <li>
                Copy the generated key (it starts with <code className="bg-slate-200 px-1 rounded text-[10px]">AIzaSy...</code>).
              </li>
              <li>
                Open <b className="text-slate-900 font-semibold">App Settings</b> (or the AI Scanner) and paste your key.
              </li>
            </ol>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span>Get Free Gemini Key ↗</span>
              </a>
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>Open App Settings</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer info & Dismiss Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-indigo-50/60">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span><b>Protip:</b> Click any camera icon on an item card to scan tag prices with AI.</span>
        </div>
        <button
          id="got-it-guide-btn"
          type="button"
          onClick={onClose}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
        >
          <Check className="w-3.5 h-3.5" />
          <span>I understand</span>
        </button>
      </div>
    </div>
  );
};
