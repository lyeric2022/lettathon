import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log('🐟 React index.tsx starting...');
console.log('🐟 DOM ready state:', document.readyState);
console.log('🐟 Looking for root element...');

const container = document.getElementById('root');
if (!container) {
  console.error('🐟 Root element not found!');
  throw new Error('Root element not found');
}

console.log('🐟 Root element found, creating React root...');
const root = createRoot(container);
console.log('🐟 Rendering App component...');
root.render(<App />);
console.log('🐟 App component rendered!'); 