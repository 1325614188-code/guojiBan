
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import LinktreeView from './views/LinktreeView';
import './lib/i18n';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const isLinktree = window.location.pathname.startsWith('/linktree');

root.render(
  <React.StrictMode>
    {isLinktree ? <LinktreeView /> : <App />}
  </React.StrictMode>
);
