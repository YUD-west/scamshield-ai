import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Register PWA Service Worker for offline resilience
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        if (import.meta.env.DEV) {
          console.log('ScamShield PWA Service Worker registered:', reg.scope);
        }
      })
      .catch((err) => {
        if (import.meta.env.DEV) {
          console.warn('ScamShield PWA Service Worker registration non-fatal notice:', err);
        }
      });
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
