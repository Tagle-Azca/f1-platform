import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

const BASE = import.meta.env.VITE_API_URL || ''

async function apiCall(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(null)
  const [loading, setLoading] = useState(true)
  const tokenRef = useRef(null)

  // Keep ref in sync for use in callbacks without stale closures
  useEffect(() => { tokenRef.current = token }, [token])

  // On mount: restore session via refresh token (httpOnly cookie)
  useEffect(() => {
    apiCall('/api/auth/refresh', { method: 'POST' })
      .then(d => { setToken(d.accessToken); setUser(d.user) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const d = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setToken(d.accessToken)
    setUser(d.user)
    return d.user
  }, [])

  const loginWithGoogle = useCallback(async (credential) => {
    const d = await apiCall('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    })
    setToken(d.accessToken)
    setUser(d.user)
    return d.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiCall('/api/auth/logout', {
        method: 'POST',
        headers: tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {},
      })
    } catch {}
    setToken(null)
    setUser(null)
  }, [])

  const updatePreferences = useCallback(async (prefs) => {
    if (!tokenRef.current) return
    const d = await apiCall('/api/auth/preferences', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify(prefs),
    })
    setUser(prev => ({ ...prev, preferences: d.preferences }))
    return d.preferences
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithGoogle, logout, updatePreferences }}>
      {children}
    </AuthContext.Provider>
  )
}
