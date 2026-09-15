import Mascot from './Mascot'

// Small scene illustrations for empty states. Token fills only (no hex),
// currentColor-free so they read on light + dark transparent backgrounds.
function Scene({ children, size = 120 }) {
  return (
    <svg width={size} height={size * 0.75} viewBox="0 0 160 120" fill="none" aria-hidden="true">
      {children}
    </svg>
  )
}

function DecksArt() {
  return (
    <Scene>
      <rect x="30" y="46" width="100" height="56" rx="10" className="fill-primary" opacity="0.18" />
      <rect x="38" y="34" width="100" height="56" rx="10" className="fill-accent" opacity="0.55" />
      <rect x="46" y="22" width="100" height="56" rx="10" className="fill-accent" />
      <rect x="60" y="38" width="56" height="8" rx="4" className="fill-gold" opacity="0.9" />
      <rect x="60" y="52" width="36" height="6" rx="3" className="fill-gold" opacity="0.6" />
    </Scene>
  )
}

function SearchArt() {
  return (
    <Scene>
      <circle cx="66" cy="52" r="28" strokeWidth="8" className="stroke-accent" />
      <line x1="88" y1="74" x2="112" y2="98" strokeWidth="10" strokeLinecap="round" className="stroke-accent" />
      <rect x="52" y="40" width="28" height="7" rx="3.5" className="fill-primary" opacity="0.55" />
      <rect x="52" y="52" width="18" height="7" rx="3.5" className="fill-primary" opacity="0.35" />
    </Scene>
  )
}

function SavedArt() {
  return (
    <Scene>
      <path
        d="M60 14h40v78l-20-14-20 14V14z"
        className="fill-accent"
      />
      <path
        d="M72 34l3.7 7.9 8.6 1-6.4 5.9 1.7 8.5-7.6-4.2-7.6 4.2 1.7-8.5-6.4-5.9 8.6-1L72 34z"
        className="fill-gold"
      />
    </Scene>
  )
}

function ProgressArt() {
  return (
    <Scene>
      {[34, 52, 70, 90].map((h, i) => (
        <rect
          key={h}
          x={36 + i * 24}
          y={100 - h}
          width="16"
          height={h}
          rx="5"
          className="fill-accent"
          opacity={0.35 + i * 0.2}
        />
      ))}
      <path d="M30 96 66 66l22 18 40-44" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary" />
    </Scene>
  )
}

function ListsArt() {
  return (
    <Scene>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx="44" cy={34 + i * 24} r="6" className="fill-accent" opacity={1 - i * 0.25} />
          <rect x="58" y={29 + i * 24} width={64 - i * 12} height="10" rx="5" className="fill-primary" opacity={0.35} />
        </g>
      ))}
    </Scene>
  )
}

function ReviewArt() {
  return (
    <Scene>
      <rect x="36" y="26" width="88" height="68" rx="10" className="fill-accent" />
      <rect x="36" y="26" width="88" height="68" rx="10" strokeWidth="4" className="stroke-accent-deep" />
      <rect x="52" y="46" width="56" height="9" rx="4.5" className="fill-gold" />
      <rect x="62" y="62" width="36" height="7" rx="3.5" className="fill-gold" opacity="0.7" />
      <path d="M118 78a16 16 0 1 1-5-11" strokeWidth="5" strokeLinecap="round" className="stroke-primary" />
      <polygon points="118,58 118,72 130,66" className="fill-primary" />
    </Scene>
  )
}

const ART = {
  decks: DecksArt,
  search: SearchArt,
  saved: SavedArt,
  progress: ProgressArt,
  lists: ListsArt,
  review: ReviewArt,
  mascot: Mascot,
}

// variant: decks | search | saved | progress | lists | review | mascot
export default function EmptyArt({ variant = 'decks', size }) {
  const Cmp = ART[variant] ?? DecksArt
  if (variant === 'mascot') return <Mascot size={size ?? 96} />
  return <Cmp />
}
