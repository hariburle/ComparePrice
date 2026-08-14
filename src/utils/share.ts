import { ProductOffer, ReferenceBase } from '../types';
import { calculateEffectivePrice, calculateTotalBaseUnits, formatUnitPrice, getReferenceBaseUnitFactor } from './units';

export function formatItemText(
  offer: ProductOffer,
  referenceBase: ReferenceBase,
  isBestValue?: boolean
): string {
  const effectivePrice = calculateEffectivePrice(offer);
  const totalBaseUnits = calculateTotalBaseUnits(offer);
  const { factorInBase } = getReferenceBaseUnitFactor(referenceBase);
  const unitPrice = totalBaseUnits > 0 ? (effectivePrice / totalBaseUnits) * factorInBase : 0;

  const name = offer.name.trim() || 'Item';
  const store = offer.storeName?.trim() ? ` @ ${offer.storeName.trim()}` : '';
  const price = `$${effectivePrice.toFixed(2)}`;
  const size = `${offer.size || 1} ${offer.unit}${offer.packCount > 1 ? ` (${offer.packCount}-pack)` : ''}`;
  const bestTag = isBestValue ? ' [Best Deal]' : '';

  return `${name}${store} - ${price} (${size}) - ${formatUnitPrice(unitPrice)}/${referenceBase}${bestTag}`;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}

export async function shareItem(
  offer: ProductOffer,
  referenceBase: ReferenceBase,
  isBestValue?: boolean
): Promise<'shared' | 'copied'> {
  const text = formatItemText(offer, referenceBase, isBestValue);
  const title = offer.name.trim() || 'Shopping Item';

  // Try native Capacitor Share plugin first if running in an APK wrapper
  const cap = (window as any).Capacitor;
  if (cap && cap.Plugins && cap.Plugins.Share) {
    try {
      await cap.Plugins.Share.share({
        title,
        text,
        dialogTitle: 'Share Item Details',
      });
      return 'shared';
    } catch (err) {
      console.warn('Capacitor native share failed, falling back:', err);
    }
  }

  // Use standard Web Share API whenever available (mobile Chrome, Safari, etc.)
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
      });
      return 'shared';
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User closed or canceled native share sheet
        return 'shared';
      }
      console.warn('Web share failed, falling back to clipboard copy:', err);
    }
  }

  // Fallback to copying formatted text to clipboard
  await copyTextToClipboard(text);
  return 'copied';
}
