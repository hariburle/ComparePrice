/**
 * Global Debug Mode Configuration
 * 
 * To turn ON debug mode in code:
 * Set `ENABLE_DEBUG_MODE = true` below, or set `VITE_ENABLE_DEBUG=true` in environment variables.
 * 
 * You can also toggle debug mode at runtime by clicking the "AI Gemini Scanner" header in the scan modal,
 * or by setting `localStorage.setItem('app_debug_mode', 'true')` in browser console.
 */

export const ENABLE_DEBUG_MODE = false;

export function isDebugEnabled(): boolean {
  if (typeof window !== 'undefined' && localStorage.getItem('app_debug_mode') === 'true') {
    return true;
  }
  return ENABLE_DEBUG_MODE || import.meta.env.VITE_ENABLE_DEBUG === 'true';
}

export function setDebugMode(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('app_debug_mode', enabled ? 'true' : 'false');
  }
}
