import Sheet from './Sheet'
import { weekDays, weekLevel, weekTotal } from '../utils/weekActivity'
import { cn } from '../utils/cn'

const TONES = {
  0: 'border-dashed border-line bg-transparent',
  1: 'border-line bg-accent/15',
  2: 'border-line bg-accent/35',
  3: 'border-line bg-accent/60',
}

// Seven cells, oldest first, today outlined. A day with no reviews keeps its
// cell: a gap would read as missing data instead of a day off.
export default function WeekStrip({ activity = [] }) {
  const days = weekDays(activity)
  const total = weekTotal(days)
  const max = Math.max(1, ...days.map((day) => day.reviews))

  return (
    <Sheet
      tab="Study log"
      title="This week"
      className="flex h-full flex-col"
      meta={
        <span className="font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase tabular-nums">
          {total} {total === 1 ? 'review' : 'reviews'}
        </span>
      }
    >
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const label = `${day.key}: ${day.reviews} ${day.reviews === 1 ? 'review' : 'reviews'}${day.isToday ? ', today' : ''}`
          return (
            <div key={day.key} className="flex flex-col items-center gap-1.5">
              <span
                role="img"
                aria-label={label}
                title={label}
                className={cn(
                  'flex h-14 w-full items-center justify-center rounded-md border font-mono text-sm font-bold text-ink tabular-nums',
                  TONES[weekLevel(day.reviews, max)],
                  day.isToday && 'ring-2 ring-ink'
                )}
              >
                {day.reviews > 0 ? day.reviews : ''}
              </span>
              <span aria-hidden="true" className="font-mono text-2xs text-ink-muted">
                {day.letter}
              </span>
            </div>
          )
        })}
      </div>
      <p className="mt-auto pt-3 text-xs text-ink-muted">
        {total === 0
          ? 'No reviews this week yet.'
          : `${total} review${total === 1 ? '' : 's'} in the last seven days.`}
      </p>
    </Sheet>
  )
}
