import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

const BASE   = import.meta.env.VITE_API_URL || ''
const RT_KEY = 'pw_rt'

async function apiCall(path, options = {}) {
  const res  = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.message || 'Request failed'), { status: res.status })
  return data
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(null)
  const [loading, setLoading] = useState(true)
  const tokenRef = useRef(null)
  useEffect(() => { tokenRef.current = token }, [token])

  // ── Helpers ──────────────────────────────────────────────────────────────

  function persist(accessToken, refreshToken, userData) {
    tokenRef.current = accessToken   // update ref immediately (before next render)
    setToken(accessToken)
    setUser(userData)
    if (refreshToken) localStorage.setItem(RT_KEY, refreshToken)
  }

  function clear() {
    tokenRef.current = null
    setToken(null)
    setUser(null)
    localStorage.removeItem(RT_KEY)
  }

  // Refresh access token using stored refresh token.
  // Returns new { accessToken, refreshToken, user } or throws.
  async function doRefresh() {
    const rt = localStorage.getItem(RT_KEY)
    if (!rt) throw new Error('No refresh token')
    const d = await apiCall('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: rt }),
    })
    persist(d.accessToken, d.refreshToken, d.user)
    return d
  }

  // Authenticated call: auto-retries once after token refresh on 401.
  async function authCall(path, options = {}) {
    const withBearer = (tok) => ({
      ...options,
      headers: { Authorization: `Bearer ${tok}`, ...options.headers },
    })
    try {
      return await apiCall(path, withBearer(tokenRef.current))
    } catch (err) {
      if (err.status !== 401) throw err
      // Access token expired — try refresh then retry once
      const d = await doRefresh()
      return await apiCall(path, withBearer(d.accessToken))
    }
  }

  // ── Restore session on mount ──────────────────────────────────────────────

  useEffect(() => {
    const rt = localStorage.getItem(RT_KEY)
    if (!rt) { setLoading(false); return }
    doRefresh()
      .catch(() => clear())
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Public API ────────────────────────────────────────────────────────────

  const register = useCallback(async ({ firstName, lastName, email, password, dateOfBirth }) => {
    const displayName = [firstName, lastName].filter(Boolean).join(' ')
    const d = await apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName, dateOfBirth }),
    })
    persist(d.accessToken, d.refreshToken, d.user)
    return d.user
  }, [])

  const login = useCallback(async (email, password) => {
    const d = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    persist(d.accessToken, d.refreshToken, d.user)
    return d.user
  }, [])

  const loginWithGoogle = useCallback(async (idToken) => {
    const d = await apiCall('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    })
    persist(d.accessToken, d.refreshToken, d.user)
    return d.user
  }, [])

  const logout = useCallback(async () => {
    const rt = localStorage.getItem(RT_KEY)
    try {
      await authCall('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: rt }),
      })
    } catch {}
    clear()
  }, [])

  const updatePreferences = useCallback(async (prefs) => {
    if (!tokenRef.current) return
    const d = await authCall('/api/auth/preferences', {
      method: 'PATCH',
      body: JSON.stringify(prefs),
    })
    setUser(prev => ({ ...prev, preferences: d.preferences }))
    return d.preferences
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, loginWithGoogle, logout, updatePreferences }}>
      {children}
    </AuthContext.Provider>
  )
}
