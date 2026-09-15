export default function Card({ className = '', hoverable = false, children, ...props }) {
  return (
    <div
      {...props}
      className={`rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-night-900 dark:shadow-none ${
        hoverable ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow dark:hover:border-white/20' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
