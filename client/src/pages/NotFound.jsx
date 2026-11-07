import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import EmptyArt from '../components/art/EmptyArt'

export default function NotFound() {
  return (
    <div className="animate-page mx-auto max-w-xl py-10 text-center">
      <div className="flex justify-center" aria-hidden="true">
        <EmptyArt variant="mascot" />
      </div>
      <p className="font-display text-sm font-bold tracking-widest text-accent-ink uppercase">
        404
      </p>
      <h1 className="mt-1 font-display text-2xl font-bold text-ink">
        This word isn&apos;t in the vault.
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
        That page doesn&apos;t exist — it may have moved, or the link has a typo.
      </p>
      <div className="mt-5 flex justify-center gap-3">
        <Link to="/">
          <Button>Back to decks</Button>
        </Link>
        <Link to="/search">
          <Button variant="secondary">Search words</Button>
        </Link>
      </div>
    </div>
  )
}
