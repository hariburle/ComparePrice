import React, { useState } from 'react';
import { ProductOffer, ReferenceBase, SavedComparison, StandardizedComparison, UnitCategory } from '../types';
import { getReferenceBaseLabel, formatUnitPrice } from '../utils/units';
import { Trophy, ArrowDownRight, Award, SlidersHorizontal, BookmarkPlus, History, Check } from 'lucide-react';

interface ComparisonSummaryProps {
  comparisons: StandardizedComparison[];
  products: ProductOffer[];
  referenceBase: ReferenceBase;
  onReferenceBaseChange: (base: ReferenceBase) => void;
  unitCategory: UnitCategory;
  onOpenSavedHistory?: () => void;
}

export const ComparisonSummary: React.FC<ComparisonSummaryProps> = ({
  comparisons,
  products,
  referenceBase,
  onReferenceBaseChange,
  unitCategory,
  onOpenSavedHistory,
}) => {
  const [justSaved, setJustSaved] = useState<boolean>(false);

  if (!comparisons || comparisons.length === 0) return null;

  const validComparisons = comparisons.filter((c) => c.unitPricePerStandardBase > 0);
  if (validComparisons.length < 2) return null;

  const handleQuickSave = () => {
    try {
      const storedKey = 'bargain_hunter_saved_comparisons';
      const stored = localStorage.getItem(storedKey);
      const savedLists: SavedComparison[] = stored ? JSON.parse(stored) : [];

      const topProduct = products[0]?.name || 'Items';
      const titleToUse = `${topProduct} Comparison (${new Date().toLocaleDateString()})`;

      const newEntry: SavedComparison = {
        id: Date.now().toString(),
        title: titleToUse,
        category: 'General',
        date: new Date().toLocaleDateString(),
        referenceBase,
        products,
      };

      const updated = [newEntry, ...savedLists];
      localStorage.setItem(storedKey, JSON.stringify(updated));

      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (e) {
      console.error('Failed to save comparison', e);
    }
  };

  const bestValue = validComparisons.find((c) => c.isBestValue) || validComparisons[0];
  const worstValue = validComparisons.find((c) => c.isWorstValue);
  const winningProduct = products.find((p) => p.id === bestValue?.productId);

  // Calculate dollar savings per 1000 standard units or full package purchase
  let dollarSavings = 0;
  if (bestValue && worstValue) {
    const diffPerUnit = worstValue.unitPricePerStandardBase - bestValue.unitPricePerStandardBase;
    dollarSavings = Math.max(0, diffPerUnit);
  }

  // Choose reference base options according to unit category
  const referenceOptions: { base: ReferenceBase; label: string }[] =
    unitCategory === 'weight'
      ? [
          { base: '100g', label: '$/100g' },
          { base: '1kg', label: '$/kg' },
          { base: '1oz', label: '$/oz' },
          { base: '1lb', label: '$/lb' },
        ]
      : unitCategory === 'volume'
      ? [
          { base: '100ml', label: '$/100ml' },
          { base: '1l', label: '$/Liter' },
          { base: '1floz', label: '$/fl oz' },
          { base: '1gal', label: '$/Gallon' },
        ]
      : unitCategory === 'paper'
      ? [
          { base: '100sheets', label: '$/100 sheets' },
          { base: '1count', label: '$/roll' },
        ]
      : unitCategory === 'laundry'
      ? [
          { base: '1load', label: '$/load' },
          { base: '100ml', label: '$/100ml' },
        ]
      : [
          { base: '1count', label: '$/item' },
          { base: '100count', label: '$/100 count' },
        ];

  const minUnitPrice = Math.min(...validComparisons.map((c) => c.unitPricePerStandardBase));
  const maxUnitPrice = Math.max(...validComparisons.map((c) => c.unitPricePerStandardBase), 0.0001);
  const isTie = validComparisons.length > 1 && Math.abs(maxUnitPrice - minUnitPrice) < 0.00001;

  return (
    <div id="comparison-summary-panel" className="space-y-4">
      {/* Target Reference Unit Selector Toolbar */}
      <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold tracking-wide uppercase text-slate-300">
            <span className="hidden sm:inline">Normalize Unit Metric:</span>
            <span className="sm:hidden">Compare By:</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {referenceOptions.map((opt) => (
            <button
              key={opt.base}
              id={`ref-btn-${opt.base}`}
              type="button"
              onClick={() => onReferenceBaseChange(opt.base)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                referenceBase === opt.base
                  ? 'bg-emerald-500 text-slate-950 shadow-sm scale-105'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Best Deal Winner Banner */}
      {bestValue && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 sm:p-5 rounded-2xl shadow-md relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 z-10">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md shrink-0">
              <Trophy className="w-7 h-7 text-amber-300 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                  {isTie ? 'Tie' : 'Winner'}
                </span>
                <span className="text-xs font-semibold text-emerald-100">
                  {isTie ? 'Equal Unit Price' : 'Best Unit Price'}
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight mt-0.5 flex flex-wrap items-center gap-2">
                <span>{isTie ? 'All items cost the same unit price' : bestValue.productName}</span>
                {!isTie && winningProduct?.storeName?.trim() && (
                  <span className="text-xs font-bold text-amber-200 bg-emerald-800/80 border border-emerald-400/30 px-2 py-0.5 rounded-md">
                    @{winningProduct.storeName.trim()}
                  </span>
                )}
              </h3>
              <p className="text-xs text-emerald-100 mt-1">
                At <span className="font-bold text-white">{formatUnitPrice(bestValue.unitPricePerStandardBase)}</span> {getReferenceBaseLabel(referenceBase)}, {isTie ? 'all compared items are equally priced.' : 'cheapest offer!'}
              </p>
            </div>
          </div>

          {!isTie && worstValue && bestValue.savingsPercentageVsWorst > 0 && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 shrink-0 w-full sm:w-auto text-left sm:text-right z-10">
              <div className="text-[11px] text-emerald-100 font-medium">
                <span className="hidden sm:inline">Savings vs. Most Expensive:</span>
                <span className="sm:hidden">vs. Highest Cost:</span>
              </div>
              <div className="text-2xl font-black text-amber-300 flex items-center justify-start sm:justify-end gap-1">
                <ArrowDownRight className="w-6 h-6" />
                {bestValue.savingsPercentageVsWorst}% CHEAPER
              </div>
              <div className="text-[11px] text-emerald-100">
                Saves {formatUnitPrice(dollarSavings)}/{referenceBase}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visual Unit Price Comparison Bar Chart */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Price Comparison Breakdown</span>
            <span className="sm:hidden">Comparison</span> ({getReferenceBaseLabel(referenceBase)})
          </h4>

          <div className="flex items-center gap-2">
            <button
              id="quick-save-comparison-btn"
              type="button"
              onClick={handleQuickSave}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                justSaved
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
              title="Save this comparison to local history"
            >
              {justSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Save Comparison</span>
                  <span className="sm:hidden">Save</span>
                </>
              )}
            </button>

            {onOpenSavedHistory && (
              <button
                id="view-saved-comparisons-btn"
                type="button"
                onClick={onOpenSavedHistory}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-slate-200"
                title="View all saved comparisons"
              >
                <History className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">View Saved</span>
                <span className="sm:hidden">Saved</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {validComparisons
            .sort((a, b) => a.unitPricePerStandardBase - b.unitPricePerStandardBase)
            .map((comp, idx) => {
              const barWidthPercent = Math.min(
                100,
                Math.max(12, (comp.unitPricePerStandardBase / maxUnitPrice) * 100)
              );

              return (
                <div key={comp.productId} className="space-y-1">
                  {/* Visual Bar */}
                  {(() => {
                    const matchedProduct = products.find((p) => p.id === comp.productId);
                    const storeName = matchedProduct?.storeName?.trim();
                    return (
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="truncate">{comp.productName}</span>
                          {storeName && (
                            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 rounded shrink-0">
                              @{storeName}
                            </span>
                          )}
                          {isTie ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0">
                              Tied
                            </span>
                          ) : (
                            <>
                              {comp.isBestValue && (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0">
                                  Best
                                </span>
                              )}
                              {comp.isWorstValue && (
                                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0">
                                  Costliest
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        <div className="font-bold text-slate-900 shrink-0">
                          {formatUnitPrice(comp.unitPricePerStandardBase)}{' '}
                          <span className="text-[10px] font-normal text-slate-500">
                            / {referenceBase}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Visual Bar */}
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex items-center">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isTie
                          ? 'bg-emerald-500'
                          : comp.isBestValue
                          ? 'bg-emerald-500'
                          : comp.isWorstValue
                          ? 'bg-rose-400'
                          : 'bg-indigo-400'
                      }`}
                      style={{ width: `${barWidthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
