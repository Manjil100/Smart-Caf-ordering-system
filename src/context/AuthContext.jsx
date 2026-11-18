import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isStaff, setIsStaff] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // A logged-in user only counts as staff if they have a row in staff_profiles.
    // RLS only lets them read their own row, so this check can't be faked.
    async function checkStaff(newSession) {
      setSession(newSession)
      if (!newSession) {
        setIsStaff(false)
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('staff_profiles')
        .select('id')
        .eq('id', newSession.user.id)
        .maybeSingle()
      setIsStaff(Boolean(data))
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => checkStaff(data.session))

    // Runs whenever someone logs in or out.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Run the check outside this callback, as Supabase recommends.
      setTimeout(() => checkStaff(newSession), 0)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ session, isStaff, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
