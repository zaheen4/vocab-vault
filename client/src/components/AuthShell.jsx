import Logo from './Logo'
import Mascot from './art/Mascot'

const PITCH = [
  { title: 'Spaced repetition, scheduled for you', body: 'Every answer reschedules the next review.' },
  { title: 'Three ways to practice', body: 'Flashcards, quizzes, and typing in every deck.' },
  { title: 'Streaks, XP, and badges', body: 'Small wins that compound into a habit.' },
]

// Split-hero auth shell: brand pitch beside the form on desktop, compact
// brand on top for mobile. Used by Login + Register so the two can never
// drift apart again.
export default function AuthShell({ title, children }) {
  return (
    <div className="animate-page flex min-h-screen supports-[height:100dvh]:min-h-dvh items-center justify-center bg-gold px-4 py-6 sm:py-10 dark:bg-night-950">
      <div className="grid w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:grid-cols-2 dark:border-white/10 dark:bg-night-900 dark:shadow-none">
        <div className="flex flex-col justify-center gap-3 p-5 sm:gap-5 sm:p-8 bg-primary text-white dark:bg-night-800">
          <div className="flex items-center gap-2.5">
            <span className="rounded-lg bg-gold p-1.5">
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
                  <span className="block text-white/70">{p.body}</span>
                </span>
              </li>
            ))}
          </ul>
          <div aria-hidden="true" className="mt-auto hidden justify-start pt-4 sm:flex">
            <span className="rounded-full bg-gold p-4">
              <Mascot size={96} />
            </span>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-primary dark:text-cream-100">
            {title}
          </h1>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  )
}
