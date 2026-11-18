import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Wraps staff pages. Anyone who isn't logged in as staff goes to the login page.
// (The database also checks this with RLS, so hiding the page isn't the only protection.)
function RequireStaff({ children }) {
  const { isStaff, loading } = useAuth()
  if (loading) return <p>Checking your login…</p>
  if (!isStaff) return <Navigate to="/staff/login" replace />
  return children
}

export default RequireStaff
