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
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-3 sm:p-4 rounded-xl shadow-md relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2.5 z-10 min-w-0">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md shrink-0">
              <Trophy className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.2 rounded-full tracking-wider">
                  {isTie ? 'Tie' : 'Winner'}
                </span>
                <span className="text-[11px] font-semibold text-emerald-100">
                  {isTie ? 'Equal Unit Price' : 'Best Unit Price'}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black tracking-tight mt-0.5 flex flex-wrap items-center gap-1.5 leading-snug">
                <span className="truncate">{isTie ? 'All items cost the same unit price' : bestValue.productName}</span>
                {!isTie && winningProduct?.storeName?.trim() && (
                  <span className="text-[10px] font-bold text-amber-200 bg-emerald-800/80 border border-emerald-400/30 px-1.5 py-0.2 rounded shrink-0">
                    @{winningProduct.storeName.trim()}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-emerald-100 mt-0.5">
                At <span className="font-bold text-white">{formatUnitPrice(bestValue.unitPricePerStandardBase)}</span> {getReferenceBaseLabel(referenceBase)}, {isTie ? 'all items are equally priced.' : 'cheapest offer!'}
              </p>
            </div>
          </div>

          {!isTie && worstValue && bestValue.savingsPercentageVsWorst > 0 && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 sm:p-2.5 border border-white/20 shrink-0 w-full sm:w-auto text-left sm:text-right z-10 flex sm:flex-col items-center sm:items-end justify-between">
              <div className="text-[10px] sm:text-[11px] text-emerald-100 font-medium">
                <span className="hidden sm:inline">Savings vs. Most Expensive:</span>
                <span className="sm:hidden">vs. Highest Cost:</span>
              </div>
              <div className="text-base sm:text-xl font-black text-amber-300 flex items-center gap-0.5">
                <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5" />
                {bestValue.savingsPercentageVsWorst}% CHEAPER
              </div>
              <div className="text-[10px] sm:text-[11px] text-emerald-100">
                Saves {formatUnitPrice(dollarSavings)} / {referenceBase}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visual Unit Price Comparison Bar Chart */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 gap-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Price Comparison</span> ({getReferenceBaseLabel(referenceBase)})
          </h4>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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

        <div className="space-y-2.5 pt-1">
          {validComparisons
            .sort((a, b) => a.unitPricePerStandardBase - b.unitPricePerStandardBase)
            .map((comp, idx) => {
              const barWidthPercent = Math.min(
                100,
                Math.max(12, (comp.unitPricePerStandardBase / maxUnitPrice) * 100)
              );

              return (
                <div key={comp.productId} className="space-y-1 bg-slate-50/70 p-2 sm:p-2.5 rounded-xl border border-slate-100">
                  {/* Visual Row Top */}
                  {(() => {
                    const matchedProductIndex = products.findIndex((p) => p.id === comp.productId);
                    const cardNum = matchedProductIndex >= 0 ? matchedProductIndex + 1 : null;
                    const matchedProduct = cardNum ? products[matchedProductIndex] : null;
                    const storeName = matchedProduct?.storeName?.trim();
                    const rankMedal =
                      idx === 0
                        ? '🥇 1st'
                        : idx === 1
                        ? '🥈 2nd'
                        : idx === 2
                        ? '🥉 3rd'
                        : `#${idx + 1}`;

                    return (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-900">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-white text-[10px] font-bold shrink-0">
                              {rankMedal}
                            </span>
                            <span className="font-bold text-slate-900 truncate" title={comp.productName}>
                              {comp.productName}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm shrink-0">
                            {formatUnitPrice(comp.unitPricePerStandardBase)}{' '}
                            <span className="text-[10px] font-normal text-slate-500">
                              / {referenceBase}
                            </span>
                          </div>
                        </div>

                        {/* Badges line below title so product name is NEVER truncated on small screens */}
                        <div className="flex flex-wrap items-center gap-1 text-[10px]">
                          {cardNum && (
                            <span className="w-4 h-4 rounded bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                              {String.fromCharCode(64 + cardNum)}
                            </span>
                          )}
                          {storeName && (
                            <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 rounded shrink-0">
                              @{storeName}
                            </span>
                          )}
                          {isTie ? (
                            <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded shrink-0">
                              Tied
                            </span>
                          ) : (
                            <>
                              {comp.isBestValue && (
                                <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded shrink-0">
                                  Best Value
                                </span>
                              )}
                              {comp.isWorstValue && (
                                <span className="bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded shrink-0">
                                  Costliest
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Visual Bar */}
                  <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden flex items-center mt-1">
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
