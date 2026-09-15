// Normalized base (no trailing slash) + timeout + global 401 hook.
// Auth state owns the 401 handler; api stays a thin fetch wrapper.
const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '') || '/api'
const TOKEN_KEY = 'vv_token'
const REQUEST_TIMEOUT_MS = 15000

let unauthorizedHandler = null
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = typeof fn === 'function' ? fn : null
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function request(path, { method = 'GET', body, signal } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  // Per-request timeout that still respects a caller-passed signal.
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout

  return fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: combined,
  }).then(
    async (res) => {
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 401 && unauthorizedHandler) {
          try {
            unauthorizedHandler()
          } catch {
            // never let session cleanup break error propagation
          }
        }
        const err = new Error(data.message || `Request failed (${res.status})`)
        err.status = res.status
        err.data = data
        throw err
      }
      return data
    },
    (err) => {
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        const timeoutErr = new Error('Request timed out — check your connection and retry')
        timeoutErr.status = 408
        throw timeoutErr
      }
      throw err
    }
  )
}

export const api = {
  get: (path, opts) => request(path, opts),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
}

// Fire-and-forget server acknowledgement for logout. Bypasses the 401
// handler on purpose: a dead token must not re-trigger logout in a loop.
export function authLogoutBeacon(token) {
  if (!token) return
  fetch(`${BASE}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(5000),
  }).catch(() => {})
}
