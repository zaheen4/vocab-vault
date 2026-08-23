import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'

const TOKEN_KEY = 'vv_token'
const USER_KEY = 'vv_user'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY))
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY))

  useEffect(() => {
    if (!token) return undefined
    let cancelled = false
    api
      .get('/auth/me')
      .then((data) => {
        if (cancelled) return
        setUser(data.user)
        localStorage.setItem(USER_KEY, JSON.stringify(data.user))
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        logout()
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  function logout() {
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
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
