import Button from './ui/Button'

// Two 48px answer targets for flashcard sessions. Desktop shows the 1 / 2
// keyboard hints; the accessible name stays exactly "Again" / "Got it" so
// voice control and the e2e suite keep matching the visible label.
function KeyHint({ children }) {
  return (
    <kbd
      aria-hidden="true"
      className="hidden rounded-sm border border-current px-1 font-mono text-2xs font-bold opacity-70 sm:inline-flex"
    >
      {children}
    </kbd>
  )
}

export default function AnswerBar({ onAgain, onGotIt, disabled = false }) {
  return (
    <div className="sticky bottom-18 z-30 grid grid-cols-2 gap-3 rounded-xl border border-line bg-canvas p-2 shadow-paper sm:bottom-4">
      <Button
        variant="danger"
        onClick={onAgain}
        aria-label="Again"
        disabled={disabled}
        fullWidth
        chunky
        className="min-h-12 gap-2"
      >
        <KeyHint>1</KeyHint> Again
      </Button>
      <Button
        variant="success"
        onClick={onGotIt}
        aria-label="Got it"
        disabled={disabled}
        fullWidth
        chunky
        className="min-h-12 gap-2"
      >
        <KeyHint>2</KeyHint> Got it
      </Button>
    </div>
  )
}
