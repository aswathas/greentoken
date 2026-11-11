import React from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import App from './App';
import { StoreProvider } from './core/store';
import { MotionProvider } from './motion';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MotionProvider>
      <StoreProvider>
        <App />
      </StoreProvider>
    </MotionProvider>
  </React.StrictMode>,
);
