import { cn } from '../utils/cn'

// A badge reads as a rubber stamp: brass and an inked border once earned, a
// dashed outline and its progress hint while it is still locked.
export default function BadgeStamp({ badge, earned, progressText }) {
  const Icon = badge.Icon
  return (
    <div
      title={badge.description}
      className={cn(
        'rounded-lg border-2 p-3 text-center',
        earned ? 'border-accent/50 bg-brass/10' : 'border-dashed border-line bg-raised/40'
      )}
    >
      <p className={cn('flex justify-center', earned ? 'text-brass' : 'text-ink-muted/70 grayscale')}>
        <Icon size={26} />
      </p>
      <p className="mt-1 font-display text-xs font-bold text-ink">{badge.name}</p>
      <p className="mt-0.5 font-mono text-2xs tracking-wide text-ink-muted uppercase">
        {earned ? 'Earned' : progressText}
      </p>
    </div>
  )
}
