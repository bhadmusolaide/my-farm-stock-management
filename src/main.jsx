import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './context/ThemeContext'
import { SiteSettingsProvider } from './context/SiteSettingsContext'
import { NotificationProvider } from './context/NotificationContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <SiteSettingsProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </SiteSettingsProvider>
    </ThemeProvider>
  </StrictMode>,
)
