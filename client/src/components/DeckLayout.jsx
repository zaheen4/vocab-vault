import { Outlet, useParams } from 'react-router-dom'
import ModeTabs from './ModeTabs'

// Deck section shell: one persistent ModeTabs instance above the outlet,
// so the bar never unmounts (no fade, no re-measure) on mode switches.
// Practice is the index child; Quiz and Typing nest unchanged URLs.
export default function DeckLayout() {
  const { id } = useParams()
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <ModeTabs deckId={id} />
      <Outlet />
    </div>
  )
}
