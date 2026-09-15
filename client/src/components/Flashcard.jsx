// Shared flashcard face: prompt on front, answer on back. Study controls
// (speaker, answer buttons) live outside — never nest interactives here.
export default function Flashcard({ word, flipped, onFlip, shake, reversed }) {
  const prompt = reversed ? (
    <>
      <p className="text-lg font-semibold text-primary dark:text-cream-100">{word.definition}</p>
      {word.example && (
        <p className="mt-1 text-sm text-slate-500 italic dark:text-cream-300/80">“{word.example}”</p>
      )}
      {word.synonyms?.length > 0 && (
        <p className="mt-1 text-sm text-slate-400 dark:text-cream-300/70">Synonyms: {word.synonyms.join(', ')}</p>
      )}
    </>
  ) : (
    <>
      <h2 className="text-3xl font-bold break-words text-primary dark:text-cream-100">{word.word}</h2>
      {word.partOfSpeech && (
        <p className="mt-1 text-sm text-slate-400 italic dark:text-cream-300/70">{word.partOfSpeech}</p>
      )}
    </>
  )
  const reveal = reversed ? (
    <>
      <h2 className="text-3xl font-bold break-words text-primary dark:text-cream-100">{word.word}</h2>
      {word.partOfSpeech && (
        <p className="mt-1 text-sm text-slate-400 italic dark:text-cream-300/70">{word.partOfSpeech}</p>
      )}
    </>
  ) : (
    <>
      <p className="text-xs font-medium tracking-wide text-slate-400 uppercase dark:text-cream-300/70">
        {word.word}
        {word.partOfSpeech && ` · ${word.partOfSpeech}`}
      </p>
      <p className="mt-2 text-lg leading-relaxed font-medium text-primary dark:text-cream-100">{word.definition}</p>
      {word.example && (
        <p className="mt-1 text-sm text-slate-500 italic dark:text-cream-300/80">“{word.example}”</p>
      )}
      {word.synonyms?.length > 0 && (
        <p className="mt-1 text-sm text-slate-400 dark:text-cream-300/70">Synonyms: {word.synonyms.join(', ')}</p>
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
  return (
    <div className={`flip-scene w-full ${shake ? 'animate-shake' : ''}`}>
      <button
        onClick={onFlip}
        className="flip-scene block w-full"
        aria-pressed={flipped}
        aria-label={label}
      >
        <span className={`flip-inner relative flex min-h-64 w-full ${flipped ? 'flipped' : ''}`}>
          <span className="flip-face absolute inset-0 flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-night-900 dark:shadow-none">
            {prompt}
            <p className="pt-4 text-xs tracking-wide text-slate-400 uppercase dark:text-cream-300/60">Tap to reveal</p>
          </span>
          <span className="flip-back flip-face absolute inset-0 flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-night-900 dark:shadow-none">
            {reveal}
          </span>
        </span>
      </button>
    </div>
  )
}
