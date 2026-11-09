import { Link } from 'react-router-dom'

export default function StudyHeader({
  backTo = '/',
  backLabel = 'All decks',
  title,
  meta,
  partLabel = null,
  due = 0,
}) {
  return (
    <div data-testid="deck-header" className="flex min-h-11 items-center gap-1">
      <Link
        to={backTo}
        aria-label={backLabel}
        className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md text-base font-bold text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span aria-hidden="true">←</span>
      </Link>

      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-lg leading-tight font-bold text-ink">
          {title}
        </h1>
        {meta && (
          <p className="truncate font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase">
            {meta}
          </p>
        )}
      </div>

      {partLabel && (
        <span className="shrink-0 rounded-sm border border-line bg-raised px-1.5 py-0.5 font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase">
          {partLabel}
        </span>
      )}

      {due > 0 && (
        <span className="shrink-0 rounded-sm border border-stamp/40 px-1.5 py-0.5 font-mono text-2xs font-bold tracking-widest text-stamp">
          DUE {due}
        </span>
      )}
    </div>
  )
}
