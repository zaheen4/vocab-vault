import { cn } from '../utils/cn'

// Section surface for dashboards: card stock plus the same corner tab the
// index cards use, so Progress and History read as one stack of stock rather
// than a pile of unrelated boxes.
export default function Sheet({ tab, title, meta, className = '', children, ...props }) {
  return (
    <section
      {...props}
      className={cn(
        'relative rounded-xl border border-line bg-card p-5 shadow-paper',
        tab && 'pt-6',
        className
      )}
    >
      {tab && (
        <span
          aria-hidden="true"
          // Inherits the sheet's surface and edge instead of assuming
          // card stock: a tinted sheet (manila passport, stamp mistake bank)
          // otherwise gets a bright card-coloured tab punched through its
          // top edge, which reads as a hole rather than a fold-out label.
          className="absolute -top-3 left-4 rounded-t-md border border-b-0 border-inherit bg-inherit px-2 pt-1 pb-1.5 font-mono text-2xs font-bold tracking-widest text-ink-muted uppercase"
        >
          {tab}
        </span>
      )}
      {(title || meta) && (
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-line pb-3">
          {title ? (
            <h2 className="font-display text-base font-bold text-ink">{title}</h2>
          ) : (
            <span />
          )}
          {meta}
        </div>
      )}
      {children}
    </section>
  )
}
