import { useWordProgress } from '../api/queries'

// Last-5 review timeline for one word. Renders nothing until `active`
// (callers fetch lazily on expand via the hook's enabled flag).
export default function WordHistory({ wordId, active }) {
  const { data, isLoading } = useWordProgress(active ? wordId : null)
  if (!active) return null

  if (isLoading) {
    return <p className="text-xs text-slate-400">Loading history…</p>
  }

  const items = (data?.history || []).slice(-5).reverse()
  if (items.length === 0) {
    return <p className="text-xs text-slate-400">No reviews yet — flip it in practice to start.</p>
  }

  return (
    <ul className="space-y-1">
      {items.map((h) => (
        <li key={h._id || h.at} className="flex items-center gap-2 text-xs text-slate-500">
          <span className={h.correct ? 'font-bold text-emerald-600' : 'font-bold text-red-500'}>
            {h.correct ? '✓' : '✗'}
          </span>
          <span>
            Box {h.box} ·{' '}
            {new Date(h.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </li>
      ))}
    </ul>
  )
}
