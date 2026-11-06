import Button from './ui/Button'

// Two 48px answer targets for flashcard sessions. Keyboard hints appear only
// once the mobile tab bar hands off to the desktop nav (md), and the sticky
// offset switches at that same breakpoint so the two never disagree.
function KeyHint({ children }) {
  return (
    <kbd
      aria-hidden="true"
      className="hidden rounded-sm border border-current px-1 font-mono text-2xs font-bold opacity-70 md:inline-flex"
    >
      {children}
    </kbd>
  )
}

export default function AnswerBar({ onAgain, onGotIt, disabled = false }) {
  return (
    <div className="sticky bottom-18 z-30 grid grid-cols-2 gap-3 bg-canvas p-2 md:bottom-4">
      <Button
        variant="danger"
        onClick={onAgain}
        aria-label="Missed it"
        disabled={disabled}
        fullWidth
        chunky
        className="min-h-12 gap-2"
      >
        <KeyHint>1</KeyHint> Missed it
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
