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
    { key: 'all', label: `All (${totalWords})`, due: 0 },
    ...[1, 2, 3].map((num) => {
      const p = parts.find((item) => item.part === num)
      const count = p?.wordCount ?? 10
      const due = p?.dueCount ?? 0
      return {
        key: String(num),
        label: `Part ${num} (${count})`,
        due,
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
      className="relative flex items-center justify-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-night-900 dark:shadow-none"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-0 rounded-full bg-accent transition-all duration-250 ease-out motion-reduce:transition-none"
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
      {tabs.map(({ key, label, due }) => {
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
              'relative z-10 min-h-8 rounded-full px-3 py-1 font-display text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-accent',
              isActive
                ? 'text-primary dark:text-night-950'
                : 'text-slate-500 hover:text-primary dark:text-cream-300/80 dark:hover:text-cream-100'
            )}
          >
            {label}
            {due > 0 && (
              <span
                className={cn(
                  'ml-1 font-extrabold',
                  isActive ? 'text-primary dark:text-night-950' : 'text-accent'
                )}
              >
                · {due}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
