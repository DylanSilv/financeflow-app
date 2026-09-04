import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from './components/ui/sonner'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="fintrack-ui-theme">
      <ErrorBoundary>
        <App />
        <Toaster richColors position="top-right" />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
)
