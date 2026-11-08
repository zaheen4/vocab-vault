import { pickSeeded } from './art/seed.js'

export const TILE_STYLES = [
  'bg-accent/15 text-accent-ink',
  'bg-gold text-accent-deep dark:bg-gold/15 dark:text-gold',
  'bg-ink/10 text-ink',
  'bg-sage/10 text-sage',
]

export default function DeckTile({ id, title, size = 'md' }) {
  const tile = pickSeeded(TILE_STYLES, id) ?? TILE_STYLES[0]
  const dims = size === 'lg' ? 'h-14 w-14 text-2xl' : 'h-11 w-11 text-xl'
  const groupMatch = title?.match(/^Group\s+(\d+)/i)
  const isAll = title?.toLowerCase().includes('all')
  const glyph = isAll ? '⚡' : groupMatch ? groupMatch[1] : (title || '?').trim().charAt(0).toUpperCase()
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-lg font-display font-bold ${dims} ${tile}`}
    >
      {glyph}
    </span>
  )
}
