// VocabVault owl mascot. Token-driven fills (visible in light + dark),
// geometric and calm at small sizes. Pure decoration — callers hide it
// from assistive tech (EmptyState already wraps art aria-hidden).
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
      {/* ear tufts */}
      <polygon points="36,36 50,42 38,52" className="fill-accent-deep" />
      <polygon points="84,36 70,42 82,52" className="fill-accent-deep" />
      {/* wings */}
      <ellipse cx="28" cy="72" rx="9" ry="17" transform="rotate(18 28 72)" className="fill-accent-deep" opacity="0.55" />
      <ellipse cx="92" cy="72" rx="9" ry="17" transform="rotate(-18 92 72)" className="fill-accent-deep" opacity="0.55" />
      {/* body */}
      <ellipse cx="60" cy="68" rx="34" ry="38" className="fill-accent" />
      {/* belly */}
      <ellipse cx="60" cy="80" rx="20" ry="22" className="fill-gold" />
      {/* eyes */}
      <circle cx="46" cy="56" r="11" fill="white" />
      <circle cx="74" cy="56" r="11" fill="white" />
      <circle cx="46" cy="57" r="5" className="fill-night-950" />
      <circle cx="74" cy="57" r="5" className="fill-night-950" />
      <circle cx="48" cy="55" r="1.8" fill="white" />
      <circle cx="76" cy="55" r="1.8" fill="white" />
      {/* beak */}
      <polygon points="60,62 55,69 65,69" className="fill-accent-deep" />
      {/* feet */}
      <rect x="46" y="102" width="10" height="5" rx="2.5" className="fill-accent-deep" />
      <rect x="64" y="102" width="10" height="5" rx="2.5" className="fill-accent-deep" />
      {/* sparkles */}
      <circle cx="16" cy="30" r="2.5" className="fill-accent" opacity="0.6" />
      <circle cx="104" cy="26" r="3" className="fill-accent" opacity="0.45" />
      <circle cx="100" cy="96" r="2" className="fill-gold" />
    </svg>
  )
}
