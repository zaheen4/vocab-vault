export default function Card({ className = '', hoverable = false, children, ...props }) {
  return (
    <div
      {...props}
      className={`rounded-xl border border-line bg-card shadow-paper ${
        hoverable ? 'transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
