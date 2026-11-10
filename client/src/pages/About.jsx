import Mascot from '../components/art/Mascot'
import Sheet from '../components/Sheet'
import Button from '../components/ui/Button'

export default function About() {
  return (
    <div className="animate-page mx-auto max-w-xl space-y-6">
      <div className="text-center">
        <div className="flex justify-center" aria-hidden="true">
          <Mascot size={96} />
        </div>
        <h1 className="mt-2 font-display text-display-lg font-bold text-ink">
          Master your words.
        </h1>
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
          VocabVault is a smart flashcard app for GRE vocabulary — spaced
          repetition across flashcards, quizzes, and typing, with streaks,
          XP, and badges keeping the habit alive.
        </p>
      </div>

      <Sheet tab="Privacy" title="Privacy, plainly stated" className="bg-manila">
        <div className="space-y-2 text-sm text-ink-muted">
          <p>
            VocabVault stores your account (name, email, password hash) and
            your study data (reviews, quiz history, streaks, XP, badges,
            saved words, custom lists) in its database so your progress
            follows you across devices.
          </p>
          <p>
            Passwords are hashed before storage and never returned by the
            API. There is no third-party analytics and no advertising — your
            data is never sold or shared.
          </p>
          <p>
            Want your account gone? Delete it yourself in{' '}
            <span className="font-semibold text-ink">
              Settings → Danger zone
            </span>
            . Confirm your password and your account, reviews, quiz history,
            bookmarks, and lists are removed from the database immediately and
            permanently.
          </p>
        </div>
      </Sheet>

      <Sheet tab="Contact" title="Contact" className="bg-manila">
        <p className="text-sm text-ink-muted">
          Bugs, wrong definitions, or feature ideas — the fastest way to reach
          the maintainers is a GitHub issue. Include what you tapped, what you
          expected, and what actually happened.
        </p>
        <a
          href="https://github.com/zaheen4/vocab-vault/issues"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block"
        >
          <Button>Open an issue on GitHub</Button>
        </a>
      </Sheet>
    </div>
  )
}
