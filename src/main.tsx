import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';


import '@fontsource/open-sans/latin-400.css';
import '@fontsource/open-sans/latin-ext-400.css';
import '@fontsource/open-sans/latin-500.css';
import '@fontsource/open-sans/latin-ext-500.css';
import '@fontsource/open-sans/latin-600.css';
import '@fontsource/open-sans/latin-ext-600.css';
import '@fontsource/open-sans/latin-700.css';
import '@fontsource/open-sans/latin-ext-700.css';
import '@fontsource/fira-sans/latin-400.css';
import '@fontsource/fira-sans/latin-ext-400.css';
import '@fontsource/fira-sans/latin-500.css';
import '@fontsource/fira-sans/latin-ext-500.css';
import '@fontsource/fira-sans/latin-600.css';
import '@fontsource/fira-sans/latin-ext-600.css';
import '@fontsource/fira-sans/latin-700.css';
import '@fontsource/fira-sans/latin-ext-700.css';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
