// Shared page header: optional eyebrow, H1 title, subtitle. Page H1s stay
// text-2xl by rule (heroes and done screens own the larger sizes) —
// Typography section of DESIGN_SYSTEM.md.
export default function PageHeader({ eyebrow, title, sub }) {
  return (
    <div>
      {eyebrow && (
        <p className="font-display text-xs font-bold tracking-widest text-accent uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="font-display text-2xl font-bold text-primary dark:text-cream-100">
        {title}
      </h1>
      {sub && (
        <p className="mt-1 text-sm text-slate-500 dark:text-cream-300/80">{sub}</p>
      )}
    </div>
  )
}
