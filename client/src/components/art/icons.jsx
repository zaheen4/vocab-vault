// Game icon set: currentColor fills so callers set light/dark ink via
// text-* classes. No emoji above text-base anywhere in src.
function base(size) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    'aria-hidden': true,
  }
}

export function StarIcon({ size = 24, className = '' }) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  )
}

export function FlameIcon({ size = 24, className = '' }) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
    </svg>
  )
}

export function SproutIcon({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 22v-9" />
      <path d="M12 13C12 9 9 6 4 6c0 5 3.5 8 8 7z" fill="currentColor" stroke="none" />
      <path d="M12 13c0-4 3-7 8-7 0 5-3.5 8-8 7z" fill="currentColor" stroke="none" opacity="0.65" />
    </svg>
  )
}

export function HundredIcon({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="9.5" />
      <text
        x="12"
        y="15.5"
        textAnchor="middle"
        fontSize="8"
        fontWeight="800"
        fill="currentColor"
        stroke="none"
        fontFamily="inherit"
      >
        100
      </text>
    </svg>
  )
}

export function GemIcon({ size = 24, className = '' }) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 2 5 9l7 13 7-13-7-7z" opacity="0.9" />
      <path
        d="M5 9h14M12 2 9 9l3 13 3-13-3-7"
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth="1"
        opacity="0.7"
      />
    </svg>
  )
}
