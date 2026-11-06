export default function EmptyState({ title = 'Nothing here yet', message, action, art }) {
  return (
    <div className="py-16 text-center">
      {art && <div className="mx-auto mb-4 flex justify-center" aria-hidden="true">{art}</div>}
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {message && <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
