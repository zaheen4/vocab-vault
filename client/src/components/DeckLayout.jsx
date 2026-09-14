import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import ModeTabs from './ModeTabs'
import Practice from '../pages/Practice'
import Quiz from '../pages/Quiz'
import Typing from '../pages/Typing'
import { modeFromPath } from '../utils/deckMode'

// Deck section shell. All three modes stay mounted (hidden when inactive) so
// their in-progress session survives switching tabs; a mode mounts lazily the
// first time it is visited. `key={id}` plus the render-time reset below give a
// clean slate when the deck changes.
export default function DeckLayout() {
  const { id } = useParams()
  const { pathname } = useLocation()
  const mode = modeFromPath(pathname)

  const [deckId, setDeckId] = useState(id)
  const [visited, setVisited] = useState({ practice: true })
  if (deckId !== id) {
    setDeckId(id)
    setVisited({ practice: true })
  }

  useEffect(() => {
    setVisited((v) => (v[mode] ? v : { ...v, [mode]: true }))
  }, [mode])

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <ModeTabs deckId={id} />
      <div key={id}>
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
