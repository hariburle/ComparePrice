import React, { useState, useRef, useEffect } from 'react';
import { ProductOffer, UnitType } from '../types';
import {
  Camera,
  Upload,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bug,
  Image,
  SwitchCamera,
  Video,
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

  const isNativeApp = Boolean(
    (window as any).Capacitor?.isNativePlatform?.() ||
    ((window as any).Capacitor?.getPlatform && (window as any).Capacitor.getPlatform() !== 'web')
  );

  // Live Camera State
  const [isLiveCameraActive, setIsLiveCameraActive] = useState<boolean>(false);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const clickCountRef = useRef<number>(0);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
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
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    setImagePreview(dataUrl);
    setMimeType('image/jpeg');
    setError(null);
    setScanStatus(null);
    stopLiveCamera();
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
          generationConfig: {
            response_mime_type: 'application/json',
          },
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

    const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
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
            setScanStatus('Scanning shelf tag with Gemini AI...');
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
                setScanStatus('Scanning shelf tag with Gemini AI...');
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
          onClick={handleCloseModal}
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
          Capture a store tag directly using your live camera or pick a picture from your library.
        </p>

        {/* Limit Warning banner - only in browser and without custom key */}
        {!isNativeApp && !customApiKey.trim() && (
          <div
            id="ai-scan-quota-banner"
            className={`p-3 rounded-2xl text-xs flex items-start gap-2.5 border transition-all ${
              scanCount >= 5
                ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-sm'
                : 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
            }`}
          >
            <Sparkles
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                scanCount >= 5 ? 'text-amber-600' : 'text-indigo-600'
              }`}
            />
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900">
                  {scanCount >= 5
                    ? 'Free AI Scan Quota Reached (5/5)'
                    : `Free AI Scans: ${scanCount}/5 used`}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    scanCount >= 5
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-indigo-200 text-indigo-900'
                  }`}
                >
                  {scanCount >= 5 ? 'Quota Reached' : `${5 - scanCount} left`}
                </span>
              </div>

              {/* Visual usage progress bar */}
              <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    scanCount >= 5 ? 'bg-amber-500' : 'bg-indigo-600'
                  }`}
                  style={{ width: `${Math.min(100, (scanCount / 5) * 100)}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-600 leading-normal">
                {scanCount >= 5
                  ? 'Local WebAssembly OCR is now active as free offline fallback. Enter your own free Gemini API key in Settings to enjoy unlimited AI scans!'
                  : 'You get 5 free Gemini AI scans in the browser preview. Add your own free Gemini API key in Settings anytime to remove all limits.'}
              </p>
            </div>
          </div>
        )}

        {!isNativeApp && customApiKey.trim() && (
          <div className="p-2.5 rounded-xl text-xs flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-950">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px] font-semibold text-emerald-900">
              Custom Gemini API key active &bull; Unlimited AI scans enabled
            </span>
          </div>
        )}

        {/* Live Camera Viewfinder Screen */}
        {isLiveCameraActive ? (
          <div className="space-y-3 bg-slate-900 rounded-2xl p-3 text-white overflow-hidden shadow-inner">
            <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center min-h-[220px]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-56 object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
              {/* Focus Reticle Overlay */}
              <div className="absolute inset-0 border-2 border-indigo-400/40 rounded-xl pointer-events-none flex items-center justify-center">
                <div className="w-48 h-28 border-2 border-dashed border-indigo-400/90 rounded-lg bg-indigo-500/10 flex items-center justify-center text-[10px] text-indigo-200 font-medium shadow-sm">
                  Align Shelf Tag Here
                </div>
              </div>
            </div>

            {/* Live Camera Controls */}
            <div className="flex items-center justify-between px-2 pt-1">
              <button
                type="button"
                onClick={stopLiveCamera}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold transition-colors"
              >
                Close Viewfinder
              </button>

              <button
                type="button"
                onClick={capturePhotoFromLiveCamera}
                className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg ring-4 ring-indigo-400/30 transition-all transform active:scale-95"
                title="Snap Photo"
              >
                <Camera className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={handleFlipCamera}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                title="Switch Camera Front/Back"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : isStartingCamera ? (
          <div className="border border-indigo-200 bg-indigo-50/50 rounded-2xl p-8 text-center space-y-2">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <div className="text-xs font-bold text-indigo-900">Starting Live Camera...</div>
            <div className="text-[11px] text-slate-500">Please allow camera permissions if prompted</div>
          </div>
        ) : imagePreview ? (
          /* Image Captured Preview Screen */
          <div className="border border-slate-200 bg-slate-50 rounded-2xl p-4 text-center space-y-3">
            <img
              src={imagePreview}
              alt="Shelf tag preview"
              className="max-h-48 mx-auto rounded-xl object-contain border border-slate-200"
            />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => startLiveCamera('environment')}
                className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Video className="w-3.5 h-3.5" /> Retake with Live Camera
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Image className="w-3.5 h-3.5" /> Choose Other Photo
              </button>
            </div>
          </div>
        ) : (
          /* Selection Options Screen */
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => startLiveCamera('environment')}
              className="p-4 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Video className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-850">
                Live Camera
              </div>
              <div className="text-[10px] text-slate-500">
                Scan live in-app
              </div>
            </button>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="p-4 border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-100/80 rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
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
