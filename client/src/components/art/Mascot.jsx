// VocabVault mascot: Bolt the Vault-Bot (team pick 2026-09-15). Token-driven
// fills (visible in light + dark). Pure decoration — callers hide it from
// assistive tech (EmptyState already wraps art aria-hidden).
export default function Mascot({ size = 96, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* antenna */}
      <line x1="60" y1="26" x2="60" y2="14" strokeWidth="4" strokeLinecap="round" className="stroke-accent-deep" />
      <circle cx="60" cy="11" r="5" className="fill-accent" />
      {/* ears */}
      <rect x="20" y="52" width="8" height="18" rx="4" className="fill-accent-deep" />
      <rect x="92" y="52" width="8" height="18" rx="4" className="fill-accent-deep" />
      {/* head */}
      <rect x="28" y="28" width="64" height="58" rx="18" className="fill-primary dark:fill-cream-100" />
      {/* face screen */}
      <rect x="38" y="40" width="44" height="34" rx="10" className="fill-night-950 dark:fill-night-900" />
      {/* V eyes (brand mark) */}
      <path d="M48 50l6 12 6-12" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="stroke-accent" fill="none" />
      <path d="M62 54l4 8 4-8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-gold" fill="none" />
      {/* smile */}
      <path d="M50 94q10 8 20 0" strokeWidth="4" strokeLinecap="round" className="stroke-accent" fill="none" />
    </svg>
  )
}
