import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Expose debug variable to browser console without import.meta syntax issues
(window as any).__HAS_GEMINI_KEY__ = Boolean(import.meta.env.VITE_GEMINI_API_KEY);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
