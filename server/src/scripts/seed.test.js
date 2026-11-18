import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'url'
import path from 'path'
import { parseArgs, partFor } from './seed.js'

const defaultFile = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../data/gregmat-words.json'
)

describe('parseArgs', () => {
  it('defaults to the bundled dataset with no flags', () => {
    expect(parseArgs([])).toEqual({
      file: defaultFile,
      prune: false,
      yes: false,
      forcePartial: false,
      help: false,
      error: null,
    })
  })

  it('accepts a positional file argument', () => {
    const parsed = parseArgs(['my-subset.json'])
    expect(parsed.file).toBe('my-subset.json')
    expect(parsed.prune).toBe(false)
  })

  it('enables pruning with --prune', () => {
    const parsed = parseArgs(['--prune'])
    expect(parsed.prune).toBe(true)
    expect(parsed.yes).toBe(false)
  })

  it('enables destructive pruning with --prune --yes', () => {
    const parsed = parseArgs(['subset.json', '--prune', '--yes'])
    expect(parsed.file).toBe('subset.json')
    expect(parsed.prune).toBe(true)
    expect(parsed.yes).toBe(true)
  })

  it('reports an error for an unknown flag', () => {
    const parsed = parseArgs(['--nope'])
    expect(parsed.error).toMatch(/Unknown flag: --nope/)
  })

  it('reports an error for a second positional argument', () => {
    const parsed = parseArgs(['a.json', 'b.json'])
    expect(parsed.error).toMatch(/Unexpected argument: b.json/)
  })

  it('recognizes --help', () => {
    expect(parseArgs(['--help']).help).toBe(true)
  })

  it('recognizes --force-partial', () => {
    expect(parseArgs(['--prune', '--yes', '--force-partial']).forcePartial).toBe(true)
  })
})

describe('partFor', () => {
  it('splits each group of 30 words into three parts of ten', () => {
    expect(partFor(0)).toBe(1)
    expect(partFor(9)).toBe(1)
    expect(partFor(10)).toBe(2)
    expect(partFor(19)).toBe(2)
    expect(partFor(20)).toBe(3)
    expect(partFor(30)).toBe(3)
  })
})
