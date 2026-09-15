import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

export default function Privacy() {
  return (
    <div className="animate-page mx-auto max-w-xl space-y-4">
      <PageHeader
        title="Privacy"
        sub="Plainly stated, no legalese beyond what is true."
      />
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm dark:border-white/10 dark:bg-night-900 dark:text-cream-300 dark:shadow-none">
        <p>
          VocabVault stores your account (name, email, password hash) and your
          study data (reviews, streaks, XP, badges, saved words, custom lists)
          in its database so your progress follows you across devices.
        </p>
        <p>
          Passwords are hashed before storage and never returned by the API.
          There is no third-party analytics and no advertising — your data is
          never sold or shared.
        </p>
        <p>
          Want your account and all its data deleted? Ask via the{' '}
          <Link to="/contact" className="font-medium text-accent hover:underline">
            contact page
          </Link>{' '}
          and it will be removed.
        </p>
      </div>
    </div>
  )
}
