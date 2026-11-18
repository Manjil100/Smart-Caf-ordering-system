import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import App from './App.jsx'
import './index.css'

// The app is wrapped in:
// - BrowserRouter: lets each page have its own address (/cart, /staff ...)
// - AuthProvider: remembers whether a staff member is logged in
// - CartProvider: remembers what's in the customer's cart on every page
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
