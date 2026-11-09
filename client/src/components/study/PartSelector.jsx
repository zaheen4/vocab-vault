import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '../../utils/cn'

function partMeta(part, totalWords) {
  if (!part) return `${totalWords}`
  const count = part.wordCount ?? 10
  const due = part.dueCount ?? 0
  const unseen = part.progress?.new ?? 0
  const reviewDue = Math.max(0, due - unseen)
  if (reviewDue > 0) return `${reviewDue} due`
  const mastered = part.progress?.mastered ?? 0
  const pct = count > 0 ? Math.round((mastered / count) * 100) : 0
  return `${pct}%`
}

export default function PartSelector({
  currentPart = 'all',
  onSelectPart,
  parts = [],
  totalWords = 30,
}) {
  const items = [
    { key: 'all', label: 'All parts', meta: `${totalWords}` },
    ...[1, 2, 3].map((num) => {
      const part = parts.find((item) => item.part === num)
      return {
        key: String(num),
        label: `Part ${num}`,
        meta: partMeta(part, totalWords),
      }
    }),
  ]
  const active = items.find((item) => item.key === currentPart) || items[0]

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="group inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-line bg-card px-3 font-display text-xs font-bold text-ink transition-colors hover:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span className="truncate">{active.key === 'all' ? 'All parts' : active.label}</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-3 shrink-0 text-ink transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
          >
            <path d="M2.5 4.5 6 8l3.5-3.5" />
          </svg>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={6}
          align="end"
          className="z-50 min-w-56 rounded-xl border border-line bg-card p-1 shadow-paper dark:shadow-none"
        >
          <p className="px-2 pt-1 pb-2 font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase">
            Deck parts
          </p>
          <DropdownMenu.RadioGroup
            value={active.key}
            onValueChange={(value) => onSelectPart?.(value)}
          >
            {items.map((item) => (
              <DropdownMenu.RadioItem
                key={item.key}
                value={item.key}
                className={cn(
                  'flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 text-sm font-semibold text-ink outline-none select-none',
                  'data-[highlighted]:bg-raised data-[state=checked]:text-accent-ink'
                )}
              >
                <span className="flex-1 truncate">{item.label}</span>
                <span className="font-mono text-2xs font-bold tracking-wide text-ink-muted tabular-nums">
                  {item.meta}
                </span>
                <DropdownMenu.ItemIndicator>
                  <span aria-hidden="true" className="text-accent-ink">
                    ✓
                  </span>
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
