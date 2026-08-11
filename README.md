# Unit Price Calculator & Smart Deal Comparator 🛒 Light & Fast Grocery Savings App

A powerful full-stack web app designed to help shoppers instantly compare product prices across different pack sizes, unit measurements, and store promotions. Features Gemini AI powered shelf label/receipt scanning for instant data extraction.

---

## 🌟 Key Features

- **Normalized Unit Price Comparison:**
  - Instantly standardizes prices across weight (`g`, `kg`, `oz`, `lb`), volume (`ml`, `L`, `fl oz`, `gal`), count (`sheets`, `rolls`, `tablets`, `items`), length (`m`, `cm`, `ft`), and area (`sq ft`, `sq m`).
  - Compare mixed units seamlessly (e.g., 450g box vs 1.5kg bag vs 5lb bulk bag).

- **Flexible Unit Price Formatting:**
  - Automatically displays unit prices in **cents (`¢`)** when under $1.00 (e.g. `3.2¢ / 100g` or `89.5¢ / 1L`) and dollars (`$`) for higher amounts.

- **Deal & Promotion Engine:**
  - Supports Flat Discounts ($ off), Percentage Off (% off), Buy X Get Y Free (BOGO), and Bulk Multi-Packs.

- **🤖 AI Camera/Photo Label & Receipt Scanner:**
  - Powered by server-side **Google Gemini AI (`gemini-3.6-flash`)**.
  - Snap a photo or upload an image of a shelf price tag or receipt to automatically extract product name, price, quantity, size, unit, and active promotions.

- **Quick Presets & Comparison History:**
  - Pre-loaded category presets for grocery staples (Rice, Beverages, Paper Goods, Coffee).
  - Save comparisons locally to review past deals anytime.

- **Mobile & Android Ready:**
  - Built with a fluid, touch-optimized responsive layout that adapts seamlessly to desktop browsers, mobile phones, and hybrid mobile shells (e.g. Capacitor/Cordova).

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React Icons, Motion (Animations)
- **Backend:** Express.js, TypeScript (`tsx` for dev, `esbuild` for production bundling)
- **AI Integration:** `@google/genai` (Google Gemini API using `gemini-3.6-flash`)
- **Build System:** Vite 6, esbuild

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm** or **bun**
- **Google Gemini API Key**: Obtain a free or pay-as-you-go API key from [Google AI Studio](https://aistudio.google.com/).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/unit-price-calculator.git
   cd unit-price-calculator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (or copy `.env.example`):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

---

## 📦 Scripts Overview

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs the development Express server with Vite middleware on port 3000 |
| `npm run build` | Builds the client application with Vite and bundles the server into `dist/server.cjs` |
| `npm start` | Runs the compiled production server (`node dist/server.cjs`) |
| `npm run lint` | Runs TypeScript type checker (`tsc --noEmit`) |
| `npm run clean` | Removes build outputs (`dist/`) |

---

## 🔒 Security Note

All calls to the Gemini API are proxied through the secure backend Express server (`/api/scan-label`). Your `GEMINI_API_KEY` is kept server-side and never exposed to client browsers or mobile builds.

---

## 📄 License

MIT License. Feel free to clone, customize, and deploy for personal or commercial use!
