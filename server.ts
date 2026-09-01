import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS middleware for mobile APK / cross-origin requests
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // JSON Body parser for image uploads (up to 10MB base64)
  app.use(express.json({ limit: '10mb' }));

  // API Route: Health Check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API Route: AI Shelf Tag OCR Scanner using Gemini
  app.post('/api/scan-label', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY environment variable is missing on server.',
        });
      }

      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'imageBase64 string is required.' });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Analyze this grocery or retail item photo. It can be ANY of the following:
1. An actual store item or product (e.g., fruit/produce, can of soup, bottle of olive oil, detergent, cereal box).
2. A store shelf price tag / label.
3. A product barcode or UPC/EAN code (1D or 2D).
4. Product packaging, nutrition facts label, or box.

Extract the product details and return a strict JSON object with NO markdown formatting:
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

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      // Helper to determine if an error is temporary and eligible for a retry
      const isTransientError = (err: any): boolean => {
        const status = err?.status || err?.code || err?.error?.code || 0;
        const msg = String(err?.message || err?.error?.message || '').toLowerCase();
        
        // Non-retryable client / auth errors: fail-fast
        if (status === 400 || status === 401 || status === 403 || status === 404) {
          return false;
        }
        if (msg.includes('api key not valid') || msg.includes('permission_denied') || msg.includes('invalid argument')) {
          return false;
        }

        // Retryable conditions: 503 high demand, 429 rate limits, 502/504 gateways, transient network resets
        if (status === 503 || status === 429 || status === 500 || status === 502 || status === 504) {
          return true;
        }
        if (msg.includes('high demand') || msg.includes('unavailable') || msg.includes('quota') || msg.includes('timeout') || msg.includes('econnreset')) {
          return true;
        }
        return false;
      };

      // Bounded models list with strictly capped attempts (max 2 per model)
      const modelsToTry = ['gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
      const MAX_ATTEMPTS_PER_MODEL = 2;
      let response: any = null;
      let lastError: any = null;

      for (const model of modelsToTry) {
        for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
          try {
            response = await ai.models.generateContent({
              model,
              contents: [
                prompt,
                {
                  inlineData: {
                    data: cleanBase64,
                    mimeType: mimeType || 'image/jpeg',
                  },
                },
              ],
              config: {
                responseMimeType: 'application/json',
              },
            });

            if (response?.text) {
              break; // Success: exit attempt loop
            }
          } catch (err: any) {
            lastError = err;
            const status = err?.status || err?.code || err?.error?.code;
            const msg = String(err?.message || 'Error calling model');
            console.log(`[Scan API] Model ${model} (attempt ${attempt}/${MAX_ATTEMPTS_PER_MODEL}) error [${status || 'ERR'}]: ${msg.slice(0, 100)}`);

            // Only retry if error is transient AND we haven't reached the attempt cap
            const canRetry = attempt < MAX_ATTEMPTS_PER_MODEL && isTransientError(err);
            if (canRetry) {
              // Backoff delay: 600ms before second attempt
              const backoffMs = attempt * 600;
              await new Promise((resolve) => setTimeout(resolve, backoffMs));
            } else {
              // If error is not transient (e.g. 404 model not found, 401 auth), don't waste time retrying this model
              break;
            }
          }
        }

        // If we got a valid response, exit model cascade
        if (response?.text) {
          break;
        }
      }

      if (!response?.text) {
        throw lastError || new Error('Vision models are currently experiencing high demand. Please try again or use local OCR.');
      }

      const responseText = response.text || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json({ success: true, data: parsed });
      } else {
        return res.status(500).json({ error: 'Failed to parse AI output', raw: responseText });
      }
    } catch (error: any) {
      console.error('Scan label error:', error);
      res.status(500).json({ error: error?.message || 'Error processing label scan' });
    }
  });

  // Vite middleware in dev, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Unit Price Comparator app listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
