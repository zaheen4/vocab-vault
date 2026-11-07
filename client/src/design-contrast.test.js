import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Pure WCAG 2.1 contrast checks for the design tokens. Every color lives in
// index.css; this test reads those values instead of duplicating the palette,
// so a token edit that breaks a key pair fails here before it ships.

const SRC = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const CSS = readFileSync(join(SRC, 'src/index.css'), 'utf8')

function block(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = CSS.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`))
  if (!match) throw new Error(`missing ${selector} block in index.css`)
  return Object.fromEntries(
    [...match[1].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map(([, name, value]) => [
      name,
      value.toLowerCase(),
    ])
  )
}

const theme = block('@theme')
const light = block(':root')
const dark = block('.dark')

const lightColor = (name) => light[`vv-${name}`]
const darkColor = (name) => dark[`vv-${name}`]
const staticColor = (name) => theme[`color-${name}`]

function channel(value) {
  const c = parseInt(value, 16) / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => channel(hex.slice(i, i + 2)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a, b) {
  const [darker, lighter] = [luminance(a), luminance(b)].sort((x, y) => x - y)
  return (lighter + 0.05) / (darker + 0.05)
}

const NORMAL_TEXT = 4.5
const LARGE_TEXT_OR_UI = 3

describe('light theme contrast', () => {
  it('keeps ink and muted ink readable on canvas and cards', () => {
    for (const surface of [lightColor('canvas'), lightColor('card')]) {
      expect(contrast(lightColor('ink'), surface)).toBeGreaterThanOrEqual(NORMAL_TEXT)
    }
    expect(contrast(lightColor('ink-muted'), lightColor('card'))).toBeGreaterThanOrEqual(NORMAL_TEXT)
  })

  it('keeps small accent text readable on card and gold', () => {
    expect(contrast(lightColor('accent-ink'), lightColor('card'))).toBeGreaterThanOrEqual(NORMAL_TEXT)
    expect(contrast(lightColor('accent-ink'), staticColor('gold'))).toBeGreaterThanOrEqual(
      NORMAL_TEXT
    )
  })

  it('keeps ink readable on the manila passport stock', () => {
    expect(contrast(lightColor('ink'), lightColor('manila'))).toBeGreaterThanOrEqual(NORMAL_TEXT)
    expect(contrast(lightColor('ink-muted'), lightColor('manila'))).toBeGreaterThanOrEqual(
      NORMAL_TEXT
    )
    expect(contrast(lightColor('accent-ink'), lightColor('manila'))).toBeGreaterThanOrEqual(
      NORMAL_TEXT
    )
  })

  it('keeps status ink readable on cards', () => {
    expect(contrast(lightColor('stamp'), lightColor('card'))).toBeGreaterThanOrEqual(NORMAL_TEXT)
    expect(contrast(lightColor('sage'), lightColor('card'))).toBeGreaterThanOrEqual(NORMAL_TEXT)
    expect(contrast(lightColor('brass'), lightColor('card'))).toBeGreaterThanOrEqual(NORMAL_TEXT)
  })

  it('keeps white readable on the stamp fill', () => {
    expect(contrast('#ffffff', lightColor('stamp'))).toBeGreaterThanOrEqual(NORMAL_TEXT)
  })
})

describe('dark theme contrast', () => {
  it('keeps ink and muted ink readable on canvas and cards', () => {
    for (const surface of [darkColor('canvas'), darkColor('card')]) {
      expect(contrast(darkColor('ink'), surface)).toBeGreaterThanOrEqual(NORMAL_TEXT)
    }
    expect(contrast(darkColor('ink-muted'), darkColor('card'))).toBeGreaterThanOrEqual(NORMAL_TEXT)
  })

  it('keeps accent and status ink readable on cards', () => {
    for (const name of ['accent-ink', 'stamp', 'sage', 'brass']) {
      expect(contrast(darkColor(name), darkColor('card'))).toBeGreaterThanOrEqual(NORMAL_TEXT)
    }
  })

  it('keeps ink readable on the manila passport stock', () => {
    expect(contrast(darkColor('ink'), darkColor('manila'))).toBeGreaterThanOrEqual(NORMAL_TEXT)
    expect(contrast(darkColor('ink-muted'), darkColor('manila'))).toBeGreaterThanOrEqual(NORMAL_TEXT)
    expect(contrast(darkColor('accent-ink'), darkColor('manila'))).toBeGreaterThanOrEqual(
      NORMAL_TEXT
    )
  })

  it('keeps cream ink readable on the night surfaces', () => {
    expect(contrast(staticColor('cream-100'), staticColor('night-900'))).toBeGreaterThanOrEqual(
      NORMAL_TEXT
    )
  })
})

describe('brand fill contrast', () => {
  it('keeps navy ink readable on the accent button fill', () => {
    expect(contrast(staticColor('primary'), staticColor('accent'))).toBeGreaterThanOrEqual(
      NORMAL_TEXT
    )
  })

  it('keeps the accent fill visible on the dark canvas', () => {
    expect(contrast(staticColor('accent'), staticColor('night-950'))).toBeGreaterThanOrEqual(
      LARGE_TEXT_OR_UI
    )
  })

  it('keeps the accent text token aligned with the static accent-deep fill', () => {
    expect(lightColor('accent-ink')).toBe(staticColor('accent-deep'))
  })

  it('keeps each tactile edge distinct from its own fill and visible on a card', () => {
    // A chunky border painted with a translucent version of the fill under it
    // is invisible; the edge has to be its own darker token.
    expect(contrast(staticColor('accent-deep'), staticColor('accent'))).toBeGreaterThan(1.5)
    for (const theme of [
      { fill: lightColor('stamp'), edge: lightColor('stamp-deep'), card: lightColor('card') },
      { fill: darkColor('stamp'), edge: darkColor('stamp-deep'), card: darkColor('card') },
    ]) {
      expect(contrast(theme.edge, theme.fill)).toBeGreaterThan(1.5)
      expect(contrast(theme.edge, theme.card)).toBeGreaterThanOrEqual(LARGE_TEXT_OR_UI)
    }
  })
})
