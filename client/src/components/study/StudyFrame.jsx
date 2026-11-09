import { cn } from '../../utils/cn'

export default function StudyFrame({ children, className = '' }) {
  return (
    <div className={cn('mx-auto flex w-full max-w-2xl flex-col gap-2', className)}>
      {children}
    </div>
  )
}
