const BASE = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'vv_token'

function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  return fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const err = new Error(data.message || `Request failed (${res.status})`)
      err.status = res.status
      err.data = data
      throw err
    }
    return data
  })
}

export const api = {
  get: (path, opts) => request(path, opts),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
}
