import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, setUnauthorizedHandler } from './client'

const store = new Map()

function jsonResponse(status, data) {
  return { ok: status >= 200 && status < 300, status, json: async () => data }
}

beforeEach(() => {
  store.set('vv_token', 'test-token')
  vi.stubGlobal('localStorage', {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  })
})

afterEach(() => {
  setUnauthorizedHandler(null)
  vi.unstubAllGlobals()
  store.clear()
})

describe('request', () => {
  it('calls the unauthorized handler on a 401 and throws with status 401', async () => {
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, { message: 'Denied' })))

    await expect(api.post('/auth/login', { email: 'a@b.co', password: 'wrong' })).rejects.toMatchObject({
      status: 401,
      message: 'Denied',
    })
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('skips the unauthorized handler when skipUnauthorized is true', async () => {
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, { message: 'Denied' })))

    await expect(
      api.post('/auth/login', { email: 'a@b.co', password: 'wrong' }, { skipUnauthorized: true })
    ).rejects.toMatchObject({ status: 401, message: 'Denied' })
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('returns parsed JSON on a 200 response', async () => {
    const data = { ok: true, user: { name: 'Ada' } }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, data)))

    await expect(api.get('/auth/me')).resolves.toEqual(data)
  })

  it('sends a JSON body on DELETE', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await api.delete('/auth/account', { password: 'secret' })

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ password: 'secret' })
  })
})
