import { cn } from '../../utils/cn'

const TONES = {
  error: 'border-stamp/30 bg-stamp/5 text-stamp',
  success: 'border-sage/30 bg-sage/5 text-sage',
  info: 'border-line bg-raised text-ink',
}

export default function Notice({
  tone = 'info',
  title,
  className = '',
  children,
  role,
  ...props
}) {
  const resolvedRole = role ?? (tone === 'error' ? 'alert' : 'status')
  return (
    <div
      role={resolvedRole}
      className={cn(
        'rounded-md border px-3 py-2 text-sm',
        TONES[tone] || TONES.info,
        className
      )}
      {...props}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && (title ? <div className="mt-1">{children}</div> : children)}
    </div>
  )
}
