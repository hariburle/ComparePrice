import { RoadmapPhase } from '../types';

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    phase: 1,
    title: 'Core Unit Comparison & Instant Converter',
    status: 'completed',
    description: 'Instant simultaneous multi-product comparison with real-time unit normalization and price ranking.',
    features: [
      {
        name: 'Simultaneous Multi-Product Matrix',
        description: 'Compare 2, 3, 4 or more products side-by-side with real-time live unit price updates.',
        icon: 'Scale',
      },
      {
        name: 'Instant Unit Conversion Engine',
        description: 'Seamless cross-unit math between Weight (g, kg, oz, lb), Volume (ml, L, fl oz, gal, pt, qt), and Count/Sheets.',
        icon: 'RefreshCw',
      },
      {
        name: 'Standardized Reference Base Selector',
        description: 'Normalize comparisons instantly to $/100g, $/kg, $/oz, $/lb, $/100ml, $/Liter, $/fl oz, or $/count.',
        icon: 'Sliders',
      },
      {
        name: 'Best Value & Savings Calculator',
        description: 'Automatic badge highlighting best deal, worst value warning, and percentage savings indicator.',
        icon: 'TrendingDown',
      },
      {
        name: 'Multi-Pack & Bulk Quantity Splitter',
        description: 'Calculate true unit cost for multi-packs (e.g. 12-pack of 355ml cans vs 2L bottle).',
        icon: 'Layers',
      },
    ],
  },
  {
    phase: 2,
    title: 'Deal Modifiers, Coupons & Smart Presets',
    status: 'completed',
    description: 'Advanced bargain hunting tools for sales, store coupons, and item-specific unit presets.',
    features: [
      {
        name: 'BOGO & Coupon Discounts',
        description: 'Factor in % off coupons, flat dollar discounts, BOGO Free, and Buy 1 Get 1 50% Off before comparing.',
        icon: 'Tag',
      },
      {
        name: 'Category Smart Presets',
        description: 'One-tap pre-filled templates for Grocery Bulk, Beverage Cans vs Bottles, Toilet Paper/Paper Towels, and Laundry Detergent.',
        icon: 'Sparkles',
      },
      {
        name: 'Store & Custom Unit Tags',
        description: 'Tag items with store names (e.g. Costco, Walmart, Trader Joe\'s) and brand labels.',
        icon: 'Store',
      },
      {
        name: 'Usable Quantity & Yield Adjuster',
        description: 'Account for usable yield multiplier (e.g., boneless vs bone-in meat, concentrated liquids).',
        icon: 'Percent',
      },
    ],
  },
  {
    phase: 3,
    title: 'Bargain History & Multi-Store Shopping Lists',
    status: 'completed',
    description: 'Save, review, and track unit price benchmarks over time across different supermarket chains.',
    features: [
      {
        name: 'Saved Comparison Trips',
        description: 'Store comparison sessions in local persistent memory for quick reference on future shopping runs.',
        icon: 'BookmarkCheck',
      },
      {
        name: 'Store Price Benchmarks',
        description: 'Track average unit prices for staple items (e.g. milk $/L, rice $/kg) across stores.',
        icon: 'History',
      },
      {
        name: 'Quick Share & Export',
        description: 'Export deal summaries or copy unit price breakdowns to share with family or co-shoppers.',
        icon: 'Share2',
      },
    ],
  },
  {
    phase: 4,
    title: 'AI Smart Tag, Barcode & Package Scanner',
    status: 'completed',
    description: 'Hands-free AI computer vision to extract price tag data, product barcodes / UPCs, and packaging specs.',
    features: [
      {
        name: 'AI Vision Tag & Barcode Scanner',
        description: 'Snap or upload a photo of a store shelf tag, 1D/2D barcode/UPC, or product package to auto-detect price, package net weight/volume, barcode number, and product title.',
        icon: 'Camera',
      },
      {
        name: 'Target Reticle Auto-Cropping',
        description: 'Live interactive camera viewfinder with auto-crop for shelf tags and barcodes to remove background aisle noise.',
        icon: 'Zap',
      },
      {
        name: 'Instant Offer Pre-population',
        description: 'Auto-fill comparison cards directly from photos without typing numbers manually.',
        icon: 'Sparkles',
      },
    ],
  },
];
