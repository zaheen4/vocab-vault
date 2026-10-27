import { useEffect, useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import ModeTabs from './ModeTabs'
import PartTabs from './PartTabs'
import Practice from '../pages/Practice'
import Quiz from '../pages/Quiz'
import Typing from '../pages/Typing'
import { modeFromPath } from '../utils/deckMode'
import { useDeck } from '../api/queries'
import { notePartSwitch } from '../utils/navDirection'

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
    if (val === currentPart) return
    notePartSwitch(currentPart, val)
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
        <div className="flex justify-center">
          <PartTabs
            currentPart={currentPart}
            onSelectPart={selectPart}
            parts={parts}
            totalWords={deck?.wordIds?.length ?? 30}
          />
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
