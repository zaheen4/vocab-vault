import Sheet from './Sheet'
import { cn } from '../utils/cn'

// Three pastel cards used to say what this bar says in one read. The order is
// the pipeline itself — not started, learning, mastered — so the bar grows
// toward the finish instead of starting with a green knob at zero, and the
// legend reads left to right the way a word travels. Sage is mastered, accent
// is learning, and the third fill is neutral. `line` is a hairline color — 10%
// white in dark mode — so a fill built from it vanishes on the dark card. The
// unstarted swatch uses muted ink instead.
const SEGMENTS = [
  {
    key: 'new',
    label: 'Not started',
    fill: 'bg-line dark:bg-ink-muted/40',
    dot: 'bg-line dark:bg-ink-muted/40',
  },
  { key: 'learning', label: 'Learning', fill: 'bg-accent', dot: 'bg-accent' },
  { key: 'mastered', label: 'Mastered', fill: 'bg-sage', dot: 'bg-sage' },
]

export default function PipelineBar({ summary = {} }) {
  const segments = SEGMENTS.map((segment) => ({
    ...segment,
    count: summary[segment.key] || 0,
  }))
  const total = segments.reduce((sum, segment) => sum + segment.count, 0)
  const summaryText =
    total === 0
      ? 'No words in your learning pipeline yet.'
      : `${segments.map((s) => `${s.count} ${s.label.toLowerCase()}`).join(', ')} — ${total} words in total.`

  return (
    // No header meta: the legend already states every count and its share, and
    // a "1% mastered" chip beside it repeated the first legend line.
    <Sheet tab="Pipeline" title="Where the words sit" className="flex h-full flex-col">
      <div className="flex flex-1 flex-col justify-center">
        {/* One rail with inset pills: a slice sits inside the track rather than
            flush against its rounded end, so a 1% slice reads as a short pill
            instead of a slider knob parked at zero. flexGrow keeps the true
            ratio while the floor guarantees every non-zero segment stays
            visible, and the gaps keep two adjacent fills from merging into one
            uninterrupted slab. */}
        <div
          role="img"
          aria-label={summaryText}
          className="flex h-5 items-stretch gap-1 rounded-full bg-raised p-1"
        >
          {segments.map((segment) =>
            segment.count > 0 ? (
              <span
                key={segment.key}
                className={cn('min-w-2 rounded-full', segment.fill)}
                style={{ flexGrow: segment.count, flexBasis: 0 }}
              />
            ) : null
          )}
        </div>

        {/* Three equal cells, each a small ledger entry: label, then the count
            at display weight, then its share on its own line. The old count and
            share sat on one baseline at nearly the same size — "1 1%" read as
            a stutter. Rule-separated cells keep each stage's numbers together
            without letting a label drift away from the value it names. */}
        <dl className="mt-5 grid grid-cols-3 gap-x-3">
          {segments.map((segment, i) => (
            <div
              key={segment.key}
              className={cn('min-w-0', i > 0 && 'border-l border-line pl-3')}
            >
              <dt className="flex items-center gap-1.5 text-2xs font-bold tracking-wide text-ink-muted uppercase">
                <span
                  aria-hidden="true"
                  className={cn('h-2 w-2 shrink-0 rounded-sm', segment.dot)}
                />
                <span className="truncate">{segment.label}</span>
              </dt>
              <dd className="mt-1.5 font-mono text-base leading-none font-bold text-ink tabular-nums sm:text-lg">
                {segment.count}
              </dd>
              <dd className="mt-1 font-mono text-2xs text-ink-muted tabular-nums">
                {total === 0 ? '—' : `${Math.round((segment.count / total) * 100)}%`}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Sheet>
  )
}
