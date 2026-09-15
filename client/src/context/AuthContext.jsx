import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { api, authLogoutBeacon, setUnauthorizedHandler } from '../api/client'
import { queryClient } from '../api/queryClient'

const TOKEN_KEY = 'vv_token'
const USER_KEY = 'vv_user'

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Minimal shape guard: tampered or legacy values must not reach the UI.
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    if (typeof parsed.name !== 'string' || typeof parsed.email !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(readStoredUser)
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY))

  const logout = useCallback(() => {
    const staleToken = localStorage.getItem(TOKEN_KEY)
    // Best-effort server acknowledgement; logout stays local-first so a dead
    // network never traps the user in a logged-in shell.
    authLogoutBeacon(staleToken)
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    // Drop the previous user's cached decks/bookmarks/progress so the next
    // login on a shared device never paints stale private data.
    queryClient.clear()
  }, [])

  // Any 401 from the api layer means the token is dead — end the session once.
  useEffect(() => {
    setUnauthorizedHandler(() => logout())
    return () => setUnauthorizedHandler(null)
  }, [logout])

  // Revalidate whenever the token changes (login, logout, multi-tab writes).
  // Only a 401 ends the session: aborts (unload/navigation races), timeouts,
  // and transient network failures must never wipe a stored session — the
  // request layer surfaces those to the failing query instead.
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return undefined
    }
    let cancelled = false
    setLoading(true)
    api
      .get('/auth/me')
      .then((data) => {
        if (cancelled) return
        setUser(data.user)
        localStorage.setItem(USER_KEY, JSON.stringify(data.user))
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        if (err?.status === 401) logout()
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, logout])

  function persist(nextToken, nextUser) {
    setToken(nextToken)
    setUser(nextUser)
    localStorage.setItem(TOKEN_KEY, nextToken)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
  }

  async function login(email, password) {
    const data = await api.post('/auth/login', { email, password })
    persist(data.token, data.user)
    return data.user
  }

  async function register(name, email, password) {
    const data = await api.post('/auth/register', { name, email, password })
    persist(data.token, data.user)
    return data.user
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
