import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const HEX = /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b/g

function walk(dir) {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

describe('no raw hex outside the theme', () => {
  it('keeps every color behind index.css @theme tokens or palette vars', () => {
    const hits = []
    for (const path of walk(SRC)) {
      if (path.includes(`${'/'}dist${'/'}`) || path.includes(`${'/'}node_modules${'/'}`)) continue
      if (!/\.(jsx|js|css)$/.test(path) || path.endsWith('.test.js')) continue
      if (path.endsWith('/index.css')) continue
      readFileSync(path, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          for (const m of line.match(HEX) || []) hits.push(`${relative(SRC, path)}:${i + 1} ${m}`)
        })
    }
    expect(hits).toEqual([])
  })
})
