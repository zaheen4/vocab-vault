import { Link } from 'react-router-dom'
import { deckTotals } from '../utils/homeSections'
import DeckTile from './DeckTile'

export default function DeckHeader({ deck, part = 'all' }) {
  if (!deck) return null
  const totals = deckTotals(deck)
  const partLabel = part === 'all' ? 'All parts' : `Part ${part}`
  const groupLabel =
    deck.group != null ? `Group ${String(deck.group).padStart(2, '0')}` : 'Personal deck'

  return (
    <div data-testid="deck-header" className="space-y-3 border-b border-line pb-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/"
          className="inline-flex min-h-8 items-center gap-1 text-xs font-bold text-ink-muted transition-colors hover:text-ink"
        >
          <span aria-hidden="true">←</span> All decks
        </Link>
        {totals.reviewDue > 0 && (
          <span className="rounded-sm border border-stamp/40 px-1.5 py-0.5 font-mono text-2xs font-bold tracking-widest text-stamp">
            DUE {totals.reviewDue}
          </span>
        )}
      </div>

      <div className="flex items-start gap-3">
        <DeckTile id={deck._id} title={deck.title} />
        <div className="min-w-0">
          <p className="font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase">
            {groupLabel} · {partLabel}
          </p>
          <h1 className="truncate font-display text-2xl font-bold text-primary dark:text-cream-100">
            {deck.title}
          </h1>
          <p className="mt-0.5 text-xs font-semibold text-ink-muted">
            {totals.count} {totals.count === 1 ? 'word' : 'words'}
            {totals.started && (
              <>
                <span aria-hidden="true"> · </span>
                <span className="text-ink">{totals.pct}% mastered</span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
