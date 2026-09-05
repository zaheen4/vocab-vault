export default function Card({ className = '', hoverable = false, children, ...props }) {
  return (
    <div
      {...props}
      className={`rounded-lg border border-slate-200 bg-white shadow-sm ${
        hoverable ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
