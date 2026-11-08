import Logo from './Logo'
import Mascot from './art/Mascot'
import ThemeToggle from './ui/ThemeToggle'

const PITCH = [
  { title: 'Spaced repetition, scheduled for you', body: 'Every answer reschedules the next review.' },
  { title: 'Three ways to practice', body: 'Flashcards, quizzes, and typing in every deck.' },
  { title: 'Streaks, XP, and badges', body: 'Small wins that compound into a habit.' },
]

export default function AuthShell({ title, children }) {
  return (
    <div className="animate-page relative flex min-h-screen items-center justify-center bg-canvas px-4 py-6 supports-[height:100dvh]:min-h-dvh sm:py-10">
      <div className="absolute top-4 right-4 z-20 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <div className="grid w-full max-w-3xl overflow-hidden rounded-xl border border-line bg-manila shadow-paper sm:grid-cols-2">
        <div className="flex flex-col justify-center gap-3 bg-primary p-5 text-cream-100 sm:gap-5 sm:p-8">
          <div className="flex items-center gap-2.5">
            <span className="rounded-lg bg-gold p-1.5 dark:bg-night-900 dark:ring-1 dark:ring-white/10">
              <Logo size={26} />
            </span>
            <span className="font-display text-xl font-bold">VocabVault</span>
          </div>
          <p className="font-display text-2xl leading-tight font-bold sm:text-3xl">
            Master your words.
          </p>
          <ul className="hidden space-y-3 sm:block">
            {PITCH.map((p) => (
              <li key={p.title} className="flex gap-2.5 text-sm">
                <span aria-hidden="true" className="mt-0.5 font-bold text-accent">
                  ✓
                </span>
                <span>
                  <span className="font-bold">{p.title}</span>
                  <span className="block text-cream-300">{p.body}</span>
                </span>
              </li>
            ))}
          </ul>
          <div aria-hidden="true" className="mt-auto hidden justify-start pt-4 sm:flex">
            <span className="rounded-full bg-gold p-4 dark:bg-night-900 dark:ring-1 dark:ring-white/10">
              <Mascot size={96} />
            </span>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-ink">
            {title}
          </h1>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  )
}
