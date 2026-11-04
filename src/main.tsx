import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initGlobalErrorCapture } from './core/diagnostics/diagnosticLogger';

// Initialize global window error and unhandled rejection diagnostic logging
initGlobalErrorCapture();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
