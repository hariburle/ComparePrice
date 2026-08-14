import React, { useState } from 'react';
import { ProductOffer, ReferenceBase, UnitType } from '../types';
import { calculateEffectivePrice, calculateTotalBaseUnits, formatUnitLabel, formatUnitPrice, getReferenceBaseUnitFactor } from '../utils/units';
import { Trash2, Copy, Sparkles, Tag, ChevronDown, ChevronUp, Store, Package, Check, Share2, CopyPlus, Barcode } from 'lucide-react';
import { formatItemText, copyTextToClipboard, shareItem } from '../utils/share';
import { isDebugEnabled } from '../config/debug';

interface ProductCardProps {
  offer: ProductOffer;
  index: number;
  referenceBase: ReferenceBase;
  isBestValue: boolean;
  isWorstValue: boolean;
  priceRank: number;
  totalOffersCount: number;
  savingsPercentage: number;
  onUpdate: (updated: ProductOffer) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onScanClick: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  offer,
  index,
  referenceBase,
  isBestValue,
  isWorstValue,
  priceRank,
  totalOffersCount,
  savingsPercentage,
  onUpdate,
  onRemove,
  onDuplicate,
  onScanClick,
}) => {
  const [showDeals, setShowDeals] = useState<boolean>(offer.dealType !== 'none');
  const [copiedItem, setCopiedItem] = useState<boolean>(false);
  const [sharedItem, setSharedItem] = useState<boolean>(false);

  const effectivePrice = calculateEffectivePrice(offer);
  const totalBaseUnits = calculateTotalBaseUnits(offer);
  const { factorInBase } = getReferenceBaseUnitFactor(referenceBase);
  const unitPrice = totalBaseUnits > 0 ? (effectivePrice / totalBaseUnits) * factorInBase : 0;

  const itemLetter = String.fromCharCode(65 + index);

  const handleShare = async () => {
    const result = await shareItem(offer, referenceBase, isBestValue);
    if (result === 'copied' || result === 'shared') {
      setSharedItem(true);
      setTimeout(() => setSharedItem(false), 2000);
    }
  };

  const handleCopyDetails = async () => {
    const text = formatItemText(offer, referenceBase, isBestValue);
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedItem(true);
      setTimeout(() => setCopiedItem(false), 2000);
    }
  };

  const handleChange = (field: keyof ProductOffer, value: any) => {
    onUpdate({
      ...offer,
      [field]: value,
    });
  };

  const getRankBadgeClass = () => {
    if (totalOffersCount <= 1) return 'bg-slate-100 text-slate-700 border-slate-300';
    if (isBestValue) return 'bg-emerald-600 text-white font-bold shadow-sm ring-2 ring-emerald-400/50';
    if (isWorstValue) return 'bg-rose-100 text-rose-800 border-rose-300 font-medium';
    return 'bg-amber-50 text-amber-900 border-amber-200 font-medium';
  };

  return (
    <div
      id={`product-card-${offer.id}`}
      className={`relative bg-white rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden ${
        isBestValue && totalOffersCount > 1
          ? 'border-emerald-500 ring-2 ring-emerald-500/20'
          : isWorstValue && totalOffersCount > 1
          ? 'border-rose-200 bg-rose-50/20'
          : 'border-slate-200'
      }`}
    >
      {/* Top Rank Banner / Header */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-50 border-b border-slate-100 gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <div className="w-6 h-6 rounded-md bg-slate-900 text-white text-xs font-black flex items-center justify-center shrink-0 shadow-sm">
            {itemLetter}
          </div>

          {totalOffersCount > 1 && (
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${getRankBadgeClass()}`}
            >
              {isBestValue
                ? '🏆 #1 Best Value'
                : isWorstValue
                ? `Highest Cost (#${priceRank})`
                : `Rank #${priceRank}`}
            </span>
          )}

          {offer.barcode && (
            <span
              className="text-[10px] font-mono font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded flex items-center gap-1 whitespace-nowrap shrink-0"
              title={`UPC/Barcode: ${offer.barcode}`}
            >
              <Barcode className="w-3 h-3 text-slate-500 shrink-0" />
              <span>{offer.barcode}</span>
            </span>
          )}

          {isDebugEnabled() && offer.scannedByMethod && (
            <span
              className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap shrink-0"
              title={`Extracted via ${offer.scannedByMethod}`}
            >
              <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
              <span>{offer.scannedByMethod}</span>
            </span>
          )}
        </div>

        {/* Card Actions */}
        <div className="flex items-center gap-0.5 ml-auto">
          <button
            id={`scan-btn-${offer.id}`}
            type="button"
            onClick={onScanClick}
            className="p-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-900 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold px-2 shrink-0 border border-indigo-200/70"
            title="Scan item, price tag, or barcode"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden xs:inline sm:inline">Scan Item/Tag</span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold px-2 shrink-0"
            title="Share item details"
          >
            {sharedItem ? <Check className="w-3.5 h-3.5 text-indigo-600" /> : <Share2 className="w-3.5 h-3.5 text-indigo-600" />}
            <span className="hidden sm:inline">{sharedItem ? 'Shared!' : 'Share'}</span>
          </button>
          <button
            type="button"
            onClick={handleCopyDetails}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold px-2 shrink-0"
            title="Copy item details to clipboard"
          >
            {copiedItem ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span className="hidden sm:inline">{copiedItem ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            id={`duplicate-btn-${offer.id}`}
            type="button"
            onClick={onDuplicate}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            title="Duplicate Item"
          >
            <CopyPlus className="w-4 h-4" />
          </button>
          <button
            id={`remove-btn-${offer.id}`}
            type="button"
            onClick={onRemove}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
            title="Remove Offer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-2.5 sm:p-3.5 space-y-2.5 sm:space-y-3">
        {/* Name & Store Row - Side-by-side on all screens */}
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-7 sm:col-span-8 relative">
            <label className="absolute -top-2 left-3 px-1 bg-white text-[10px] sm:text-[11px] font-medium text-slate-400 select-none pointer-events-none z-10 transition-all">
              Item
            </label>
            <input
              id={`input-name-${offer.id}`}
              type="text"
              value={offer.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="e.g. Tomato Bag"
              className="w-full text-xs sm:text-sm font-semibold text-slate-900 bg-transparent border border-slate-300 rounded-lg px-2.5 py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
            />
          </div>
          <div className="col-span-5 sm:col-span-4 relative">
            <label className="absolute -top-2 left-3 px-1 bg-white text-[10px] sm:text-[11px] font-medium text-slate-400 select-none pointer-events-none z-10 flex items-center gap-1 transition-all">
              <Store className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">Store</span>
            </label>
            <input
              id={`input-store-${offer.id}`}
              type="text"
              value={offer.storeName || ''}
              onChange={(e) => handleChange('storeName', e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="Costco..."
              className="w-full text-xs sm:text-sm text-slate-800 bg-transparent border border-slate-300 rounded-lg px-2.5 py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Price & Size Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Price */}
          <div className="relative col-span-1">
            <label className="absolute -top-2 left-3 px-1 bg-white text-[10px] sm:text-[11px] font-medium text-slate-400 select-none pointer-events-none z-10 transition-all">
              Price ($)
            </label>
            <div className={`flex items-center bg-transparent border rounded-lg px-2.5 py-1.5 sm:py-2 focus-within:ring-2 focus-within:ring-slate-800 focus-within:border-transparent transition-all ${
              offer.price <= 0 ? 'border-amber-300 bg-amber-50/10' : 'border-slate-300'
            }`}>
              <span className="text-slate-400 text-xs sm:text-sm font-semibold mr-1 select-none shrink-0">
                $
              </span>
              <input
                id={`input-price-${offer.id}`}
                type="number"
                step="0.01"
                min="0"
                value={offer.price === 0 ? '' : offer.price}
                onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                placeholder="0.00"
                className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-transparent border-none p-0 focus:outline-none min-w-0"
              />
            </div>
            {offer.price <= 0 && (
              <span className="text-[9px] text-amber-600 font-medium mt-0.5 block px-1">
                Enter price
              </span>
            )}
          </div>

          {/* Size */}
          <div className="relative col-span-1">
            <label className="absolute -top-2 left-3 px-1 bg-white text-[10px] sm:text-[11px] font-medium text-slate-400 select-none pointer-events-none z-10 transition-all">
              Size
            </label>
            <input
              id={`input-size-${offer.id}`}
              type="number"
              step="any"
              min="0"
              value={offer.size === 0 ? '' : offer.size}
              onChange={(e) => handleChange('size', parseFloat(e.target.value) || 0)}
              onFocus={(e) => e.target.select()}
              placeholder="e.g. 500"
              className={`w-full text-xs sm:text-sm font-semibold text-slate-900 bg-transparent border rounded-lg px-2.5 py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-slate-800 min-w-0 transition-all ${
                offer.size <= 0 ? 'border-rose-300 bg-rose-50/10' : 'border-slate-300'
              }`}
            />
            {offer.size <= 0 && (
              <span className="text-[9px] text-rose-600 font-medium mt-0.5 block px-1">
                Enter size
              </span>
            )}
          </div>

          {/* Unit */}
          <div className="relative col-span-1">
            <label className="absolute -top-2 left-3 px-1 bg-white text-[10px] sm:text-[11px] font-medium text-slate-400 select-none pointer-events-none z-10 transition-all">
              Unit
            </label>
            <select
              id={`select-unit-${offer.id}`}
              value={offer.unit}
              onChange={(e) => handleChange('unit', e.target.value as UnitType)}
              className="w-full text-xs font-semibold text-slate-800 bg-transparent border border-slate-300 rounded-lg px-2 py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-slate-800 min-w-0 truncate transition-all"
            >
              <optgroup label="Weight">
                <option value="g">Grams (g)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="oz">Ounces (oz)</option>
                <option value="lb">Pounds (lb)</option>
              </optgroup>
              <optgroup label="Volume">
                <option value="ml">Milliliters (ml)</option>
                <option value="l">Liters (L)</option>
                <option value="floz">Fluid Oz (fl oz)</option>
                <option value="gal">Gallons (gal)</option>
                <option value="pt">Pints (pt)</option>
                <option value="qt">Quarts (qt)</option>
              </optgroup>
              <optgroup label="Count & Special">
                <option value="count">Count / Items</option>
                <option value="sheets">Sheets (Paper)</option>
                <option value="loads">Loads (Detergent)</option>
                <option value="cups">Cups / Servings</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Deals & Coupons Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowDeals(!showDeals)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors py-0.5"
          >
            <Tag className="w-3.5 h-3.5" />
            {offer.dealType !== 'none'
              ? `Coupon / Deal: ${offer.dealType.replace('_', ' ')}`
              : 'Coupon / Deal'}
            {showDeals ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDeals && (
            <div className="mt-1.5 p-2.5 sm:p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-indigo-900 mb-1">
                  Coupon / Deal Type
                </label>
                <select
                  id={`select-deal-type-${offer.id}`}
                  value={offer.dealType}
                  onChange={(e) => handleChange('dealType', e.target.value)}
                  className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="none">No Special Deal</option>
                  <option value="percent_off">% Percentage Off Coupon</option>
                  <option value="flat_off">$ Flat Amount Off</option>
                  <option value="bogo_free">Buy 1 Get 1 FREE (BOGO)</option>
                  <option value="bogo_half">Buy 1 Get 1 50% OFF</option>
                  <option value="multi_buy">Bundle Deal (e.g. 3 for $10)</option>
                </select>
              </div>

              {['percent_off', 'flat_off', 'multi_buy'].includes(offer.dealType) && (
                <div>
                  <label className="block text-[11px] font-medium text-indigo-900 mb-1">
                    {offer.dealType === 'percent_off'
                      ? 'Discount %'
                      : offer.dealType === 'flat_off'
                      ? 'Coupon $ Off'
                      : 'Bundle Total Price ($)'}
                  </label>
                  <input
                    id={`input-deal-val-${offer.id}`}
                    type="number"
                    step="any"
                    value={offer.dealValue || ''}
                    onChange={(e) => handleChange('dealValue', parseFloat(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()}
                    placeholder={
                      offer.dealType === 'percent_off' ? 'e.g. 20' : 'e.g. 1.50'
                    }
                    className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Calculated Unit Price Output Card */}
        <div
          className={`p-2 sm:p-2.5 rounded-xl flex items-center justify-between ${
            isBestValue && totalOffersCount > 1
              ? 'bg-emerald-600 text-white'
              : isWorstValue && totalOffersCount > 1
              ? 'bg-rose-100 text-rose-900 border border-rose-200'
              : 'bg-slate-900 text-white'
          }`}
        >
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] sm:text-[11px] opacity-90 font-bold tracking-wide uppercase shrink-0">
                Unit Price:
              </span>
              <span className="text-sm sm:text-base font-black tracking-tight truncate">
                {offer.size <= 0 || offer.price <= 0 ? (
                  <span className="text-[11px] sm:text-xs font-medium text-amber-200">
                    {offer.size <= 0 && offer.price <= 0
                      ? 'Enter Details'
                      : offer.size <= 0
                      ? 'Enter Size'
                      : 'Enter Price'}
                  </span>
                ) : (
                  <>
                    {formatUnitPrice(unitPrice)}{' '}
                    <span className="text-[11px] font-normal opacity-85">/ {referenceBase}</span>
                  </>
                )}
              </span>
            </div>
            {effectivePrice !== offer.price && offer.price > 0 && (
              <div className="text-[10px] sm:text-[11px] opacity-90">
                Effective: ${effectivePrice.toFixed(2)} (after deal)
              </div>
            )}
          </div>

          {isBestValue && savingsPercentage > 0 && totalOffersCount > 1 && (
            <div className="text-right">
              <div className="text-[11px] sm:text-xs font-bold text-emerald-100 bg-emerald-700/80 px-2 py-0.5 rounded-md inline-block">
                Saves {savingsPercentage}%
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
