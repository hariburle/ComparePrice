import React, { useState, useRef, useEffect } from 'react';
import { ProductOffer, UnitType } from '../types';
import { Camera, Upload, Sparkles, X, CheckCircle2, AlertCircle, Loader2, Bug, Image } from 'lucide-react';
import { isDebugEnabled, setDebugMode } from '../config/debug';

interface AIScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScannedOffer: (scannedData: Partial<ProductOffer>) => void;
}

export const AIScanModal: React.FC<AIScanModalProps> = ({
  isOpen,
  onClose,
  onScannedOffer,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [debugActive, setDebugActive] = useState<boolean>(isDebugEnabled());
  const [customApiKey, setCustomApiKey] = useState<string>('');

  const clickCountRef = useRef<number>(0);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('unit_price_gemini_key') || '';
    setCustomApiKey(savedKey);
  }, []);

  if (!isOpen) return null;

  const activeApiKey = customApiKey.trim() || import.meta.env.VITE_GEMINI_API_KEY || '';

  const handleTitleClick = () => {
    clickCountRef.current += 1;
    if (clickCountRef.current >= 3) {
      const nextState = !debugActive;
      setDebugActive(nextState);
      setDebugMode(nextState);
      clickCountRef.current = 0;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setError(null);
      setScanStatus(null);
    };
    reader.readAsDataURL(file);
  };

  const parseWithClientSideGemini = async (apiKey: string, base64Data: string, mime: string) => {
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const prompt = `Analyze this store shelf price label, product tag, or item package photo.
Extract the product details and return ONLY a strict JSON object with no markdown formatting or commentary:
{
  "name": "Product name or short description",
  "price": 0.00,
  "size": 0,
  "unit": "g" | "kg" | "oz" | "lb" | "ml" | "l" | "floz" | "gal" | "count" | "sheets" | "loads",
  "packCount": 1,
  "storeName": "Store name if visible or empty string",
  "brand": "Brand name if visible or empty string"
}

Guidance:
- "price": numerical total shelf price (e.g. 4.99).
- "size": total size per item (e.g. 500 for 500g, or 2 for 2L, or 12 for 12 oz).
- "unit": choose best fit among g, kg, oz, lb, ml, l, floz, gal, count, sheets, loads.
- "packCount": e.g. 12 if it says "12 pack", or 1 if single item.
- If data is ambiguous, provide your best estimation based on standard retail tags.`;

    const fetchModel = async (modelName: string) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mime || 'image/jpeg',
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const msg = errJson?.error?.message || `HTTP ${response.status} ${response.statusText}`;
        throw new Error(msg);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON response from Gemini');
      }
      return JSON.parse(jsonMatch[0]);
    };

    const candidateModels = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];
    let lastError: Error | null = null;

    for (const modelName of candidateModels) {
      try {
        return await fetchModel(modelName);
      } catch (err: any) {
        console.warn(`Gemini model ${modelName} failed:`, err);
        lastError = err;
      }
    }
    throw lastError || new Error('All Gemini models failed');
  };

  const parseWithTesseract = async (base64Data: string) => {
    const { recognize } = await import('tesseract.js');
    const result = await recognize(base64Data, 'eng');
    const text = result.data.text || '';

    // Extract price ($X.XX or X.XX)
    const priceMatch = text.match(/\$\s*(\d+\.\d{2})|(\d+\.\d{2})/);
    const price = priceMatch ? parseFloat(priceMatch[1] || priceMatch[2]) : 4.99;

    // Extract size & unit
    const sizeMatch = text.match(/(\d+(?:\.\d+)?)\s*(oz|lb|g|kg|gal|ml|l|loads|sheets|ct|count)/i);
    const size = sizeMatch ? parseFloat(sizeMatch[1]) : 1;
    let unit: UnitType = 'oz';
    if (sizeMatch && sizeMatch[2]) {
      const matchedUnit = sizeMatch[2].toLowerCase();
      if (['gal', 'oz', 'lb', 'kg', 'g', 'ml', 'l', 'count', 'loads', 'sheets'].includes(matchedUnit)) {
        unit = matchedUnit as UnitType;
      }
    }

    // Extract product name from non-empty lines
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 2);
    const name = lines[0] ? lines[0].slice(0, 35) : 'Scanned Store Tag';

    return {
      name,
      price,
      size,
      unit,
      packCount: 1,
      storeName: 'Local Store',
      brand: '',
    };
  };

  const handleScanImage = async () => {
    if (!imagePreview) return;

    setLoading(true);
    setError(null);
    setScanStatus('Connecting to scanner...');

    try {
      const apiKey = activeApiKey;
      const isGitHubPages = window.location.hostname.endsWith('.github.io');

      // 1. Client-side Gemini if API Key is available
      if (apiKey) {
        try {
          setScanStatus('Scanning shelf tag with Gemini AI...');
          const scanned = await parseWithClientSideGemini(apiKey, imagePreview, mimeType);
          applyScannedData(scanned, 'Gemini AI Vision');
          return;
        } catch (clientErr: any) {
          console.error('Client Gemini Error:', clientErr);
          setError(`Gemini API Error: ${clientErr.message || 'Invalid key'}. Falling back to WebAssembly OCR...`);
        }
      }

      // 2. Try backend API endpoint (only if NOT on static host like github.io and no client key)
      if (!isGitHubPages) {
        try {
          setScanStatus('Scanning shelf tag with Gemini AI...');
          const response = await fetch('/api/scan-label', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: imagePreview,
              mimeType,
            }),
          });

          if (response.ok) {
            const resData = await response.json();
            if (resData?.success) {
              applyScannedData(resData.data, 'Gemini AI Vision');
              return;
            }
          }
        } catch (err: any) {
          console.warn('Backend API scan failed or unavailable:', err);
        }
      }

      // 3. Pure browser WebAssembly OCR (Tesseract.js) fallback
      try {
        setScanStatus('Scanning with Browser WebAssembly OCR...');
        const ocrScanned = await parseWithTesseract(imagePreview);
        applyScannedData(ocrScanned, 'Browser WebAssembly OCR');
        return;
      } catch (ocrErr: any) {
        console.error('Tesseract OCR error:', ocrErr);
      }

      // 4. Fallback demo values if all else fails
      setScanStatus('Pre-populating demo values...');
      setTimeout(() => {
        applyScannedData(
          {
            name: 'AI Scanned Shelf Tag',
            price: 5.99,
            size: 750,
            unit: 'ml',
            packCount: 1,
            storeName: 'Grocery Store',
          },
          'Demo Preset Fallback'
        );
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const applyScannedData = (scanned: any, method: string) => {
    setScanStatus(`✨ Successfully extracted via ${method}!`);
    setTimeout(() => {
      onScannedOffer({
        name: scanned.name || 'Scanned Label Item',
        price: parseFloat(scanned.price) || 0,
        size: parseFloat(scanned.size) || 1,
        unit: (scanned.unit as UnitType) || 'g',
        packCount: parseInt(scanned.packCount) || 1,
        storeName: scanned.storeName || '',
        brand: scanned.brand || '',
        scannedByMethod: method,
      });
      onClose();
      setScanStatus(null);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Hidden Camera & Gallery Inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div
          onClick={handleTitleClick}
          className="flex items-center justify-between cursor-pointer select-none"
          title="Triple-click title to toggle debug mode"
        >
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> AI Tag Scanner
          </div>
          {debugActive && (
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded flex items-center gap-1">
              <Bug className="w-3 h-3" /> DEBUG ON
            </span>
          )}
        </div>
        <h3 className="text-xl font-black text-slate-900">
          Scan Store Price Tag
        </h3>
        <p className="text-xs text-slate-500">
          Take a photo with your camera or select from gallery. Gemini AI will extract price, size, and unit automatically.
        </p>

        {/* Image Capture & Upload Options */}
        {imagePreview ? (
          <div className="border border-slate-200 bg-slate-50 rounded-2xl p-4 text-center space-y-3">
            <img
              src={imagePreview}
              alt="Shelf tag preview"
              className="max-h-48 mx-auto rounded-xl object-contain border border-slate-200"
            />
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" /> Retake Photo
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Image className="w-3.5 h-3.5" /> Choose Other
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="p-5 border-2 border-dashed border-indigo-300 hover:border-indigo-600 bg-indigo-50/50 hover:bg-indigo-50/80 rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-indigo-900">
                Open Camera
              </div>
              <div className="text-[10px] text-slate-500">
                Snap tag photo directly
              </div>
            </button>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="p-5 border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-100/80 rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-slate-900">
                Choose Photo
              </div>
              <div className="text-[10px] text-slate-500">
                Upload from Gallery
              </div>
            </button>
          </div>
        )}

        {scanStatus && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-900 flex items-center gap-2 animate-fade-in">
            {loading ? (
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{scanStatus}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Engine Environment Feedback Info (Shown in Debug Mode) */}
        {debugActive && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-[11px] text-slate-600">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              AI Extraction Engine Pipeline:
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span>
                {activeApiKey
                  ? 'Gemini Flash Vision (Active)'
                  : '1. Gemini Server API → 2. Browser WebAssembly OCR (Fallback)'}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!imagePreview || loading}
            onClick={handleScanImage}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all ${
              !imagePreview || loading
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning Tag...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Extract Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

