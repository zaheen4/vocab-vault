#!/usr/bin/env node
// Verifies that the prose in README.md and docs/ still matches the code.
// Run with `npm run docs:check`. Exits 1 on any mismatch.

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(ROOT, p), 'utf8')
const DOC_FILES = [
  'README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'TODO.md',
  ...readdirSync(join(ROOT, 'docs'))
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => `docs/${f}`),
]

// Vars read at runtime from the platform, not from .env.
const RUNTIME_ENV = new Set([
  'NODE_ENV',
  'RENDER_GIT_COMMIT',
  'SOURCE_VERSION',
  'DEV',
  'PROD',
  'SSR',
])

const failures = []
const fail = (check, message) => failures.push({ check, message })
const unique = (xs) => [...new Set(xs)].sort()
const stripFences = (md) => md.replace(/```[\s\S]*?```/g, '')

function checkLinks() {
  let scanned = 0
  for (const doc of DOC_FILES) {
    const body = stripFences(read(doc))
    for (const [, target] of body.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
      if (/^(https?:|mailto:|#)/.test(target)) continue
      const [path] = target.split('#')
      if (!path) continue
      scanned += 1
      if (!existsSync(join(ROOT, dirname(doc), path))) {
        fail('links', `${doc}: missing target ${path}`)
      }
    }
  }
  return `${scanned} relative links`
}

function checkEndpoints() {
  const readme = read('README.md')
  const documented = new Set()
  for (const [, method, path] of readme.matchAll(
    /^\|\s*(GET|POST|PATCH|PUT|DELETE)\s*\|\s*`([^`]+)`/gm
  )) {
    documented.add(`${method} ${path.replace(/\/$/, '')}`)
  }

  const server = read('server/src/server.js')
  const mounts = new Map()
  for (const [, spec, target] of server.matchAll(
    /import\s+(\w+)\s+from\s+'\.\/routes\/([\w.]+)'/g
  )) {
    mounts.set(spec, target)
  }

  const routed = new Set()
  const mountFor = new Map()
  for (const [, prefix, spec] of server.matchAll(/app\.use\('([^']+)',\s*(\w+)\)/g)) {
    const file = mounts.get(spec)
    if (file) mountFor.set(file, prefix.replace(/\/$/, ''))
  }

  for (const [file, prefix] of mountFor) {
    const src = read(`server/src/routes/${file}`)
    for (const [, method, path] of src.matchAll(
      /router\.(get|post|patch|put|delete)\(\s*'([^']+)'/g
    )) {
      const full = `${prefix}${path === '/' ? '' : path}`
      routed.add(`${method.toUpperCase()} ${full.replace(/\/$/, '')}`)
    }
  }
  for (const [, method, path] of server.matchAll(
    /app\.(get|post|patch|put|delete)\('(\/api[^']+)'/g
  )) {
    routed.add(`${method.toUpperCase()} ${path.replace(/\/$/, '')}`)
  }

  for (const route of unique([...routed])) {
    if (!documented.has(route)) fail('endpoints', `${route} is routed but not in README`)
  }
  for (const route of unique([...documented])) {
    if (!routed.has(route)) fail('endpoints', `${route} is in README but has no route`)
  }
  return `${routed.size} routes, ${documented.size} documented`
}

function cssBlock(selector) {
  const css = read('client/src/index.css')
  const start = css.indexOf(`${selector} {`)
  if (start === -1) return ''
  let depth = 0
  for (let i = css.indexOf('{', start); i < css.length; i += 1) {
    if (css[i] === '{') depth += 1
    if (css[i] === '}') {
      depth -= 1
      if (depth === 0) return css.slice(start, i)
    }
  }
  return ''
}

function tokenValue(block, name) {
  const match = block.match(new RegExp(`--vv-${name}:\\s*([^;]+);`))
  return match ? match[1].trim() : null
}

const normalizeColor = (value) =>
  String(value)
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/(?<=[(,])\.(\d)/g, '0.$1')

function checkTokens() {
  const light = cssBlock(':root')
  const dark = cssBlock('.dark')
  let rows = 0
  for (const [, token, lightValue, darkValue] of read('README.md').matchAll(
    /^\|\s*`([a-z-]+)`\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|/gm
  )) {
    rows += 1
    const actualLight = tokenValue(light, token)
    const actualDark = tokenValue(dark, token)
    if (!actualLight || !actualDark) {
      fail('tokens', `--vv-${token} is not defined in index.css`)
      continue
    }
    if (normalizeColor(actualLight) !== normalizeColor(lightValue)) {
      fail('tokens', `${token} light: README ${lightValue}, css ${actualLight}`)
    }
    if (normalizeColor(actualDark) !== normalizeColor(darkValue)) {
      fail('tokens', `${token} dark: README ${darkValue}, css ${actualDark}`)
    }
  }
  return `${rows} tokens`
}

function walk(dir, out = []) {
  for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue
    const rel = `${dir}/${entry.name}`
    if (entry.isDirectory()) walk(rel, out)
    else out.push(rel)
  }
  return out
}

function checkEnv() {
  const used = new Set()
  for (const file of walk('server/src')) {
    if (!file.endsWith('.js') || file.endsWith('.test.js')) continue
    const src = read(file)
    for (const [, name] of src.matchAll(/process\.env\.([A-Z_0-9]+)/g)) used.add(name)
  }
  for (const file of walk('client/src')) {
    if (!/\.(jsx?|css)$/.test(file)) continue
    const src = read(file)
    for (const [, name] of src.matchAll(/import\.meta\.env\.([A-Z_0-9]+)/g)) used.add(name)
  }

  const documented = new Set(RUNTIME_ENV)
  for (const [, name] of read('server/.env.example').matchAll(/^([A-Z_0-9]+)=/gm)) {
    documented.add(name)
  }
  for (const line of read('README.md').split('\n')) {
    if (!line.startsWith('| `')) continue
    const firstCell = line.split('|')[1] || ''
    for (const [, name] of firstCell.matchAll(/`([A-Z_0-9]+)`/g)) documented.add(name)
  }

  for (const name of unique([...used])) {
    if (!documented.has(name)) fail('env', `${name} is read by the code but not documented`)
  }
  return `${used.size} variables`
}

function checkNodeVersions() {
  const ci = read('.github/workflows/ci.yml')
  const versions = unique([...ci.matchAll(/"(\d+)"/g)].map((m) => m[1]))
  const docs = {
    'README.md': read('README.md'),
    'AGENTS.md': read('AGENTS.md'),
  }
  for (const [doc, body] of Object.entries(docs)) {
    for (const version of versions) {
      if (!body.includes(version)) {
        fail('node', `${doc} never mentions Node ${version} from the CI matrix`)
      }
    }
  }
  return `Node ${versions.join(' / ')}`
}

const summary = [
  ['links', checkLinks()],
  ['endpoints', checkEndpoints()],
  ['tokens', checkTokens()],
  ['env', checkEnv()],
  ['node', checkNodeVersions()],
]

const byCheck = new Map()
for (const { check, message } of failures) {
  if (!byCheck.has(check)) byCheck.set(check, [])
  byCheck.get(check).push(message)
}

for (const [check, detail] of summary) {
  const problems = byCheck.get(check) ?? []
  const mark = problems.length === 0 ? 'ok  ' : 'FAIL'
  console.log(`${mark} ${check.padEnd(10)} ${detail}`)
  for (const problem of problems) console.log(`     - ${problem}`)
}

const total = failures.length
console.log(total === 0 ? '\ndocs match the code' : `\n${total} mismatch${total === 1 ? '' : 'es'}`)
process.exit(total === 0 ? 0 : 1)
