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
    authLogoutBeacon(staleToken)
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    queryClient.clear()
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => logout())
    return () => setUnauthorizedHandler(null)
  }, [logout])

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

  function updateUser(nextUser) {
    setUser(nextUser)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
  }

  function updateToken(nextToken, nextUser) {
    persist(nextToken, nextUser || user)
  }

  async function login(email, password, rememberMe = false) {
    const data = await api.post('/auth/login', { email, password, rememberMe })
    persist(data.token, data.user)
    return data.user
  }

  async function register(name, email, password) {
    const data = await api.post('/auth/register', { name, email, password })
    persist(data.token, data.user)
    return data.user
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, updateUser, updateToken }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
