import { cn } from '../../utils/cn'

const base =
  'inline-flex items-center justify-center px-4 py-2 font-display text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

const variants = {
  primary: 'bg-accent text-primary hover:brightness-95',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  danger: 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
  success: 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
}

// Primary is always tactile. Other variants go tactile only with chunky.
// Radius is chosen in one place so rounded-md and rounded-xl never collide
// in a class list (cn() joins without deduping).
const tactileEdge = {
  primary: 'border-[#b25f16]',
  secondary: 'border-slate-400',
  danger: 'border-red-800',
  success: 'border-emerald-800',
}

export default function Button({
  variant = 'primary',
  fullWidth = false,
  loading = false,
  chunky = false,
  className = '',
  children,
  disabled,
  ...props
}) {
  const tactile = chunky || variant === 'primary'
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        base,
        variants[variant] || variants.primary,
        tactile
          ? cn(
              'rounded-xl border-b-4 active:translate-y-1 active:border-b-0',
              tactileEdge[variant] || tactileEdge.primary
            )
          : 'rounded-md',
        fullWidth && 'w-full',
        className
      )}
    >
      {loading ? '…' : children}
    </button>
  )
}
