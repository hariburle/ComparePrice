import React, { useState, useEffect } from 'react';
import { Settings, X, Key, DollarSign, Scale, Check, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  const [preferredUnitSystem, setPreferredUnitSystem] = useState<'all' | 'imperial' | 'metric'>('all');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(localStorage.getItem('unit_price_gemini_key') || '');
      setCurrencySymbol(localStorage.getItem('unit_price_currency') || '$');
      setPreferredUnitSystem((localStorage.getItem('unit_price_unit_system') as any) || 'all');
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('unit_price_gemini_key', apiKey.trim());
    } else {
      localStorage.removeItem('unit_price_gemini_key');
    }

    localStorage.setItem('unit_price_currency', currencySymbol);
    localStorage.setItem('unit_price_unit_system', preferredUnitSystem);

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  const hasEnvKey = Boolean(import.meta.env.VITE_GEMINI_API_KEY);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">App Settings</h3>
            <p className="text-xs text-slate-500">Customize preferences and AI configuration</p>
          </div>
        </div>

        {/* Currency Setting */}
        <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Default Currency Symbol</span>
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {['$', '€', '£', '₹', 'C$', 'A$'].map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => setCurrencySymbol(sym)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  currencySymbol === sym
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Unit Preference Setting */}
        <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-indigo-600" />
            <span>Measurement System Preference</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'all', label: 'All Units' },
              { id: 'imperial', label: 'Imperial (oz, lb)' },
              { id: 'metric', label: 'Metric (g, kg, ml)' },
            ].map((sys) => (
              <button
                key={sys.id}
                type="button"
                onClick={() => setPreferredUnitSystem(sys.id as any)}
                className={`p-2 text-center text-[11px] font-bold rounded-xl transition-all ${
                  preferredUnitSystem === sys.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {sys.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Vision Key Setting */}
        <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-500" />
              <span>Gemini AI Vision Key</span>
            </label>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {hasEnvKey ? 'Built-in Active' : apiKey ? 'Custom Active' : 'Fallback OCR Active'}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            AI Vision scans store price tags directly. If you don't use a built-in key in your environment, you can optionally paste your free Google AI Studio key here.
          </p>

          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasEnvKey ? 'Using built-in Gemini API Key' : 'Paste Gemini API Key (optional)'}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <p className="text-[10px] text-slate-400">
            Get a free key at{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 underline font-medium"
            >
              aistudio.google.com/app/apikey
            </a>
          </p>
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          className={`w-full py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            isSaved
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg'
          }`}
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4" /> Preferences Saved!
            </>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>
    </div>
  );
};
