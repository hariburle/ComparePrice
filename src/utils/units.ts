import { ProductOffer, ReferenceBase, StandardizedComparison, UnitCategory, UnitType } from '../types';

// Conversion factors to Base Metric (Grams for Weight, Milliliters for Volume, Count for Units)

const WEIGHT_TO_GRAMS: Record<string, number> = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

const VOLUME_TO_ML: Record<string, number> = {
  ml: 1,
  l: 1000,
  floz: 29.5735,
  pt: 473.176,
  qt: 946.353,
  gal: 3785.41,
};

const REFERENCE_BASE_LABELS: Record<ReferenceBase, string> = {
  '100g': 'per 100 g',
  '1kg': 'per kg',
  '1oz': 'per oz',
  '1lb': 'per lb',
  '100ml': 'per 100 ml',
  '1l': 'per Liter',
  '1floz': 'per fl oz',
  '1gal': 'per Gallon',
  '100count': 'per 100 count',
  '1count': 'per item',
  '100sheets': 'per 100 sheets',
  '1load': 'per wash load',
};

export function getUnitCategory(unit: UnitType): UnitCategory {
  if (['g', 'kg', 'oz', 'lb'].includes(unit)) return 'weight';
  if (['ml', 'l', 'floz', 'gal', 'pt', 'qt'].includes(unit)) return 'volume';
  if (['sheets'].includes(unit)) return 'paper';
  if (['loads'].includes(unit)) return 'laundry';
  return 'count';
}

export function getDefaultReferenceBases(category: UnitCategory): ReferenceBase[] {
  switch (category) {
    case 'weight':
      return ['100g', '1kg', '1oz', '1lb'];
    case 'volume':
      return ['100ml', '1l', '1floz', '1gal'];
    case 'paper':
      return ['100sheets', '1count'];
    case 'laundry':
      return ['1load', '100ml'];
    case 'count':
    default:
      return ['1count', '100count'];
  }
}

export function getReferenceBaseLabel(base: ReferenceBase): string {
  return REFERENCE_BASE_LABELS[base] || base;
}

/**
 * Calculates effective total price after applying deal / discount modifiers
 */
export function calculateEffectivePrice(product: ProductOffer): number {
  let basePrice = product.price;
  const qty = product.quantity || 1;

  if (basePrice <= 0) return 0;

  switch (product.dealType) {
    case 'percent_off': {
      const discount = (product.dealValue || 0) / 100;
      return basePrice * (1 - Math.min(1, Math.max(0, discount)));
    }
    case 'flat_off': {
      return Math.max(0, basePrice - (product.dealValue || 0));
    }
    case 'bogo_free': {
      // Buy 1 Get 1 Free -> total price is price of 1, but quantity is doubled (or handled in total units)
      // If quantity entered is 1, effective price stays price, but effective units double
      return basePrice;
    }
    case 'bogo_half': {
      // Buy 1 Get 1 50% off
      return basePrice * 0.75; // average 25% discount across pair
    }
    case 'multi_buy': {
      // e.g. 3 for $10 -> dealValue is total price for quantity items
      if (product.dealValue > 0) return product.dealValue;
      return basePrice;
    }
    case 'none':
    default:
      return basePrice;
  }
}

/**
 * Converts a product's size * packCount * deal extra into standard base units (grams, ml, or total count)
 */
export function calculateTotalBaseUnits(product: ProductOffer): number {
  const packMultiplier = Math.max(1, product.packCount || 1);
  let effectiveQuantity = Math.max(1, product.quantity || 1);

  if (product.dealType === 'bogo_free') {
    effectiveQuantity = effectiveQuantity * 2;
  }

  const rawTotalSize = product.size * packMultiplier * effectiveQuantity;
  const unit = product.unit;

  if (WEIGHT_TO_GRAMS[unit]) {
    return rawTotalSize * WEIGHT_TO_GRAMS[unit];
  } else if (VOLUME_TO_ML[unit]) {
    return rawTotalSize * VOLUME_TO_ML[unit];
  }
  return rawTotalSize; // count, sheets, loads
}

/**
 * Converts standard base units (grams, ml, count) to the target reference base quantity
 */
export function getReferenceBaseUnitFactor(base: ReferenceBase): { factorInBase: number; category: UnitCategory } {
  switch (base) {
    case '100g':
      return { factorInBase: 100, category: 'weight' };
    case '1kg':
      return { factorInBase: 1000, category: 'weight' };
    case '1oz':
      return { factorInBase: 28.3495, category: 'weight' };
    case '1lb':
      return { factorInBase: 453.592, category: 'weight' };

    case '100ml':
      return { factorInBase: 100, category: 'volume' };
    case '1l':
      return { factorInBase: 1000, category: 'volume' };
    case '1floz':
      return { factorInBase: 29.5735, category: 'volume' };
    case '1gal':
      return { factorInBase: 3785.41, category: 'volume' };

    case '100sheets':
      return { factorInBase: 100, category: 'paper' };
    case '1load':
      return { factorInBase: 1, category: 'laundry' };
    case '100count':
      return { factorInBase: 100, category: 'count' };
    case '1count':
    default:
      return { factorInBase: 1, category: 'count' };
  }
}

export function formatUnitPrice(unitPrice: number, forceCents: boolean = false): string {
  if (unitPrice <= 0) return '$0.00';

  if (unitPrice < 1.00 || forceCents) {
    const cents = unitPrice * 100;
    let formatted: string;
    if (cents < 0.1 && cents > 0) {
      formatted = cents.toFixed(2);
    } else if (cents % 1 === 0) {
      formatted = cents.toFixed(0);
    } else {
      formatted = cents.toFixed(1);
    }
    return `${formatted}¢`;
  }

  return `$${unitPrice.toFixed(2)}`;
}

/**
 * Compares multiple product offers normalized against a reference base
 */
export function compareProductOffers(
  products: ProductOffer[],
  targetReferenceBase: ReferenceBase
): StandardizedComparison[] {
  if (!products || products.length === 0) return [];

  const { factorInBase } = getReferenceBaseUnitFactor(targetReferenceBase);

  // Calculate unit prices for each product
  const rawResults = products.map((p) => {
    const effectivePrice = calculateEffectivePrice(p);
    const totalBaseUnits = calculateTotalBaseUnits(p);

    let unitPrice = 0;
    if (totalBaseUnits > 0) {
      unitPrice = (effectivePrice / totalBaseUnits) * factorInBase;
    }

    return {
      productId: p.id,
      productName: p.name || 'Unnamed Item',
      effectivePrice,
      totalBaseUnits,
      unitPrice,
    };
  });

  // Filter out invalid zero price/units for ranking
  const validPrices = rawResults.map((r) => r.unitPrice).filter((p) => p > 0);
  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : 0;

  // Rank products
  const sorted = [...rawResults].sort((a, b) => a.unitPrice - b.unitPrice);

  return rawResults.map((res) => {
    const isMin = res.unitPrice > 0 && Math.abs(res.unitPrice - minPrice) < 0.00001;
    const isMax = res.unitPrice > 0 && Math.abs(res.unitPrice - maxPrice) < 0.00001 && validPrices.length > 1;
    
    // Price rank (1-indexed)
    const rankIndex = sorted.findIndex((s) => s.productId === res.productId);
    const priceRank = rankIndex !== -1 ? rankIndex + 1 : 99;

    // Savings percentage compared to the most expensive item
    let savingsPercentage = 0;
    if (maxPrice > 0 && res.unitPrice > 0) {
      savingsPercentage = Math.round(((maxPrice - res.unitPrice) / maxPrice) * 100);
    }

    return {
      productId: res.productId,
      productName: res.productName,
      effectivePrice: res.effectivePrice,
      totalStandardUnits: res.totalBaseUnits,
      unitPricePerStandardBase: res.unitPrice,
      formattedUnitPrice: formatUnitPrice(res.unitPrice),
      savingsPercentageVsWorst: savingsPercentage,
      isBestValue: isMin && validPrices.length > 1,
      isWorstValue: isMax && validPrices.length > 1,
      priceRank,
    };
  });
}

export function formatUnitLabel(unit: UnitType): string {
  const map: Record<UnitType, string> = {
    g: 'Grams (g)',
    kg: 'Kilograms (kg)',
    oz: 'Ounces (oz)',
    lb: 'Pounds (lb)',
    ml: 'Milliliters (ml)',
    l: 'Liters (L)',
    floz: 'Fluid Oz (fl oz)',
    gal: 'Gallons (gal)',
    pt: 'Pints (pt)',
    qt: 'Quarts (qt)',
    count: 'Count / Pieces',
    pcs: 'Pieces',
    sheets: 'Sheets (Paper)',
    loads: 'Loads (Detergent)',
    cups: 'Cups / Servings',
    rolls: 'Rolls',
  };
  return map[unit] || unit;
}
