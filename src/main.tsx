import { registerSW } from 'virtual:pwa-register'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Register PWA service worker with auto-update
registerSW({ immediate: true })

createRoot(document.getElementById("root")!).render(<App />);
