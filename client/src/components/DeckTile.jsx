import { pickSeeded } from './art/seed.js'

// Seeded initial tile shared by deck cards and mode lobbies. The tile style
// is stable per id so a deck is recognizable everywhere it appears.
const TILE_STYLES = [
  'bg-accent/15 text-accent-deep dark:bg-accent/20 dark:text-accent',
  'bg-gold text-accent-deep dark:bg-gold/15 dark:text-gold',
  'bg-primary/10 text-primary dark:bg-white/10 dark:text-cream-100',
  'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300',
]

export default function DeckTile({ id, title, size = 'md' }) {
  const tile = pickSeeded(TILE_STYLES, id) ?? TILE_STYLES[0]
  const dims = size === 'lg' ? 'h-14 w-14 text-2xl' : 'h-11 w-11 text-xl'
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-lg font-display font-bold ${dims} ${tile}`}
    >
      {(title || '?').trim().charAt(0).toUpperCase()}
    </span>
  )
}
