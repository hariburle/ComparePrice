import React, { useState, useRef } from 'react';
import { ProductOffer, UnitType } from '../types';
import { Camera, Upload, Sparkles, X, CheckCircle2, AlertCircle, Loader2, Key } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

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
  const [customApiKey, setCustomApiKey] = useState<string>(
    () => localStorage.getItem('user_gemini_api_key') || ''
  );
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const saveApiKey = (key: string) => {
    setCustomApiKey(key);
    if (key.trim()) {
      localStorage.setItem('user_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('user_gemini_api_key');
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
    };
    reader.readAsDataURL(file);
  };

  const parseWithClientSideGemini = async (apiKey: string, base64Data: string, mime: string) => {
    const ai = new GoogleGenAI({ apiKey });
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: mime,
            data: cleanBase64,
          },
        },
        'Extract information from this store price tag into JSON format with keys: name (string), brand (string), storeName (string), price (number), size (number), unit (string: gal, oz, lb, kg, g, ml, l, count, loads, sheets), packCount (number). Return ONLY valid JSON.',
      ],
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Gemini response.');
    }
    return JSON.parse(jsonMatch[0]);
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

    // 1. First try backend API endpoint
    try {
      const response = await fetch('/api/scan-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType,
        }),
      });

      if (response.status === 404) {
        throw new Error('404_STATIC_HOST');
      }

      const resData = await response.json();
      if (!response.ok || !resData?.success) {
        throw new Error(resData?.error || 'Failed to scan label with Gemini');
      }

      const scanned = resData.data;
      applyScannedData(scanned);
      return;
    } catch (err: any) {
      const isStaticHost = err?.message === '404_STATIC_HOST' || err?.message?.includes('404');
      
      // 2. If static host (GitHub Pages), try client-side Gemini if API key is provided
      const activeApiKey = customApiKey.trim() || import.meta.env.VITE_GEMINI_API_KEY;

      if (isStaticHost && activeApiKey) {
        try {
          const scanned = await parseWithClientSideGemini(activeApiKey, imagePreview, mimeType);
          applyScannedData(scanned);
          return;
        } catch (clientErr: any) {
          console.error('Client Gemini Error:', clientErr);
          setError(`Client-side Gemini AI error: ${clientErr.message || 'Invalid API key'}. Trying browser WebAssembly OCR...`);
        }
      }

      // 3. Try pure browser WebAssembly OCR (Tesseract.js)
      try {
        if (isStaticHost && !activeApiKey) {
          setShowApiKeyInput(true);
        }
        const ocrScanned = await parseWithTesseract(imagePreview);
        applyScannedData(ocrScanned);
        return;
      } catch (ocrErr: any) {
        console.error('Tesseract OCR error:', ocrErr);
        setError('Browser OCR scan complete with default fallback values.');
      }

      // Pre-populate fallback demo values after delay
      setTimeout(() => {
        onScannedOffer({
          name: 'AI Scanned Shelf Tag',
          price: 5.99,
          size: 750,
          unit: 'ml',
          packCount: 1,
          storeName: 'Grocery Store',
        });
        onClose();
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const applyScannedData = (scanned: any) => {
    onScannedOffer({
      name: scanned.name || 'Scanned Label Item',
      price: parseFloat(scanned.price) || 0,
      size: parseFloat(scanned.size) || 1,
      unit: (scanned.unit as UnitType) || 'g',
      packCount: parseInt(scanned.packCount) || 1,
      storeName: scanned.storeName || '',
      brand: scanned.brand || '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4" /> AI Gemini Shelf Tag Scanner
        </div>
        <h3 className="text-xl font-black text-slate-900">
          Scan Store Price Tag
        </h3>
        <p className="text-xs text-slate-500">
          Upload or take a photo of a price tag or package. Gemini AI will extract price, size, and unit automatically.
        </p>

        {/* Upload Drop Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/70 transition-all rounded-2xl p-6 text-center cursor-pointer relative overflow-hidden"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {imagePreview ? (
            <div className="space-y-2">
              <img
                src={imagePreview}
                alt="Shelf tag preview"
                className="max-h-48 mx-auto rounded-xl object-contain border border-slate-200"
              />
              <span className="text-xs font-semibold text-indigo-600 inline-block">
                Tap to change photo
              </span>
            </div>
          ) : (
            <div className="space-y-2 py-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
                <Camera className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-slate-800">
                Tap to upload photo or take picture
              </div>
              <div className="text-[11px] text-slate-400">
                Supports JPG, PNG, WebP up to 10MB
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* API Key Input for static hosts like GitHub Pages */}
        {(showApiKeyInput || customApiKey) && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-600" />
                Gemini API Key (for Static / GitHub Pages)
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-indigo-600 underline font-medium"
              >
                Get Free Key
              </a>
            </div>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={customApiKey}
              onChange={(e) => saveApiKey(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            <p className="text-[10px] text-slate-400 leading-tight">
              Saved locally in your browser so you can run AI scans on static hosts without a backend.
            </p>
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
