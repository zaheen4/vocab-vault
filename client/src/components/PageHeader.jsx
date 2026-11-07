export default function PageHeader({ eyebrow, title, sub, action }) {
  return (
    <div>
      {(eyebrow || action) && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          {eyebrow ? (
            <p className="font-display text-xs font-bold tracking-widest text-accent-ink uppercase">
              {eyebrow}
            </p>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      <h1 className="font-display text-display-lg font-bold text-ink">
        {title}
      </h1>
      {sub && (
        <p className="mt-1 text-sm text-ink-muted">{sub}</p>
      )}
    </div>
  )
}
