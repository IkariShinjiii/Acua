import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App.jsx'
import Preloader from './components/Preloader.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      {/* reducedMotion="user" makes every Framer Motion animation in the app
          respect the OS-level prefers-reduced-motion setting automatically,
          without touching each component individually. */}
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
        {/* A sibling of App rather than inside it, so it overlays the very
            first paint and unmounts itself without touching App's state. */}
        <Preloader />
      </MotionConfig>
    </ErrorBoundary>
  </StrictMode>,
)
