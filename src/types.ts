export type UnitCategory = 'weight' | 'volume' | 'count' | 'paper' | 'laundry';

export type WeightUnit = 'g' | 'kg' | 'oz' | 'lb';
export type VolumeUnit = 'ml' | 'l' | 'floz' | 'gal' | 'pt' | 'qt';
export type CountUnit = 'count' | 'pcs' | 'sheets' | 'loads' | 'cups' | 'rolls';

export type UnitType = WeightUnit | VolumeUnit | CountUnit;

export type ReferenceBase = 
  | '100g' 
  | '1kg' 
  | '1oz' 
  | '1lb' 
  | '100ml' 
  | '1l' 
  | '1floz' 
  | '1gal' 
  | '100count' 
  | '1count'
  | '100sheets'
  | '1load';

export type DealType = 'none' | 'percent_off' | 'flat_off' | 'bogo_free' | 'bogo_half' | 'multi_buy';

export interface ProductOffer {
  id: string;
  name: string;
  price: number; // total shelf price (e.g., $5.99)
  quantity: number; // e.g. 1 (or 3 if 3 for $10)
  size: number; // e.g. 450 (g) or 2 (L)
  unit: UnitType;
  packCount: number; // e.g. 12 cans, 6 rolls (default 1)
  dealType: DealType;
  dealValue: number; // e.g. 20 for 20% off, 1 for $1 off
  storeName?: string;
  brand?: string;
  barcode?: string;
  notes?: string;
  scannedByMethod?: string;
}

export interface StandardizedComparison {
  productId: string;
  productName: string;
  effectivePrice: number; // price after deal
  totalStandardUnits: number; // e.g. total grams or total ml across pack
  unitPricePerStandardBase: number; // e.g. price per 100g or per 1kg
  formattedUnitPrice: string;
  savingsPercentageVsWorst: number; // % saved compared to highest price
  isBestValue: boolean;
  isWorstValue: boolean;
  priceRank: number; // 1 = best
}

export interface SavedComparison {
  id: string;
  title: string;
  category: string;
  date: string;
  referenceBase: ReferenceBase;
  products: ProductOffer[];
}

export interface RoadmapPhase {
  phase: number;
  title: string;
  status: 'completed' | 'in_progress' | 'planned';
  description: string;
  features: {
    name: string;
    description: string;
    icon: string;
  }[];
}
