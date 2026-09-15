import Mascot from '../components/art/Mascot'
import Button from '../components/ui/Button'

// Single home for product, privacy, and contact: one scroll instead of a
// footer strip plus two orphan routes.
export default function About() {
  return (
    <div className="animate-page mx-auto max-w-xl space-y-6">
      <div className="text-center">
        <div className="flex justify-center" aria-hidden="true">
          <Mascot size={96} />
        </div>
        <h1 className="mt-2 font-display text-display-lg font-bold text-primary dark:text-cream-100">
          Master your words.
        </h1>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-cream-300/80">
          VocabVault is a smart flashcard app for GRE vocabulary — spaced
          repetition across flashcards, quizzes, and typing, with streaks,
          XP, and badges keeping the habit alive.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-night-900 dark:shadow-none">
        <h2 className="font-display text-base font-bold text-primary dark:text-cream-100">
          Privacy, plainly stated
        </h2>
        <div className="mt-2 space-y-2 text-sm text-slate-600 dark:text-cream-300">
          <p>
            VocabVault stores your account (name, email, password hash) and
            your study data (reviews, streaks, XP, badges, saved words,
            custom lists) in its database so your progress follows you
            across devices.
          </p>
          <p>
            Passwords are hashed before storage and never returned by the
            API. There is no third-party analytics and no advertising — your
            data is never sold or shared.
          </p>
          <p>
            Want your account and all its data deleted? Ask through the
            contact section below and it will be removed.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-night-900 dark:shadow-none">
        <h2 className="font-display text-base font-bold text-primary dark:text-cream-100">
          Contact
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-cream-300">
          Bugs, wrong definitions, or deletion requests — the fastest way to
          reach the maintainers is a GitHub issue. Include what you tapped,
          what you expected, and your account email for data requests.
        </p>
        <a
          href="https://github.com/zaheen4/vocab-vault/issues"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block"
        >
          <Button>Open an issue on GitHub</Button>
        </a>
      </section>
    </div>
  )
}
