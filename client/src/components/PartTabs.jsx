import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '../utils/cn'

let lastPartGeometry = null

export default function PartTabs({
  currentPart = 'all',
  onSelectPart,
  parts = [],
  totalWords = 30,
}) {
  const tabRefs = useRef({})
  const [pill, setPill] = useState(() => (lastPartGeometry ? { ...lastPartGeometry, fresh: false } : null))

  const tabs = [
    { key: 'all', label: 'All', meta: `${totalWords}` },
    ...[1, 2, 3].map((num) => {
      const p = parts.find((item) => item.part === num)
      const count = p?.wordCount ?? 10
      const due = p?.dueCount ?? 0
      const unseen = p?.progress?.new ?? 0
      const reviewDue = Math.max(0, due - unseen)
      const mastered = p?.progress?.mastered ?? 0
      const pct = count > 0 ? Math.round((mastered / count) * 100) : 0
      return {
        key: String(num),
        label: `Part ${num}`,
        meta: reviewDue > 0 ? `${reviewDue} due` : `${pct}%`,
        due: reviewDue,
      }
    }),
  ]

  useLayoutEffect(() => {
    const measure = () => {
      const el = tabRefs.current[currentPart]
      if (!el) return
      const next = { x: el.offsetLeft, w: el.offsetWidth }
      lastPartGeometry = next
      setPill((prev) => {
        if (prev && prev.x === next.x && prev.w === next.w) return prev
        return { ...next, fresh: !prev }
      })
    }
    measure()
    window.addEventListener('resize', measure)
    document.fonts?.ready.then(measure).catch(() => {})
    return () => window.removeEventListener('resize', measure)
  }, [currentPart])

  return (
    <div
      role="tablist"
      aria-label="Deck parts"
      className="relative flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-line bg-card p-1 shadow-paper dark:shadow-none"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-0 rounded-md bg-accent transition-all duration-250 ease-out motion-reduce:transition-none"
        style={
          pill
            ? {
                transform: `translateX(${pill.x}px)`,
                width: pill.w,
                opacity: 1,
                transition: pill.fresh ? 'none' : undefined,
              }
            : { opacity: 0 }
        }
      />
      {tabs.map(({ key, label, meta, due }) => {
        const isActive = currentPart === key
        return (
          <button
            key={key}
            ref={(el) => {
              if (el) tabRefs.current[key] = el
              else delete tabRefs.current[key]
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectPart(key)}
            className={cn(
              'relative z-10 flex min-h-10 shrink-0 flex-col items-center justify-center rounded-md px-3 py-1 font-display text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              isActive
                ? 'text-primary dark:text-night-950'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            <span>{label}</span>
            <span
              className={cn(
                'font-mono text-2xs font-bold tracking-wide',
                due > 0 && !isActive ? 'text-stamp' : 'opacity-70'
              )}
            >
              {meta}
            </span>
          </button>
        )
      })}
    </div>
  )
}
