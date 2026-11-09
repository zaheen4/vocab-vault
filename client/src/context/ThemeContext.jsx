import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const THEME_KEY = 'vv_theme'

const ThemeContext = createContext(null)

function resolveTheme(stored) {
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  const meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) return
  const canvas = getComputedStyle(document.documentElement)
    .getPropertyValue('--vv-canvas')
    .trim()
  if (canvas) meta.content = canvas
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
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (preference !== 'system') return undefined
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return undefined
    const apply = () => applyTheme(mq.matches ? 'dark' : 'light')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [preference])

  useEffect(() => {
    function handleStorage(event) {
      if (event.key !== THEME_KEY && event.key !== null) return
      let next = 'system'
      try {
        next = localStorage.getItem(THEME_KEY) || 'system'
      } catch {
      }
      setPreference(next)
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [setPreference])

  const setTheme = useCallback((next) => {
    setPreference(next)
    try {
      if (next === 'system') localStorage.removeItem(THEME_KEY)
      else localStorage.setItem(THEME_KEY, next)
    } catch {
    }
  }, [])

  const toggle = useCallback(() => {
    setPreference((prev) => {
      const current = prev === 'system' ? resolveTheme(null) : prev
      const next = current === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(THEME_KEY, next)
      } catch {
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
