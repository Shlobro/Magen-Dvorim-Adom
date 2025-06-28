// frontend/src/main.jsx
import './utils/polyfills'; // Load polyfills first
import { initCompatibility } from './utils/browserCompat'; // Initialize browser compatibility
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import './styles/browser-compatibility.css';

// Initialize browser compatibility detection
initCompatibility();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
