import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)))

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

describe('motion imports', () => {
  it('routes every motion import through lib/motion', () => {
    const offenders = files(ROOT)
      .filter((p) => /\.(jsx?|mjs)$/.test(p) && !p.endsWith('lib/motion.jsx'))
      .filter((p) => /from ['"]motion\/react['"]/.test(readFileSync(p, 'utf8')))
      .map((p) => p.replace(ROOT + '/', ''))
    expect(offenders).toEqual([])
  })
})
