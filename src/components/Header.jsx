import { Link, NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

// Shown at the top of every page.
function Header() {
  const { count } = useCart()
  const { isStaff } = useAuth()

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="brand">My Café</Link>
        <nav aria-label="Main">
          <NavLink to="/" end>Menu</NavLink>
          <NavLink to="/cart">
            Cart{count > 0 && <span className="badge" aria-label={`${count} items`}>{count}</span>}
          </NavLink>
          {isStaff ? (
            <>
              <NavLink to="/staff" end>Orders</NavLink>
              <NavLink to="/staff/history">History</NavLink>
              <button type="button" className="link-button" onClick={() => supabase.auth.signOut()}>
                Log out
              </button>
            </>
          ) : (
            <NavLink to="/staff/login">Staff</NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
