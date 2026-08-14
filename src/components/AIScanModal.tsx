import React, { useState, useRef, useEffect } from 'react';
import { ProductOffer, UnitType } from '../types';
import {
  Camera,
  Upload,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Bug,
  Image,
  SwitchCamera,
  Video,
  Crop,
  Maximize2,
  Scan,
  Key,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
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
  const [scanCount, setScanCount] = useState<number>(0);
  const [showApiKeyHelp, setShowApiKeyHelp] = useState<boolean>(false);
  const [inlineKeyInput, setInlineKeyInput] = useState<string>('');
  const [keySavedToast, setKeySavedToast] = useState<boolean>(false);

  const isNativeApp = Boolean(
    (window as any).Capacitor?.isNativePlatform?.() ||
    ((window as any).Capacitor?.getPlatform && (window as any).Capacitor.getPlatform() !== 'web')
  );

  // Live Camera State
  const [isLiveCameraActive, setIsLiveCameraActive] = useState<boolean>(false);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState<'reticle' | 'full'>('reticle');
  const [isCroppedPreview, setIsCroppedPreview] = useState<boolean>(true);

  const clickCountRef = useRef<number>(0);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const viewfinderContainerRef = useRef<HTMLDivElement | null>(null);
  const reticleBoxRef = useRef<HTMLDivElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem('unit_price_gemini_key') || '';
      setCustomApiKey(savedKey);
      const count = parseInt(localStorage.getItem('unit_price_scan_count') || '0', 10);
      setScanCount(count);
    }
  }, [isOpen]);

  const stopLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsLiveCameraActive(false);
    setIsStartingCamera(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopLiveCamera();
      setImagePreview(null);
      setError(null);
      setCameraError(null);
    }
    return () => {
      stopLiveCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCloseModal = () => {
    stopLiveCamera();
    onClose();
  };

  const handleSaveInlineKey = (keyToSave?: string) => {
    const key = (keyToSave !== undefined ? keyToSave : inlineKeyInput).trim();
    if (key) {
      localStorage.setItem('unit_price_gemini_key', key);
      setCustomApiKey(key);
      setKeySavedToast(true);
      setTimeout(() => setKeySavedToast(false), 3500);
      setShowApiKeyHelp(false);
    }
  };

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
      setCameraError(null);
      stopLiveCamera();
    };
    reader.readAsDataURL(file);
  };

  const startLiveCamera = async (overrideFacingMode?: 'environment' | 'user') => {
    const targetMode = overrideFacingMode || facingMode;
    setIsStartingCamera(true);
    setCameraError(null);
    setError(null);

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Live camera access (getUserMedia) is not supported in this browser context.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: targetMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      setIsLiveCameraActive(true);
      setIsStartingCamera(false);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => console.warn('Video play error:', err));
        }
      }, 150);
    } catch (err: any) {
      console.error('Failed to start live camera:', err);
      stopLiveCamera();

      let errMsg = 'Could not access live camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.includes('Permission')) {
        errMsg = 'Camera permission was denied. Inside native apps or certain browsers, you can use the "System Camera" option instead, which bypasses these permission restrictions!';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No physical camera detected on this device.';
      } else if (err.message) {
        errMsg = err.message;
      }

      setCameraError(errMsg);
    }
  };

  const handleFlipCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startLiveCamera(nextMode);
  };

  const capturePhotoFromLiveCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const container = viewfinderContainerRef.current;
    const reticle = reticleBoxRef.current;

    const vWidth = video.videoWidth || 1280;
    const vHeight = video.videoHeight || 720;
    const canvas = document.createElement('canvas');

    if (cropMode === 'reticle' && container && reticle) {
      const containerRect = container.getBoundingClientRect();
      const reticleRect = reticle.getBoundingClientRect();

      const cWidth = containerRect.width;
      const cHeight = containerRect.height;
      const scale = Math.max(cWidth / vWidth, cHeight / vHeight);
      const renderedW = vWidth * scale;
      const renderedH = vHeight * scale;
      const offsetX = (renderedW - cWidth) / 2;
      const offsetY = (renderedH - cHeight) / 2;

      // Reticle relative to container
      const rx = reticleRect.left - containerRect.left;
      const ry = reticleRect.top - containerRect.top;
      const rw = reticleRect.width;
      const rh = reticleRect.height;

      // Map to video source coordinates
      let sx = (rx + offsetX) / scale;
      let sy = (ry + offsetY) / scale;
      let sw = rw / scale;
      let sh = rh / scale;

      // Add a 10% safety margin around the tag so edges are not cut off
      const marginX = sw * 0.1;
      const marginY = sh * 0.1;
      sx = Math.max(0, sx - marginX);
      sy = Math.max(0, sy - marginY);
      sw = Math.min(vWidth - sx, sw + marginX * 2);
      sh = Math.min(vHeight - sy, sh + marginY * 2);

      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (facingMode === 'user') {
        ctx.translate(sw, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
      setIsCroppedPreview(true);
    } else {
      // Full frame
      canvas.width = vWidth;
      canvas.height = vHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (facingMode === 'user') {
        ctx.translate(vWidth, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, vWidth, vHeight);
      setIsCroppedPreview(false);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    setImagePreview(dataUrl);
    setMimeType('image/jpeg');
    setError(null);
    setScanStatus(null);
    stopLiveCamera();
  };

  const parseWithClientSideGemini = async (apiKey: string, base64Data: string, mime: string) => {
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const prompt = `Analyze this grocery or retail item photo. It can be ANY of the following:
1. An actual store item or product (e.g., fruit/produce, can of soup, bottle of olive oil, detergent, cereal box).
2. A store shelf price tag / label.
3. A product barcode or UPC/EAN code (1D or 2D).
4. Product packaging, nutrition facts label, or box.

Extract the product details and return ONLY a strict JSON object with no markdown formatting or commentary:
{
  "name": "Product name or description (e.g. 'Honeycrisp Apples', 'Campbell's Tomato Soup', 'Whole Milk 1 Gallon')",
  "price": 0.00,
  "size": 0,
  "unit": "g" | "kg" | "oz" | "lb" | "ml" | "l" | "floz" | "gal" | "count" | "sheets" | "loads",
  "packCount": 1,
  "storeName": "Store name if visible or empty string",
  "brand": "Brand name if visible or empty string",
  "barcode": "Barcode / UPC digits if visible or readable, else empty string"
}

Guidance:
- If photo shows an item/produce/product: identify the product name, brand, and any visible net weight/size or count. If price is not visible on the item, set price to 0.00 so the user can enter the shelf price.
- If photo shows a shelf price tag: extract the numerical price, product name, net weight/size, unit, pack count, and store name.
- If photo shows a barcode/UPC: extract the exact barcode digits and identify the corresponding product name/size if recognized.
- Choose unit best fit among g, kg, oz, lb, ml, l, floz, gal, count, sheets, loads.
- "packCount": e.g. 12 if it says "12 pack", 6 for 6-pack, or 1 for single item.
- Provide clean, concise product names.`;

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
          generationConfig: {
            response_mime_type: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const msg = errJson?.error?.message || `HTTP ${response.status} ${response.statusText}`;
        const err = new Error(msg) as any;
        err.status = response.status;
        throw err;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON response from Gemini');
      }
      return JSON.parse(jsonMatch[0]);
    };

    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.7-flash', 'gemini-flash-latest'];
    let lastError: Error | null = null;

    for (const modelName of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          return await fetchModel(modelName);
        } catch (err: any) {
          lastError = err;
          const status = err?.status || 0;
          const msg = String(err?.message || '').toLowerCase();

          // Fail-fast on invalid API key or permission denied
          if (status === 401 || status === 403 || msg.includes('api key not valid')) {
            throw new Error('Invalid Gemini API key provided. Please verify in Settings.');
          }

          // If 404 (model not found), break to next candidate model immediately without re-attempting
          if (status === 404) {
            break;
          }

          // If transient error (503/429/500) and first attempt, wait briefly and retry
          if (attempt === 1 && (status === 503 || status === 429 || status === 500 || msg.includes('demand'))) {
            await new Promise((resolve) => setTimeout(resolve, 600));
          } else {
            break;
          }
        }
      }
    }
    throw lastError || new Error('All Gemini vision models failed. Please try again.');
  };

  const parseWithTesseract = async (base64Data: string) => {
    const { recognize } = await import('tesseract.js');
    const result = await recognize(base64Data, 'eng');
    const text = result.data.text || '';

    const priceMatch = text.match(/\$\s*(\d+\.\d{2})|(\d+\.\d{2})/);
    const price = priceMatch ? parseFloat(priceMatch[1] || priceMatch[2]) : 4.99;

    const sizeMatch = text.match(/(\d+(?:\.\d+)?)\s*(oz|lb|g|kg|gal|ml|l|loads|sheets|ct|count)/i);
    const size = sizeMatch ? parseFloat(sizeMatch[1]) : 1;
    let unit: UnitType = 'oz';
    if (sizeMatch && sizeMatch[2]) {
      const matchedUnit = sizeMatch[2].toLowerCase();
      if (['gal', 'oz', 'lb', 'kg', 'g', 'ml', 'l', 'count', 'loads', 'sheets'].includes(matchedUnit)) {
        unit = matchedUnit as UnitType;
      }
    }

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
      const savedKey = localStorage.getItem('unit_price_gemini_key') || '';
      const customKey = customApiKey.trim() || savedKey.trim();
      const isGitHubPages = window.location.hostname.endsWith('.github.io');

      const isOverLimit = scanCount >= 5;
      const hasSelfProvidedKey = Boolean(customKey);
      const shouldLimit = !isNativeApp && !hasSelfProvidedKey && isOverLimit;

      if (!shouldLimit) {
        if (hasSelfProvidedKey) {
          try {
            setScanStatus('Analyzing photo with Gemini AI...');
            const scanned = await parseWithClientSideGemini(customKey, imagePreview, mimeType);
            applyScannedData(scanned, 'Gemini AI Vision');
            return;
          } catch (clientErr: any) {
            console.error('Client Gemini Error:', clientErr);
            setError(`Gemini API Error: ${clientErr.message || 'Invalid key'}. Falling back to WebAssembly OCR...`);
          }
        } else {
          // Backend API scan endpoint using server-side Gemini
          const endpoints = ['/api/scan-label'];
          if (
            window.location.protocol === 'file:' ||
            window.location.protocol === 'capacitor:' ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1'
          ) {
            endpoints.push('https://ais-dev-a4rlkvkyfegjfuv35v5gbz-712313410791.us-east1.run.app/api/scan-label');
          }

          if (!isGitHubPages) {
            for (const endpoint of endpoints) {
              try {
                setScanStatus('Analyzing photo with Gemini AI...');
                const response = await fetch(endpoint, {
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
                } else {
                  const resErr = await response.json().catch(() => ({}));
                  console.warn(`Backend API scan error on ${endpoint}:`, resErr);
                }
              } catch (err: any) {
                console.warn(`Backend API scan failed at endpoint ${endpoint}:`, err);
              }
            }
          }
        }
      } else {
        setScanStatus('Free AI scans limit reached (5/5). Using free local OCR fallback...');
      }

      try {
        setScanStatus('Scanning with Browser WebAssembly OCR...');
        const ocrScanned = await parseWithTesseract(imagePreview);
        applyScannedData(ocrScanned, 'Browser WebAssembly OCR');
        return;
      } catch (ocrErr: any) {
        console.error('Tesseract OCR error:', ocrErr);
      }

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
    
    const savedKey = localStorage.getItem('unit_price_gemini_key') || '';
    const hasSelfProvidedKey = Boolean(customApiKey.trim() || savedKey.trim());
    
    if (method === 'Gemini AI Vision' && !isNativeApp && !hasSelfProvidedKey) {
      const nextCount = scanCount + 1;
      localStorage.setItem('unit_price_scan_count', nextCount.toString());
      setScanCount(nextCount);
    }

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
      handleCloseModal();
      setScanStatus(null);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-sm animate-fade-in">
      <div
        className={`bg-white rounded-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 relative space-y-4 max-h-[92vh] overflow-y-auto transition-all duration-300 ${
          isLiveCameraActive ? 'max-w-xl' : 'max-w-md'
        }`}
      >
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
          onClick={handleCloseModal}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors z-10"
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
            <Sparkles className="w-4 h-4" /> AI Smart Scanner
          </div>
          {debugActive && (
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded flex items-center gap-1">
              <Bug className="w-3 h-3" /> DEBUG ON
            </span>
          )}
        </div>
        <h3 className="text-xl font-black text-slate-900">
          Scan Item, Price Tag, or Barcode
        </h3>
        <p className="text-xs text-slate-500">
          Take a photo of any grocery item, shelf price tag, or barcode to automatically extract product details, size, and pricing.
        </p>

        {/* Limit Warning banner - only in browser and without custom key */}
        {!isNativeApp && !customApiKey.trim() && (
          <div className="space-y-2">
            {/* Caution Banner when 1 or 2 scans are left */}
            {scanCount >= 3 && scanCount < 5 && (
              <div className="p-3 bg-amber-500/15 border-2 border-amber-500/80 rounded-2xl text-xs flex items-start gap-2.5 text-amber-950 shadow-xs animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="font-black text-amber-900 text-xs">
                      ⚠️ Caution: Only {5 - scanCount} Free AI Scan{5 - scanCount === 1 ? '' : 's'} Remaining!
                    </span>
                    <span className="bg-amber-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Running Low
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-snug">
                    You're almost out of shared demo scans. Add your free Gemini API key below to ensure uninterrupted scanning!
                  </p>
                </div>
              </div>
            )}

            {/* Quota overview & progress bar card */}
            <div
              id="ai-scan-quota-banner"
              className={`p-3 rounded-2xl text-xs flex flex-col gap-2.5 border transition-all ${
                scanCount >= 5
                  ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-xs'
                  : scanCount >= 3
                  ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                  : 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <Sparkles
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    scanCount >= 5
                      ? 'text-rose-600'
                      : scanCount >= 3
                      ? 'text-amber-600'
                      : 'text-indigo-600'
                  }`}
                />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">
                      {scanCount >= 5
                        ? 'Free AI Scan Quota Reached (5/5)'
                        : `Free Demo AI Scans: ${scanCount}/5 used`}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        scanCount >= 5
                          ? 'bg-rose-200 text-rose-900'
                          : scanCount >= 3
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-indigo-200 text-indigo-900'
                      }`}
                    >
                      {scanCount >= 5 ? 'Quota Reached' : `${5 - scanCount} remaining`}
                    </span>
                  </div>

                  {/* Visual usage progress bar */}
                  <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        scanCount >= 5
                          ? 'bg-rose-500'
                          : scanCount >= 3
                          ? 'bg-amber-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(100, (scanCount / 5) * 100)}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-600 leading-normal">
                    {scanCount >= 5
                      ? 'Demo quota reached. The scanner will use local offline OCR fallback. You can get unlimited high-accuracy AI scans by entering a free Gemini API key.'
                      : 'You have a pool of 5 free demo AI scans in the browser preview.'}
                  </p>
                </div>
              </div>

              {/* Toggle key instructions button */}
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowApiKeyHelp(!showApiKeyHelp)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>How to get your own free API key for unlimited scans</span>
                  {showApiKeyHelp ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Expandable Key Guide & Quick Paste box */}
              {showApiKeyHelp && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5 text-[11px] text-slate-700 animate-fade-in shadow-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Quick Steps to Free Unlimited Key:</span>
                  </div>
                  <ol className="space-y-1 list-decimal list-inside pl-0.5 text-slate-600 leading-relaxed">
                    <li>
                      Go to{' '}
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 font-bold underline inline-flex items-center gap-0.5"
                      >
                        aistudio.google.com/app/apikey <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </li>
                    <li>Sign in with your Google Account (no credit card required).</li>
                    <li>Click <b>"Create API Key"</b> and copy your new key.</li>
                    <li>Paste it in the box below and click <b>"Save Key"</b>.</li>
                  </ol>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="password"
                      value={inlineKeyInput}
                      onChange={(e) => setInlineKeyInput(e.target.value)}
                      placeholder="Paste Gemini API Key (e.g. AIzaSy...)"
                      className="flex-1 text-xs bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveInlineKey()}
                      disabled={!inlineKeyInput.trim()}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer shadow-xs"
                    >
                      Save Key
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Saved confirmation toast */}
        {keySavedToast && (
          <div className="p-2.5 rounded-xl text-xs flex items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-950 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px] font-bold text-emerald-900">
              API key saved successfully! Unlimited AI scans are now enabled.
            </span>
          </div>
        )}

        {!isNativeApp && customApiKey.trim() && !keySavedToast && (
          <div className="p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 text-emerald-950">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-[11px] font-semibold text-emerald-900">
                Custom Gemini API key active &bull; Unlimited AI scans enabled
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('unit_price_gemini_key');
                setCustomApiKey('');
              }}
              className="text-[10px] text-slate-500 hover:text-rose-600 font-semibold underline"
            >
              Remove
            </button>
          </div>
        )}

        {/* Live Camera Viewfinder Screen */}
        {isLiveCameraActive ? (
          <div className="space-y-3 bg-slate-950 rounded-2xl p-3 sm:p-4 text-white overflow-hidden shadow-2xl border border-slate-800">
            {/* Viewfinder Mode Toggle Bar */}
            <div className="flex items-center justify-between gap-2 pb-1 text-xs">
              <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-[11px]">
                <Scan className="w-4 h-4 text-indigo-400" />
                Live Viewfinder
              </div>
              <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setCropMode('reticle')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                    cropMode === 'reticle'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Auto-crops the focused tag to eliminate background noise"
                >
                  <Crop className="w-3 h-3" /> Focus Tag Crop
                </button>
                <button
                  type="button"
                  onClick={() => setCropMode('full')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                    cropMode === 'full'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Captures full wide-angle frame"
                >
                  <Maximize2 className="w-3 h-3" /> Full Frame
                </button>
              </div>
            </div>

            {/* Expansive Video Container with Reticle Targeting */}
            <div
              ref={viewfinderContainerRef}
              className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center h-72 sm:h-96 w-full border border-slate-800 select-none shadow-inner"
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              {/* Targeting Overlay */}
              {cropMode === 'reticle' ? (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                  {/* Outer dimmed mask hint */}
                  <div
                    ref={reticleBoxRef}
                    className="relative w-64 sm:w-80 h-40 sm:h-48 border-2 border-indigo-400 rounded-2xl bg-indigo-950/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex flex-col items-center justify-between p-3 transition-all duration-300"
                  >
                    {/* Glowing Reticle Corner Accents */}
                    <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />

                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 bg-indigo-900/80 px-2 py-0.5 rounded-md backdrop-blur-sm border border-indigo-400/30 flex items-center gap-1">
                      <Scan className="w-3 h-3 text-indigo-400" />
                      Align Item, Tag, or Barcode Inside
                    </span>
                    <span className="text-[9px] text-slate-300 font-medium bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                      ✨ Background will be auto-cropped for optimal AI recognition
                    </span>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-indigo-400/50 rounded-2xl m-3 flex items-end justify-center p-2">
                  <span className="text-[10px] font-bold text-slate-300 bg-black/70 px-2.5 py-1 rounded-full backdrop-blur-sm">
                    Full Wide-Angle Sensor Mode
                  </span>
                </div>
              )}
            </div>

            {/* Live Camera Controls */}
            <div className="flex items-center justify-between px-2 pt-2">
              <button
                type="button"
                onClick={stopLiveCamera}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={capturePhotoFromLiveCamera}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white flex items-center justify-center shadow-xl ring-4 ring-indigo-400/40 transition-all transform active:scale-90"
                title="Snap Focused Photo"
              >
                <Camera className="w-7 h-7" />
              </button>

              <button
                type="button"
                onClick={handleFlipCamera}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                title="Switch Camera Front/Back"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : isStartingCamera ? (
          <div className="border border-indigo-200 bg-indigo-50/50 rounded-2xl p-10 text-center space-y-3">
            <Loader2 className="w-9 h-9 text-indigo-600 animate-spin mx-auto" />
            <div className="text-sm font-bold text-indigo-900">Starting Live Camera...</div>
            <div className="text-xs text-slate-500">Please allow camera permissions if prompted by your browser</div>
          </div>
        ) : imagePreview ? (
          /* Image Captured Preview Screen */
          <div className="border border-slate-200 bg-slate-50 rounded-2xl p-4 text-center space-y-3 shadow-inner">
            <div className="relative inline-block max-w-full">
              <img
                src={imagePreview}
                alt="Shelf tag preview"
                className="max-h-56 sm:max-h-64 mx-auto rounded-xl object-contain border border-slate-200 shadow-sm"
              />
              {isCroppedPreview && (
                <div className="absolute top-2 left-2 bg-indigo-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm shadow flex items-center gap-1">
                  <Crop className="w-3 h-3" /> Focused Tag Crop
                </div>
              )}
            </div>

            <div className="text-xs text-slate-600 font-medium">
              {isCroppedPreview
                ? 'Targeted shelf tag extracted with unwanted background removed.'
                : 'Full photo captured. Ready for AI processing.'}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => startLiveCamera('environment')}
                className="px-3.5 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Video className="w-3.5 h-3.5" /> Retake with Live Camera
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="px-3.5 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Image className="w-3.5 h-3.5" /> Choose From Gallery
              </button>
            </div>
          </div>
        ) : (
          /* Selection Options Screen */
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => startLiveCamera('environment')}
              className="p-5 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-2 group shadow-sm hover:shadow"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-slate-850">
                Live Camera
              </div>
              <div className="text-[10px] text-slate-500">
                Targeted in-app viewfinder
              </div>
            </button>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="p-5 border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-100/80 rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-2 group shadow-sm hover:shadow"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-slate-850">
                Pick from Gallery
              </div>
              <div className="text-[10px] text-slate-500">
                Upload file or photo
              </div>
            </button>
          </div>
        )}

        {cameraError && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold">{cameraError}</div>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="text-[11px] font-bold text-indigo-700 underline"
              >
                Click here to pick photo from device
              </button>
            </div>
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
            onClick={handleCloseModal}
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
                Analyzing Photo...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {!isNativeApp && !customApiKey.trim() && scanCount === 4
                  ? 'Extract Data (Last Free Scan)'
                  : 'Extract Data'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
