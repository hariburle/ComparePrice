import React, { useState } from 'react';
import appLogo from './assets/logo.jpg';
import { ProductOffer, ReferenceBase, UnitCategory } from './types';
import { compareProductOffers, getUnitCategory } from './utils/units';
import { ProductCard } from './components/ProductCard';
import { ComparisonSummary } from './components/ComparisonSummary';
import { CategoryPresets } from './components/CategoryPresets';
import { AIScanModal } from './components/AIScanModal';
import { HistoryModal } from './components/HistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { WalkthroughGuide } from './components/WalkthroughGuide';
import { CATEGORY_PRESETS } from './config/presets';
import {
  Scale,
  Plus,
  RotateCcw,
  Sparkles,
  LayoutGrid,
  History,
  Smartphone,
  Settings,
  Menu,
  ChevronDown,
  BookOpen,
} from 'lucide-react';

export default function App() {
  const [logoError, setLogoError] = useState<boolean>(false);
  // Track if user has started using/customizing the app
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [showHelpGuide, setShowHelpGuide] = useState<boolean>(() => {
    return localStorage.getItem('unit_price_hide_help') !== 'true';
  });
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Initial offer: start with empty list
  const [products, setProducts] = useState<ProductOffer[]>([]);

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
    if (products.length <= 1) {
      setProducts([]);
      return;
    }
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
    setProducts([]);
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
              <h1 className="text-sm sm:text-base font-black tracking-tight leading-none">
                Unit Price Compare
              </h1>
            </div>
          </div>

          {/* Streamlined consolidated options dropdown menu */}
          <div className="relative">
            <button
              id="header-menu-btn"
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700/50 cursor-pointer shadow-xs"
              title="App Options"
            >
              <Menu className="w-4 h-4 text-emerald-400" />
              <span>Menu</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMenuOpen && (
              <>
                {/* Backdrop trigger to close menu on outside tap */}
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={() => setIsMenuOpen(false)} 
                />
                <div 
                  id="header-dropdown-menu"
                  className="absolute right-0 mt-2 w-52 bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-fade-in divide-y divide-slate-100"
                >
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowHelpGuide(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      <span>How It Works / Help</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsHistoryModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <History className="w-4 h-4 text-amber-500" />
                      <span>Saved Comparisons</span>
                    </button>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSettingsOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>App Settings</span>
                    </button>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleReset();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-rose-50 text-xs font-bold text-rose-600 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-rose-500" />
                      <span>Reset Calculator</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-3 space-y-3">
        {/* Walkthrough / Explanatory Help Guide */}
        {showHelpGuide && (
          <WalkthroughGuide
            onClose={() => {
              setShowHelpGuide(false);
              localStorage.setItem('unit_price_hide_help', 'true');
            }}
          />
        )}

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

        {products.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 text-center shadow-xs flex flex-col items-center max-w-xl mx-auto my-6 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
              <Scale className="w-8 h-8 stroke-[1.5]" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Compare Prices & Save Money
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                Compare unit prices of different sizes, package weights, or deals to get the best value instantly.
              </p>
            </div>

            <div className="w-full space-y-2 pt-2">
              <button
                id="empty-add-btn"
                type="button"
                onClick={handleAddProduct}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Your First Item</span>
              </button>

              <button
                id="empty-scan-btn"
                type="button"
                onClick={() => {
                  setActiveScanIndex(null);
                  setIsScanModalOpen(true);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Scan Store Label / Tag</span>
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">or pick a preset</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Preset buttons layout inside empty card */}
              <div className="grid grid-cols-2 gap-2">
                {CATEGORY_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      id={`empty-preset-btn-${preset.id}`}
                      type="button"
                      onClick={() => {
                        handleSelectPreset(preset.offers, preset.referenceBase, preset.title);
                      }}
                      className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${preset.color}`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Quick Presets Row - shown at start before user begins comparing */}
            {products.length > 0 && !hasStarted && (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 items-stretch">
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

              {/* Add / Scan Choice Card in Grid */}
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col justify-center min-h-[160px] sm:min-h-[220px] gap-2">
                <button
                  id="add-offer-btn"
                  type="button"
                  onClick={handleAddProduct}
                  className="flex-1 flex items-center gap-3 p-3 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/60 hover:border-emerald-300 rounded-xl transition-all cursor-pointer group text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="block font-bold text-xs sm:text-sm text-slate-800">
                      Add Another Item
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      Type details manually
                    </span>
                  </div>
                </button>

                <button
                  id="scan-offer-btn"
                  type="button"
                  onClick={() => {
                    setActiveScanIndex(null);
                    setIsScanModalOpen(true);
                  }}
                  className="flex-1 flex items-center gap-3 p-3 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/60 hover:border-indigo-300 rounded-xl transition-all cursor-pointer group text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                    <Sparkles className="w-4 h-4 text-indigo-600 group-hover:text-amber-300" />
                  </div>
                  <div>
                    <span className="block font-bold text-xs sm:text-sm text-slate-800">
                      Scan Store Label / Tag
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      Auto-extract with AI camera
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
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

      {/* App Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

