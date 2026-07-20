import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { QueryProvider } from './app/providers/query-provider';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element was not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </StrictMode>,
);