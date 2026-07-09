import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppProviders } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import './styles/mobile.css';

// Global LocalStorage Quota safety wrapper to prevent QuotaExceededError crashes
if (typeof window !== 'undefined' && window.localStorage) {
  const originalSetItem = window.localStorage.setItem;
  window.localStorage.setItem = function(key: string, value: string) {
    try {
      originalSetItem.call(window.localStorage, key, value);
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22 || e.number === 0x8007000E || String(e).includes('quota')) {
        console.warn('LocalStorage quota exceeded! Clearing non-critical caches to free space...', key);
        const nonCriticalCaches = [
          'colores_pizzeria_cache_menu',
          'colores_pizzeria_cache_insumos',
          'colores_pizzeria_cache_recetas',
          'colores_pizzeria_cache_categorias',
          'colores_pizzeria_cache_proveedores',
          'colores_pizzeria_cache_pedidos',
          'colores_pizzeria_cache_reservas'
        ];
        nonCriticalCaches.forEach(k => {
          try {
            window.localStorage.removeItem(k);
          } catch (err) {}
        });
        // Retry
        try {
          originalSetItem.call(window.localStorage, key, value);
        } catch (retryError) {
          console.error('Failed to setItem even after clearing non-critical caches:', retryError);
        }
      } else {
        throw e;
      }
    }
  };
}

// Global error handlers — runs BEFORE React mounts
window.addEventListener('error', (e) => {
  // Catch unhandled runtime errors
  console.error('[Root] Uncaught error:', e.error || e.message);
  // Don't reload here — let ErrorBoundary handle it
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('Failed to fetch dynamically imported module') ||
      event.reason?.message?.includes('Importing a module script failed') ||
      event.reason?.message?.includes('Loading chunk')) {
    event.preventDefault();
    console.warn('[PWA] Chunk load error — reloading.');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) reg.unregister();
      });
    }
    window.location.reload();
  }
});

// Log render-blocking errors to help debug white screen
try {
  const root = document.getElementById('root');
  if (!root) {
    document.body.innerHTML = `<div style="padding:2rem;text-align:center;font-family:sans-serif">
      <h2>Error: #root no encontrado</h2>
      <p>Verificá que index.html tenga el div correcto.</p>
    </div>`;
  }
} catch (e) {
  document.body.innerHTML = `<div style="padding:2rem;text-align:center">
    <h2>Error crítico al iniciar</h2>
    <pre>${String(e)}</pre>
  </div>`;
}

import { syncQueueService } from './services/syncQueueService';

// Force Light Mode always
if (typeof window !== 'undefined') {
  document.documentElement.classList.remove('dark');
  window.localStorage.setItem('appTheme', 'light');
}

// Initialize offline background sync queue
syncQueueService.initBackgroundSync();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary moduleName="ROOT">
      <AppProviders>
        <App />
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>,
);
