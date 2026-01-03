import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div dir="rtl" className="min-h-screen bg-white font-[Majalla]">
      <App />
    </div>
  </React.StrictMode>
);
