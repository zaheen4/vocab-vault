// Shared flashcard face: prompt on front, answer on back. Study controls
// (speaker, answer buttons) live outside — never nest interactives here.
// The surface is an index card: card stock, 2px rule, one accent top rule,
// a corner tab and a stacked card peeking out behind it.
export default function Flashcard({ word, flipped, onFlip, shake, reversed }) {
  const prompt = reversed ? (
    <>
      <p className="text-lg font-semibold text-primary dark:text-cream-100">{word.definition}</p>
      {word.example && (
        <p className="mt-1 text-sm text-ink-muted italic">“{word.example}”</p>
      )}
      {word.synonyms?.length > 0 && (
        <p className="mt-1 text-sm text-ink-muted">Synonyms: {word.synonyms.join(', ')}</p>
      )}
    </>
  ) : (
    <>
      <h2 className="text-display-xl font-bold break-words text-primary dark:text-cream-100">
        {word.word}
      </h2>
      {word.partOfSpeech && (
        <p className="mt-1 text-sm text-ink-muted italic">{word.partOfSpeech}</p>
      )}
    </>
  )
  const reveal = reversed ? (
    <>
      <h2 className="text-display-xl font-bold break-words text-primary dark:text-cream-100">
        {word.word}
      </h2>
      {word.partOfSpeech && (
        <p className="mt-1 text-sm text-ink-muted italic">{word.partOfSpeech}</p>
      )}
    </>
  ) : (
    <>
      <p className="font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase">
        {word.word}
        {word.partOfSpeech && ` · ${word.partOfSpeech}`}
      </p>
      <p className="mt-3 text-lg leading-relaxed font-medium text-ink">{word.definition}</p>
      {word.example && (
        <p className="mt-2 text-sm text-ink-muted italic">“{word.example}”</p>
      )}
      {word.synonyms?.length > 0 && (
        <p className="mt-1 text-sm text-ink-muted">Synonyms: {word.synonyms.join(', ')}</p>
      )}
    </>
  )
  // Reversed front names no word: screen readers must not hear the answer.
  const label = flipped
    ? reversed
      ? `Word ${word.word}`
      : `Definition of ${word.word}`
    : reversed
      ? 'Definition, tap to reveal'
      : `Word ${word.word}, tap to reveal`
  const face = 'flip-face absolute inset-0 overflow-y-auto overscroll-contain rounded-xl border-2 border-line bg-card text-center shadow-paper dark:shadow-none'
  return (
    <div className={`flip-scene w-full ${shake ? 'animate-shake' : ''}`}>
      <button
        onClick={onFlip}
        className="flip-scene block w-full"
        aria-pressed={flipped}
        aria-label={label}
      >
        <span
          className={`flip-inner relative flex min-h-72 w-full sm:min-h-80 ${flipped ? 'flipped' : ''}`}
        >
          {/* Stacked card behind the face: a second card peeking out. */}
          <span
            aria-hidden="true"
            className="absolute inset-x-4 top-2 -bottom-2 rounded-xl border border-line bg-raised"
          />
          <span className={face}>
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1.5 rounded-t-xl bg-accent"
            />
            <span
              aria-hidden="true"
              className="absolute top-4 right-4 rounded-sm border border-line bg-raised px-1.5 py-0.5 font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase"
            >
              {reversed ? 'Meaning' : 'Card'}
            </span>
            <span className="flex min-h-full flex-col items-center justify-center p-6 sm:p-8">
              {prompt}
              <span className="mt-6 inline-flex items-center gap-1.5 border-b border-dashed border-ink-muted/60 pb-0.5 font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase">
                Tap to reveal
              </span>
            </span>
          </span>
          <span className={`${face} flip-back`}>
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1.5 rounded-t-xl bg-sage"
            />
            <span
              aria-hidden="true"
              className="absolute top-4 right-4 rounded-sm border border-line bg-raised px-1.5 py-0.5 font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase"
            >
              Meaning
            </span>
            <span className="flex min-h-full flex-col items-center justify-center p-6 sm:p-8">
              {reveal}
            </span>
          </span>
        </span>
      </button>
    </div>
  )
}
