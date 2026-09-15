import Button from '../components/ui/Button'

export default function Contact() {
  return (
    <div className="animate-page mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary dark:text-cream-100">
          Contact
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-cream-300/80">
          Bugs, wrong definitions, or deletion requests.
        </p>
      </div>
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm dark:border-white/10 dark:bg-night-900 dark:text-cream-300 dark:shadow-none">
        <p>
          The fastest way to reach the maintainers is a GitHub issue — it keeps
          the report, the fix, and the follow-up in one place.
        </p>
        <a
          href="https://github.com/zaheen4/vocab-vault/issues"
          target="_blank"
          rel="noreferrer"
        >
          <Button>Open an issue on GitHub</Button>
        </a>
        <p className="text-xs text-slate-400 dark:text-cream-300/60">
          Include what you tapped, what you expected, and your account email for
          data requests.
        </p>
      </div>
    </div>
  )
}
