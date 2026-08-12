import React, { useState } from 'react';
import appLogo from './assets/logo.jpg';
import { ProductOffer, ReferenceBase, UnitCategory } from './types';
import { compareProductOffers, getUnitCategory } from './utils/units';
import { ProductCard } from './components/ProductCard';
import { ComparisonSummary } from './components/ComparisonSummary';
import { CategoryPresets } from './components/CategoryPresets';
import { AIScanModal } from './components/AIScanModal';
import { HistoryModal } from './components/HistoryModal';
import {
  Scale,
  Plus,
  RotateCcw,
  Sparkles,
  LayoutGrid,
  History,
  Smartphone,
} from 'lucide-react';

export default function App() {
  const [logoError, setLogoError] = useState<boolean>(false);
  // Track if user has started using/customizing the app
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  // Initial offer: start with 1 item
  const [products, setProducts] = useState<ProductOffer[]>([
    {
      id: 'p1',
      name: 'Standard Box (450g)',
      price: 4.49,
      quantity: 1,
      size: 450,
      unit: 'g',
      packCount: 1,
      dealType: 'none',
      dealValue: 0,
      storeName: 'Local Grocery',
    },
  ]);

  const [referenceBase, setReferenceBase] = useState<ReferenceBase>('100g');
  const [activeScanIndex, setActiveScanIndex] = useState<number | null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [scanToast, setScanToast] = useState<string | null>(null);

  // Determine dominant unit category
  const primaryUnit = products[0]?.unit || 'g';
  const unitCategory: UnitCategory = getUnitCategory(primaryUnit);

  // Standardized comparison calculations
  const comparisons = compareProductOffers(products, referenceBase);

  // Add new product option
  const handleAddProduct = () => {
    setHasStarted(true);
    const newId = `p_${Date.now()}`;
    const newProduct: ProductOffer = {
      id: newId,
      name: `Item ${products.length + 1}`,
      price: 0,
      quantity: 1,
      size: products[0]?.size || 100,
      unit: products[0]?.unit || 'g',
      packCount: 1,
      dealType: 'none',
      dealValue: 0,
    };
    setProducts([...products, newProduct]);
  };

  // Update existing product
  const handleUpdateProduct = (updated: ProductOffer) => {
    setHasStarted(true);
    setProducts(products.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Remove product option
  const handleRemoveProduct = (id: string) => {
    setHasStarted(true);
    if (products.length <= 1) return;
    setProducts(products.filter((p) => p.id !== id));
  };

  // Duplicate option
  const handleDuplicateProduct = (index: number) => {
    setHasStarted(true);
    const target = products[index];
    if (!target) return;
    const duplicated: ProductOffer = {
      ...target,
      id: `p_${Date.now()}`,
      name: `${target.name} (Copy)`,
    };
    const updated = [...products];
    updated.splice(index + 1, 0, duplicated);
    setProducts(updated);
  };

  // Reset calculator
  const handleReset = () => {
    setHasStarted(false);
    setProducts([
      {
        id: 'p1',
        name: 'Item 1',
        price: 0,
        quantity: 1,
        size: 100,
        unit: 'g',
        packCount: 1,
        dealType: 'none',
        dealValue: 0,
      },
    ]);
  };

  // Load preset scenario
  const handleSelectPreset = (
    presetOffers: ProductOffer[],
    refBase: ReferenceBase,
    _title: string
  ) => {
    setProducts(presetOffers);
    setReferenceBase(refBase);
    setHasStarted(true);
  };

  // Handle scanned AI camera output
  const handleScannedOffer = (scannedData: Partial<ProductOffer>) => {
    setHasStarted(true);
    const methodTag = scannedData.scannedByMethod || 'AI Vision Scan';
    setScanToast(`✨ Extracted via ${methodTag}: ${scannedData.name || 'Item'} ($${scannedData.price?.toFixed(2)}, ${scannedData.size} ${scannedData.unit})`);
    setTimeout(() => setScanToast(null), 5000);

    if (activeScanIndex !== null && products[activeScanIndex]) {
      const target = products[activeScanIndex];
      handleUpdateProduct({
        ...target,
        ...scannedData,
      });
    } else {
      const newOffer: ProductOffer = {
        id: `p_${Date.now()}`,
        name: scannedData.name || 'Scanned Item',
        price: scannedData.price || 0,
        quantity: 1,
        size: scannedData.size || 100,
        unit: scannedData.unit || 'g',
        packCount: scannedData.packCount || 1,
        dealType: 'none',
        dealValue: 0,
        storeName: scannedData.storeName || '',
        scannedByMethod: scannedData.scannedByMethod,
      };
      setProducts([...products, newOffer]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Mobile App Bar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-3.5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!logoError ? (
              <img
                src={appLogo}
                alt="App Logo"
                className="w-7 h-7 rounded-lg object-cover border border-emerald-500/30 shadow-sm"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shadow-sm">
                <Scale className="w-4 h-4 text-emerald-400" />
              </div>
            )}
            <div>
              <h1 className="text-sm font-black tracking-tight leading-none">
                Unit Price Compare
              </h1>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                Instant Bargain Finder
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="header-reset-btn"
              type="button"
              onClick={handleReset}
              className="p-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
              title="Reset All Items"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              id="header-history-btn"
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              className="p-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
              title="Saved Comparisons"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Saved</span>
            </button>

            <button
              id="header-scan-btn"
              type="button"
              onClick={() => {
                setActiveScanIndex(null);
                setIsScanModalOpen(true);
              }}
              className="p-1.5 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
              title="Scan Tag with AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Scan</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-3 space-y-3">
        {/* Scan Feedback Banner */}
        {scanToast && (
          <div className="p-3 bg-indigo-900 text-white rounded-2xl text-xs font-bold shadow-lg border border-indigo-700 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{scanToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setScanToast(null)}
              className="text-slate-300 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-indigo-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* Quick Presets Row - shown at start before user begins comparing */}
        {!hasStarted && (
          <CategoryPresets onSelectPreset={handleSelectPreset} />
        )}

        {/* Comparison Winner & Matrix Summary */}
        <ComparisonSummary
          comparisons={comparisons}
          products={products}
          referenceBase={referenceBase}
          onReferenceBaseChange={(base) => setReferenceBase(base)}
          unitCategory={unitCategory}
          onOpenSavedHistory={() => setIsHistoryModalOpen(true)}
        />

        {/* Offers Header Control */}
        <div className="flex items-center justify-between pt-1">
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Compare Items ({products.length})
          </h2>

          <div className="flex items-center gap-2">
            {hasStarted && (
              <button
                id="show-presets-btn"
                type="button"
                onClick={() => setHasStarted(false)}
                className="p-1 px-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors flex items-center gap-1"
              >
                <LayoutGrid className="w-3 h-3 text-indigo-500" /> Presets
              </button>
            )}
            <button
              id="reset-offers-btn"
              type="button"
              onClick={handleReset}
              className="p-1 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
          {products.map((offer, idx) => {
            const comp = comparisons.find((c) => c.productId === offer.id);

            return (
              <ProductCard
                key={offer.id}
                offer={offer}
                index={idx}
                referenceBase={referenceBase}
                isBestValue={comp?.isBestValue || false}
                isWorstValue={comp?.isWorstValue || false}
                priceRank={comp?.priceRank || idx + 1}
                totalOffersCount={products.length}
                savingsPercentage={comp?.savingsPercentageVsWorst || 0}
                onUpdate={handleUpdateProduct}
                onRemove={() => handleRemoveProduct(offer.id)}
                onDuplicate={() => handleDuplicateProduct(idx)}
                onScanClick={() => {
                  setActiveScanIndex(idx);
                  setIsScanModalOpen(true);
                }}
              />
            );
          })}

          {/* Add Offer Card in Grid */}
          <button
            id="add-offer-btn"
            type="button"
            onClick={handleAddProduct}
            className="group relative bg-white/90 hover:bg-emerald-50/60 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-5 transition-all duration-200 flex flex-col items-center justify-center min-h-[160px] sm:min-h-[220px] gap-2 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20 active:scale-[0.99] shadow-xs hover:shadow-md cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-emerald-100/80 group-hover:bg-emerald-500 text-emerald-700 group-hover:text-white flex items-center justify-center transition-colors shadow-xs">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="block font-black text-xs sm:text-sm text-slate-800 group-hover:text-emerald-950">
                Add Another Item / Offer
              </span>
              <span className="block text-[11px] sm:text-xs text-slate-500 group-hover:text-emerald-700 mt-0.5">
                Compare price per unit for another option
              </span>
            </div>
          </button>
        </div>
      </main>

      {/* AI Shelf Tag Scan Modal */}
      <AIScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onScannedOffer={handleScannedOffer}
      />

      {/* Saved Comparisons History Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        currentOffers={products}
        currentReferenceBase={referenceBase}
        onLoadComparison={(loadedOffers, refBase) => {
          setProducts(loadedOffers);
          setReferenceBase(refBase);
        }}
      />
    </div>
  );
}

