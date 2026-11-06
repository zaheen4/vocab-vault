import Confetti from './Confetti'
import LevelUpBanner from './LevelUpBanner'
import ScoreRing from './ScoreRing'

// Shared end-of-session treatment: one heading, the score ring, optional stat
// tiles, the ✓/✗ word roll and the caller's actions. Every study mode ends on
// this shape so results never feel like four different products.
function ResultChip({ result }) {
  return (
    <span
      title={result.word}
      className={`rounded-sm px-1.5 py-0.5 font-mono text-xs font-bold ${
        result.correct
          ? 'bg-sage/15 text-sage'
          : 'bg-stamp/10 text-stamp'
      }`}
    >
      {result.correct ? '✓' : '✗'}
    </span>
  )
}

export default function SessionResults({
  message,
  greeting = null,
  subtitle = null,
  correct,
  total,
  stats = [],
  results = [],
  confetti = false,
  levelEvent = null,
  actions = null,
}) {
  return (
    <div className="animate-page mx-auto max-w-2xl space-y-6 py-6 text-center">
      {confetti && <Confetti active={confetti} pieces={70} />}
      <div className="space-y-2">
        <p className="font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase">
          Session complete
        </p>
        <h1 className="font-display text-display-xl font-bold text-primary dark:text-cream-100">
          {message}
        </h1>
        {greeting && <p className="text-sm text-ink-muted">{greeting}</p>}
        {subtitle && <p className="text-ink-muted">{subtitle}</p>}
      </div>

      {levelEvent && (
        <LevelUpBanner
          level={levelEvent.newLevel}
          className="mx-auto max-w-sm rounded-xl px-4 py-3"
        />
      )}

      <ScoreRing correct={correct} total={total} />

      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-line bg-card p-4">
              <p className="flex items-center justify-center gap-1 font-display text-2xl font-bold text-ink tabular-nums">
                {stat.value}
                {stat.icon}
              </p>
              <p className="text-2xs font-semibold tracking-wide text-ink-muted uppercase">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {results.map((result, i) => (
            <ResultChip key={`${result.word}-${i}`} result={result} />
          ))}
        </div>
      )}

      {actions && <div className="flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  )
}
