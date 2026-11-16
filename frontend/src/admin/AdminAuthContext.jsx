import { useEffect, useMemo, useState } from 'react'
import { AdminAuthContext } from './adminAuthContext.js'
import { adminApi } from './adminApi.js'

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    adminApi('/auth/me')
      .then(({ user: currentUser }) => { if (active) setUser(currentUser) })
      .catch(() => { if (active) setUser(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    async login(email, password) {
      const result = await adminApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setUser(result.user)
    },
    async logout() {
      try { await adminApi('/auth/logout', { method: 'POST' }) }
      finally { setUser(null) }
    },
  }), [user, loading])

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

