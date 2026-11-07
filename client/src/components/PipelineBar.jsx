import Sheet from './Sheet'
import { cn } from '../utils/cn'

// Three pastel cards used to say what this bar says in one read. Sage is
// mastered, accent is learning, and the third fill is neutral. `line` is a
// hairline color — 10% white in dark mode — so a fill built from it vanishes
// on the dark card. The unstarted swatch uses muted ink instead.
const SEGMENTS = [
  { key: 'mastered', label: 'Mastered', fill: 'bg-sage', dot: 'bg-sage' },
  { key: 'learning', label: 'Learning', fill: 'bg-accent', dot: 'bg-accent' },
  {
    key: 'new',
    label: 'Not started',
    fill: 'bg-line dark:bg-ink-muted/40',
    dot: 'bg-line dark:bg-ink-muted/40',
  },
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
        {/* Proportional slices with a floor: at 1% the mastered slice was a
            hairline that read as a rendering artifact. flexGrow keeps the true
            ratio while guaranteeing every non-zero segment stays legible, and
            the gap keeps two adjacent fills from merging into one slab. */}
        <div
          role="img"
          aria-label={summaryText}
          className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-raised"
        >
          {segments.map((segment) =>
            segment.count > 0 ? (
              <span
                key={segment.key}
                className={cn('h-full', segment.fill)}
                style={{ flexGrow: segment.count, flexBasis: 0, minWidth: 6 }}
              />
            ) : null
          )}
        </div>

        {/* Three equal cells, each holding its own label above its own numbers.
            A justified single row pushed a label and its count to opposite
            edges of the card; stacking keeps the pair together by proximity. */}
        <dl className="mt-5 grid grid-cols-3 gap-x-4 gap-y-3">
          {segments.map((segment) => (
            <div key={segment.key}>
              <dt className="flex items-center gap-1.5 text-2xs font-bold tracking-wide text-ink-muted uppercase">
                <span aria-hidden="true" className={cn('h-2 w-2 shrink-0 rounded-sm', segment.dot)} />
                {segment.label}
              </dt>
              <dd className="mt-1 flex items-baseline gap-1.5 font-mono text-sm font-bold text-ink tabular-nums">
                {segment.count}
                <span className="text-2xs font-normal text-ink-muted">
                  {total === 0 ? '—' : `${Math.round((segment.count / total) * 100)}%`}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Sheet>
  )
}
