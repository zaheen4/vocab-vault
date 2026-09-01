export default function Card({ className = '', hoverable = false, children, ...props }) {
  return (
    <div
      {...props}
      className={`rounded-lg border border-slate-200 bg-white shadow-sm ${
        hoverable ? 'transition-shadow hover:shadow' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
