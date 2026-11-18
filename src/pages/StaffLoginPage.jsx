import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'

// Staff log in with the email and password set up in Supabase Auth.
function StaffLoginPage() {
  const { isStaff, session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  if (!loading && isStaff) return <Navigate to="/staff" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setSending(true)
    setError('')
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    setSending(false)
    if (loginError) setError('That email and password don’t match a staff account.')
  }

  return (
    <>
      <h1>Staff login</h1>
      {session && !isStaff && !loading && (
        <p className="error" role="alert">This account isn’t set up as staff.</p>
      )}
      <form onSubmit={handleSubmit} className="card narrow">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={sending}>{sending ? 'Logging in…' : 'Log in'}</button>
      </form>
    </>
  )
}

export default StaffLoginPage
