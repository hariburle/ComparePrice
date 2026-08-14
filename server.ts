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

      const prompt = `Analyze this store shelf price label, product tag, or item package photo.
Extract the product details and return a strict JSON object:
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

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
