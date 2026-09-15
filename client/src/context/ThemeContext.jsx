import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const THEME_KEY = 'vv_theme'

const ThemeContext = createContext(null)

function resolveTheme(stored) {
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'system'
    } catch {
      return 'system'
    }
  })

  const theme = preference === 'system' ? resolveTheme(null) : preference

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // Follow the OS while on 'system' (e.g. sunset auto-switch).
  useEffect(() => {
    if (preference !== 'system') return undefined
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return undefined
    const apply = () => document.documentElement.classList.toggle('dark', mq.matches)
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [preference])

  const setTheme = useCallback((next) => {
    setPreference(next)
    try {
      if (next === 'system') localStorage.removeItem(THEME_KEY)
      else localStorage.setItem(THEME_KEY, next)
    } catch {
      // private mode: theme still applies for this session
    }
  }, [])

  const toggle = useCallback(() => {
    setPreference((prev) => {
      const current = prev === 'system' ? resolveTheme(null) : prev
      const next = current === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(THEME_KEY, next)
      } catch {
        // private mode: theme still applies for this session
      }
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, preference, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
