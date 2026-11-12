import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import store from './store';
import { registerServiceWorker } from './services/registerServiceWorker';
import { STORAGE_KEYS, THEMES } from './utils/constants';
import { readStorage } from './utils/storage';
import './styles/global.css';

function applyInitialTheme() {
  const stored = readStorage(STORAGE_KEYS.settings, null);
  const theme = stored && THEMES.includes(stored.theme) ? stored.theme : 'system';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
  document.documentElement.setAttribute('data-theme', resolved);
}

applyInitialTheme();
registerServiceWorker();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
