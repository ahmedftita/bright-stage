import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 🛡️ إخماد أخطاء أدوات قياس الأداء الخارجية
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e && e.message && (e.message.includes('startTime') || e.message.includes('reportAllChanges'))) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
