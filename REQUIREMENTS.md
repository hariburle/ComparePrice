# Product Requirements & Feature Documentation (PRD)

## **1. Executive Summary**
The **Smart Unit Price Comparator** is a responsive, client-first web application designed to help shoppers determine true value across varying package sizes, quantities, multi-packs, discounts, and measurement systems.

---

## **2. Functional Requirements**

### **2.1 Multi-Item Price Comparison Engine**
- **A/B/C Lettering Identification**: Items are assigned clean single-letter identification badges (`A`, `B`, `C`, etc.) for fast visual comparison.
- **Dynamic Product Metadata**: Optional fields for Item Name and Store/Retailer Name (e.g. `@Walmart`, `@Costco`).
- **Flexible Pricing Inputs**:
  - Base Regular Price input with customizable currency symbol.
  - Multi-pack support (e.g., 12 packs of 355 ml cans).
  - Discount inputs supporting percentage discounts (`15% off`) or flat amount discounts (`$2 off`).
  - Deposit/recycling fee additions (e.g. bottle deposit / CRV).
  - Optional Sales Tax calculation.
- **Cross-Unit Measurement Conversion Engine**:
  - **Weight**: Grams (`g`), Kilograms (`kg`), Ounces (`oz`), Pounds (`lb`).
  - **Volume**: Milliliters (`ml`), Liters (`L`), Fluid Ounces (`fl oz`), Pints (`pt`), Quarts (`qt`), Gallons (`gal`).
  - **Count / Units**: Items/Count, Sheets, Rolls, Packs.
  - Automatic cross-unit conversion math to compute exact unit price.
- **Reference Base Unit Selection**: User can switch global comparison unit on the fly:
  - `Per Oz`, `Per Lb`, `Per 100g`, `Per Kg`, `Per Item/Count`, `Per 100ml`, `Per Liter`, `Per Fl Oz`.

---

### **2.2 Visual Value & Analytics Matrix ("Price Comparison")**
- **Best Value Identification**: Automatically highlights the item with the lowest unit price using a "Best Value" indicator.
- **Percentage Savings Badge**: Calculates and displays exact percentage savings relative to other options (e.g., *"18% cheaper per oz"*).
- **Visual Relative Cost Bars**: Proportional comparison bars illustrating relative unit cost differences.
- **Dollar Savings Calculator**: Calculates absolute monetary savings based on intended purchase quantity.
- **Cart Summary**: Aggregates total cost and items being compared.

---

### **2.3 AI Vision & Hybrid OCR Price Tag Scanning**
- **AI Vision Scanner (Gemini Vision API)**:
  - Supports live camera capture or file upload of price tags.
  - Automatically parses item name, total price, quantity, unit of measure, and deposit fees.
  - Directly populates or appends cards with extracted data.
- **Fallback On-Device OCR**:
  - Integrated client-side Tesseract.js OCR engine for scanning without an active API key.
- **Developer Debug Mode**:
  - Toggleable debug modal showing raw vision API response JSON, bounding boxes, and image pre-processing logs.

---

### **2.4 Secret Management & Configuration**
- **Dual-Layer Secret Management**:
  - **Environment Build Injection**: Reads `VITE_GEMINI_API_KEY` or `GEMINI_API_KEY` for hosted or GitHub Actions builds.
  - **User Secret Storage**: Allows end-users to enter a custom Gemini API key directly in the app.
- **Write-Only Security & Masking**:
  - Entered keys are obfuscated prior to local storage saving.
  - Password-masked input field (`••••••••••••`) with a show/hide toggle.
  - Raw key values are **never printed or exposed** in plain text on screen.
  - One-click **Remove Secret** button.
- **App Preferences**:
  - Default Currency Selector (`$`, `€`, `£`, `₹`, `C$`, `A$`).
  - Measurement System Filter (`All Units`, `Imperial (oz, lb)`, `Metric (g, kg, ml)`).

---

### **2.5 Data Management & Sharing**
- **Template Presets**: Pre-populated comparison scenarios (e.g. Cereal box comparison, Soda 12-pack vs 2L bottle, Paper towel roll sheet math).
- **Single-Click Card Operations**: Duplicate card, clear inputs, or remove card.
- **Share Item Summary**: Generates a quick text summary for sharing item value calculations via Web Share API or Clipboard.

---

## **3. Non-Functional & Deployment Requirements**

- **Client-Side First Architecture**: Fast execution directly in the browser with offline-fallback OCR.
- **Multi-Platform Target Compatibility**:
  - **Web / Cloud Run**: Responsive web container.
  - **GitHub Pages**: Static site build with GitHub Repository Secrets.
  - **Android (Capacitor)**: Mobile app build support via `.env` bundled secrets.
- **Accessibility & Design System**:
  - Clean light/dark mode theme matching system preference.
  - High-contrast typography and WCAG AA compliant contrast ratios.
  - Fully responsive layout optimized for mobile touch targets (44px+) and desktop multi-column layouts.
