// Shared page header: optional eyebrow, H1 title, subtitle. Page H1s stay
// text-2xl by rule (heroes and done screens own the larger sizes) —
// Typography section of DESIGN_SYSTEM.md.
//
// `action` sits on the eyebrow row, right-aligned. On a phone a page action
// parked under the subtitle takes a whole band of its own and reads as a
// second title; on the eyebrow row it is a header action at every width.
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
