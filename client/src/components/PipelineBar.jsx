import Sheet from './Sheet'
import { cn } from '../utils/cn'

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
    <Sheet tab="Pipeline" title="Where the words sit" className="flex h-full flex-col">
      <div className="flex flex-1 flex-col justify-center">
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

        <dl className="mt-5 grid grid-cols-3 gap-x-3">
          {segments.map((segment, i) => (
            <div
              key={segment.key}
              className={cn('min-w-0', i > 0 && 'border-l border-line pl-3')}
            >
              <dt className="flex items-center gap-1.5 text-3xs font-bold tracking-wide text-ink-muted uppercase">
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
