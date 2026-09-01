export default function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="py-16 text-center">
      <p className="text-lg font-semibold text-primary">{title}</p>
      {message && <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
