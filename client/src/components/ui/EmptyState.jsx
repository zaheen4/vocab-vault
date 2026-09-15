export default function EmptyState({ title = 'Nothing here yet', message, action, art }) {
  return (
    <div className="py-16 text-center">
      {art && <div className="mx-auto mb-4 flex justify-center" aria-hidden="true">{art}</div>}
      <p className="font-display text-lg font-semibold text-primary dark:text-cream-100">{title}</p>
      {message && <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-cream-300/80">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
