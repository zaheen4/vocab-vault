import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const CLIENT = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const HTML = readFileSync(join(CLIENT, 'index.html'), 'utf8')
const CSS = readFileSync(join(CLIENT, 'src/index.css'), 'utf8')

describe('theme contract', () => {
  it('declares one theme-color meta with no media query', () => {
    const metas = HTML.match(/<meta name="theme-color"[^>]*>/g) ?? []
    expect(metas).toHaveLength(1)
    expect(metas[0]).not.toContain('media=')
    expect(metas[0]).toContain('#e9e6de')
  })

  it('sets color-scheme in both themes', () => {
    expect(CSS).toMatch(/:root\s*\{[^}]*color-scheme:\s*light/)
    expect(CSS).toMatch(/\.dark\s*\{[^}]*color-scheme:\s*dark/)
  })

  it('applies the stored theme before first paint', () => {
    expect(HTML).toContain("localStorage.getItem('vv_theme')")
    expect(HTML).toContain("classList.add('dark')")
    const darkCanvas = CSS.match(/\.dark\s*\{[^}]*--vv-canvas:\s*(#[0-9a-fA-F]{6})/)[1]
    expect(HTML.toLowerCase()).toContain(darkCanvas.toLowerCase())
  })
})
