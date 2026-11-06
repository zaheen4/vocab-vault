import Sheet from './Sheet'
import { cn } from '../utils/cn'

// Three pastel cards used to say what this bar says in one read. Sage is
// mastered, accent is learning, the neutral rule is not started.
const SEGMENTS = [
  { key: 'mastered', label: 'Mastered', fill: 'bg-sage', dot: 'bg-sage' },
  { key: 'learning', label: 'Learning', fill: 'bg-accent', dot: 'bg-accent' },
  { key: 'new', label: 'Not started', fill: 'bg-line', dot: 'bg-line' },
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
    <Sheet
      tab="Pipeline"
      title="Learning pipeline"
      meta={
        <span className="font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase tabular-nums">
          {total} {total === 1 ? 'word' : 'words'}
        </span>
      }
    >
      <div
        role="img"
        aria-label={summaryText}
        className="flex h-3 overflow-hidden rounded-full bg-raised"
      >
        {segments.map((segment) =>
          segment.count > 0 ? (
            <span
              key={segment.key}
              className={cn('h-full', segment.fill)}
              style={{ width: `${(segment.count / total) * 100}%` }}
            />
          ) : null
        )}
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-3">
        {segments.map((segment) => (
          <div key={segment.key} className="flex items-baseline justify-between gap-3">
            <dt className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
              <span aria-hidden="true" className={cn('h-2 w-2 rounded-sm', segment.dot)} />
              {segment.label}
            </dt>
            <dd className="font-mono text-sm font-bold text-ink tabular-nums">
              {segment.count}
              <span className="ml-1.5 text-2xs font-normal text-ink-muted">
                {total === 0 ? '' : `${Math.round((segment.count / total) * 100)}%`}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </Sheet>
  )
}
