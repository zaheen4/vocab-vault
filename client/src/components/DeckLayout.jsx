import { useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import ModeTabs from './ModeTabs'
import PartSelector from './study/PartSelector'
import StudyFrame from './study/StudyFrame'
import StudyHeader from './study/StudyHeader'
import Practice from '../pages/Practice'
import Quiz from '../pages/Quiz'
import Typing from '../pages/Typing'
import { modeFromPath } from '../utils/deckMode'
import { useDeck } from '../api/queries'
import { notePartSwitch } from '../utils/navDirection'
import { deckTotals } from '../utils/homeSections'

export default function DeckLayout() {
  const { id } = useParams()
  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = modeFromPath(pathname)

  const { data: deck } = useDeck(id)
  const currentPart = searchParams.get('part') || 'all'
  const deckKey = `${id}-${currentPart}`

  const [activeKey, setActiveKey] = useState(deckKey)
  const [visited, setVisited] = useState({ practice: true, [mode]: true })
  const [seenMode, setSeenMode] = useState(mode)
  if (activeKey !== deckKey) {
    setActiveKey(deckKey)
    setVisited({ practice: true, [mode]: true })
    setSeenMode(mode)
  } else if (seenMode !== mode) {
    setSeenMode(mode)
    setVisited((v) => (v[mode] ? v : { ...v, [mode]: true }))
  }

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
  const totals = deck ? deckTotals(deck) : { count: 0, pct: 0, started: false, reviewDue: 0 }
  const meta = deck
    ? `${totals.count} ${totals.count === 1 ? 'word' : 'words'}${
        totals.started ? ` · ${totals.pct}% mastered` : ''
      }`
    : ''

  return (
    <StudyFrame>
      <StudyHeader
        title={deck?.title || ''}
        meta={meta}
        backTo="/"
        backLabel="All decks"
        partLabel={currentPart === 'all' ? null : `Part ${currentPart}`}
        due={totals.reviewDue}
      />

      <div className="flex items-center justify-between gap-2">
        <ModeTabs deckId={id} />
        {hasParts && (
          <PartSelector
            currentPart={currentPart}
            onSelectPart={selectPart}
            parts={parts}
            totalWords={deck?.wordIds?.length ?? 30}
          />
        )}
      </div>

      <div key={deckKey} className="flex min-h-0 flex-1 flex-col">
        {visited.practice && (
          <div
            className={
              mode === 'practice' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'
            }
          >
            <Practice active={mode === 'practice'} />
          </div>
        )}
        {visited.quiz && (
          <div className={mode === 'quiz' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
            <Quiz />
          </div>
        )}
        {visited.typing && (
          <div className={mode === 'typing' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
            <Typing />
          </div>
        )}
      </div>
    </StudyFrame>
  )
}
