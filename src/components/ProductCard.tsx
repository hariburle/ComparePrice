import React, { useState } from 'react';
import { ProductOffer, ReferenceBase, UnitType } from '../types';
import { calculateEffectivePrice, calculateTotalBaseUnits, formatUnitLabel, formatUnitPrice, getReferenceBaseUnitFactor } from '../utils/units';
import { Trash2, Copy, Sparkles, Tag, ChevronDown, ChevronUp, Store, Package, Check, Share2, CopyPlus } from 'lucide-react';
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
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-800 text-white text-xs font-bold">
            #{index + 1}
          </span>

          {totalOffersCount > 1 && (
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full border ${getRankBadgeClass()}`}
            >
              {isBestValue
                ? '🏆 Best Value'
                : isWorstValue
                ? 'Highest Cost'
                : `#${priceRank} Rank`}
            </span>
          )}

          {isDebugEnabled() && offer.scannedByMethod && (
            <span
              className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1"
              title={`Extracted via ${offer.scannedByMethod}`}
            >
              <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
              <span>{offer.scannedByMethod}</span>
            </span>
          )}
        </div>

        {/* Card Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold px-2"
            title="Share item details"
          >
            {sharedItem ? <Check className="w-3.5 h-3.5 text-indigo-600" /> : <Share2 className="w-3.5 h-3.5 text-indigo-600" />}
            <span className="hidden sm:inline">{sharedItem ? 'Shared!' : 'Share'}</span>
          </button>
          <button
            type="button"
            onClick={handleCopyDetails}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold px-2"
            title="Copy item details to clipboard"
          >
            {copiedItem ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span className="hidden sm:inline">{copiedItem ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            id={`scan-btn-${offer.id}`}
            type="button"
            onClick={onScanClick}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Scan Shelf Tag Photo"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            id={`duplicate-btn-${offer.id}`}
            type="button"
            onClick={onDuplicate}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Duplicate Item"
          >
            <CopyPlus className="w-4 h-4" />
          </button>
          <button
            id={`remove-btn-${offer.id}`}
            type="button"
            onClick={onRemove}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Remove Offer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3.5">
        {/* Name & Store Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Item
            </label>
            <input
              id={`input-name-${offer.id}`}
              type="text"
              value={offer.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="e.g. Family Pack, 12-Can Case"
              className="w-full text-sm font-semibold text-slate-900 bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1 flex items-center gap-1">
              <Store className="w-3 h-3" /> <span className="hidden sm:inline">Store (Optional)</span><span className="sm:hidden">Store</span>
            </label>
            <input
              id={`input-store-${offer.id}`}
              type="text"
              value={offer.storeName || ''}
              onChange={(e) => handleChange('storeName', e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="Costco, Target..."
              className="w-full text-xs text-slate-800 bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>
        </div>

        {/* Price & Size Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Price */}
          <div className="min-w-0">
            <label className="h-5 flex items-center text-[11px] font-medium text-slate-500 mb-1 truncate">
              <span className="hidden sm:inline">Shelf </span>Price ($)
            </label>
            <div className={`flex items-center bg-slate-50 border rounded-xl px-2.5 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-800 focus-within:border-transparent transition-all ${
              offer.price <= 0 ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'
            }`}>
              <span className="text-slate-400 text-sm font-semibold mr-1 select-none shrink-0">
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
                className="w-full text-base font-bold text-slate-900 bg-transparent border-none p-0 focus:outline-none min-w-0"
              />
            </div>
            {offer.price <= 0 && (
              <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">
                Enter price &gt; $0
              </span>
            )}
          </div>

          {/* Size */}
          <div className="min-w-0">
            <label
              className="h-5 flex items-center text-[11px] font-medium text-slate-500 mb-1 truncate"
              title="Size"
            >
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
              className={`w-full text-base font-semibold text-slate-900 bg-slate-50 border rounded-xl px-2.5 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800 min-w-0 ${
                offer.size <= 0 ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
              }`}
            />
            {offer.size <= 0 && (
              <span className="text-[10px] text-rose-600 font-medium mt-0.5 block">
                Enter size &gt; 0
              </span>
            )}
          </div>

          {/* Unit */}
          <div className="min-w-0">
            <label className="h-5 flex items-center text-[11px] font-medium text-slate-500 mb-1 truncate">
              Unit
            </label>
            <select
              id={`select-unit-${offer.id}`}
              value={offer.unit}
              onChange={(e) => handleChange('unit', e.target.value as UnitType)}
              className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800 min-w-0 truncate"
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

          {/* Multi-Pack Count */}
          <div className="min-w-0">
            <label className="h-5 flex items-center gap-1 text-[11px] font-medium text-slate-500 mb-1 truncate">
              <Package className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">Pack Qty</span>
              <span className="sm:hidden">Pack</span>
            </label>
            <input
              id={`input-pack-${offer.id}`}
              type="number"
              min="1"
              value={offer.packCount || 1}
              onChange={(e) => handleChange('packCount', parseInt(e.target.value) || 1)}
              onFocus={(e) => e.target.select()}
              className="w-full text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800 min-w-0"
            />
          </div>
        </div>

        {/* Deals & Coupons Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowDeals(!showDeals)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors py-1"
          >
            <Tag className="w-3.5 h-3.5" />
            {offer.dealType !== 'none'
              ? `Coupon / Deal: ${offer.dealType.replace('_', ' ')}`
              : 'Coupon / Deal'}
            {showDeals ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDeals && (
            <div className="mt-2 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
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
          className={`p-3.5 rounded-xl flex items-center justify-between ${
            isBestValue && totalOffersCount > 1
              ? 'bg-emerald-600 text-white'
              : isWorstValue && totalOffersCount > 1
              ? 'bg-rose-100 text-rose-900 border border-rose-200'
              : 'bg-slate-900 text-white'
          }`}
        >
          <div>
            <div className="text-[11px] opacity-80 font-medium tracking-wide uppercase">
              Unit Price
            </div>
            <div className="text-xl font-black tracking-tight">
              {offer.size <= 0 || offer.price <= 0 ? (
                <span className="text-base font-bold text-amber-200">
                  {offer.size <= 0 && offer.price <= 0
                    ? 'Enter Price & Size'
                    : offer.size <= 0
                    ? 'Enter Size'
                    : 'Enter Price'}
                </span>
              ) : (
                <>
                  {formatUnitPrice(unitPrice)}{' '}
                  <span className="text-xs font-normal opacity-90">/ {referenceBase}</span>
                </>
              )}
            </div>
            {effectivePrice !== offer.price && offer.price > 0 && (
              <div className="text-[11px] opacity-90 mt-0.5">
                Effective Total: ${effectivePrice.toFixed(2)} (after deal)
              </div>
            )}
          </div>

          <div className="text-right">
            <div className="text-xs font-semibold">
              Total Net Size:
            </div>
            <div className="text-sm font-bold">
              {totalBaseUnits > 1000 && ['g', 'ml'].includes(offer.unit)
                ? `${(totalBaseUnits / 1000).toFixed(2)} ${
                    offer.unit === 'g' ? 'kg' : 'L'
                  }`
                : `${totalBaseUnits.toFixed(1)} ${offer.unit}`}
            </div>
            {isBestValue && savingsPercentage > 0 && totalOffersCount > 1 && (
              <div className="text-xs font-bold text-emerald-200 bg-emerald-700/80 px-2 py-0.5 rounded-md mt-1 inline-block">
                Saves {savingsPercentage}%
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
