export default function StudyFeedback({ feedback, onDismiss }) {
  if (!feedback) return null

  if (feedback.error) {
    return (
      <div className="animate-pop flex w-full items-center justify-center gap-3 rounded-lg border border-stamp/30 bg-stamp/10 px-4 py-3 text-sm font-semibold text-stamp">
        <span>Couldn&apos;t save that review. Check your connection and try again.</span>
        <button type="button" className="ml-auto underline" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    )
  }

  return (
    <div
      className={`animate-pop flex w-full items-center justify-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold ${
        feedback.correct
          ? 'border-sage/30 bg-sage/10 text-sage'
          : 'border-stamp/30 bg-stamp/10 text-stamp'
      }`}
    >
      <span className="text-lg">{feedback.correct ? '✓' : '✗'}</span>
      <span>
        {feedback.correct ? 'Nice!' : 'Keep going!'} → {feedback.boxLabel}
      </span>
      <span className="relative ml-auto font-mono tabular-nums">
        +{feedback.xpEarned} XP
        <span className="animate-float-up absolute -top-1 right-0 text-accent">
          +{feedback.xpEarned}
        </span>
      </span>
    </div>
  )
}
