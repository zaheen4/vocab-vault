import { useEffect, useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import ModeTabs from './ModeTabs'
import Practice from '../pages/Practice'
import Quiz from '../pages/Quiz'
import Typing from '../pages/Typing'
import { modeFromPath } from '../utils/deckMode'
import { useDeck } from '../api/queries'
import { cn } from '../utils/cn'

// Deck section shell. All three modes stay mounted (hidden when inactive) so
// their in-progress session survives switching tabs; a mode mounts lazily the
// first time it is visited. `key={deckKey}` plus the render-time reset below give a
// clean slate when the deck or part changes.
export default function DeckLayout() {
  const { id } = useParams()
  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = modeFromPath(pathname)

  const { data: deck } = useDeck(id)
  const currentPart = searchParams.get('part') || 'all'
  const deckKey = `${id}-${currentPart}`

  const [activeKey, setActiveKey] = useState(deckKey)
  const [visited, setVisited] = useState({ practice: true })
  if (activeKey !== deckKey) {
    setActiveKey(deckKey)
    setVisited({ practice: true })
  }

  useEffect(() => {
    setVisited((v) => (v[mode] ? v : { ...v, [mode]: true }))
  }, [mode])

  const selectPart = (val) => {
    const next = new URLSearchParams(searchParams)
    if (val === 'all') {
      next.delete('part')
    } else {
      next.set('part', String(val))
    }
    setSearchParams(next, { replace: true })
  }

  const parts = deck?.parts || []
  const hasParts = parts.length > 1 || (deck?.wordIds && deck.wordIds.length > 10)

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <ModeTabs deckId={id} />
      {hasParts && (
        <div
          role="group"
          aria-label="Deck parts"
          className="flex items-center justify-center gap-1.5"
        >
          <span className="mr-1 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-cream-300/60">
            Part:
          </span>
          <button
            type="button"
            onClick={() => selectPart('all')}
            className={cn(
              'min-h-8 rounded-full px-3 py-1 font-display text-xs font-bold transition-all focus-visible:outline-2 focus-visible:outline-accent',
              currentPart === 'all'
                ? 'bg-accent text-primary shadow-sm dark:text-night-950'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-night-800 dark:text-cream-100 dark:hover:bg-night-800/80'
            )}
          >
            All {deck?.wordIds?.length ? `(${deck.wordIds.length})` : ''}
          </button>
          {[1, 2, 3].map((num) => {
            const partInfo = parts.find((p) => p.part === num)
            const count = partInfo?.wordCount ?? 10
            const due = partInfo?.dueCount ?? 0
            const isActive = currentPart === String(num)
            return (
              <button
                key={num}
                type="button"
                onClick={() => selectPart(String(num))}
                className={cn(
                  'min-h-8 rounded-full px-3 py-1 font-display text-xs font-bold transition-all focus-visible:outline-2 focus-visible:outline-accent',
                  isActive
                    ? 'bg-accent text-primary shadow-sm dark:text-night-950'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-night-800 dark:text-cream-100 dark:hover:bg-night-800/80'
                )}
              >
                Part {num} ({count})
                {due > 0 && <span className="ml-1 font-extrabold text-accent">· {due}</span>}
              </button>
            )
          })}
        </div>
      )}
      <div key={deckKey}>
        {visited.practice && (
          <div hidden={mode !== 'practice'}>
            <Practice active={mode === 'practice'} />
          </div>
        )}
        {visited.quiz && (
          <div hidden={mode !== 'quiz'}>
            <Quiz />
          </div>
        )}
        {visited.typing && (
          <div hidden={mode !== 'typing'}>
            <Typing />
          </div>
        )}
      </div>
    </div>
  )
}
