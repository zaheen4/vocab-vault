import { useId } from 'react'
import { hashSeed, pickSeeded } from './seed.js'

// Generative deck cover: gradient + pattern seeded by deck id. Stable across
// renders (never Math.random), decorative only (aria-hidden, no text).
// Token colors via CSS vars so the test's no-hex rule holds inside SVG.

const PALETTES = [
  { from: 'var(--color-primary)', to: 'var(--color-accent-deep)' },
  { from: 'var(--color-accent-deep)', to: 'var(--color-accent)' },
  { from: 'var(--color-night-900)', to: 'var(--color-primary)' },
  { from: 'var(--color-primary)', to: 'var(--color-night-800)' },
  { from: 'var(--color-accent)', to: 'var(--color-gold)' },
  { from: 'var(--color-night-800)', to: 'var(--color-accent-deep)' },
]

const PATTERNS = ['dots', 'stripes', 'arcs', 'grid']

function Pattern({ kind, id }) {
  const dot = 'var(--color-gold)'
  if (kind === 'dots') {
    return (
      <pattern id={id} width="28" height="28" patternUnits="userSpaceOnUse">
        <circle cx="6" cy="6" r="2.5" fill={dot} opacity="0.5" />
      </pattern>
    )
  }
  if (kind === 'stripes') {
    return (
      <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="8" height="24" fill={dot} opacity="0.28" />
      </pattern>
    )
  }
  if (kind === 'arcs') {
    return (
      <pattern id={id} width="48" height="48" patternUnits="userSpaceOnUse">
        <circle cx="24" cy="24" r="16" fill="none" stroke={dot} strokeWidth="3" opacity="0.35" />
      </pattern>
    )
  }
  return (
    <pattern id={id} width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0v32" fill="none" stroke={dot} strokeWidth="2" opacity="0.3" />
    </pattern>
  )
}

export default function DeckCover({ seed, className = '' }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const palette = pickSeeded(PALETTES, seed) ?? PALETTES[0]
  const pattern = pickSeeded(PATTERNS, `${seed}:p`) ?? PATTERNS[0]
  const angle = hashSeed(`${seed}:a`) % 180
  const gradId = `dcg-${uid}`
  const patId = `dcp-${uid}`
  return (
    <svg
      viewBox="0 0 400 120"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0" gradientTransform={`rotate(${angle} 0.5 0.5)`}>
          <stop offset="0" stopColor={palette.from} />
          <stop offset="1" stopColor={palette.to} />
        </linearGradient>
        <Pattern kind={pattern} id={patId} />
      </defs>
      <rect width="400" height="120" fill={`url(#${gradId})`} />
      <rect width="400" height="120" fill={`url(#${patId})`} />
    </svg>
  )
}
