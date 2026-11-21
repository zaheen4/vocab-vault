import Mascot from './art/Mascot'
import { cn } from '../utils/cn'

export default function LevelUpBanner({ level, className = '' }) {
  return (
    <div
      role="status"
      className={cn(
        'animate-pop animate-glow flex items-center justify-center gap-3 rounded-lg border-2 border-accent bg-gold px-4 py-2 text-center text-sm font-bold text-primary dark:bg-accent/15 dark:text-accent-ink',
        className
      )}
    >
      <Mascot size={44} />
      <span>
        <span role="img" aria-label="Party popper">🎊</span> Level up! You reached Level {level}
      </span>
    </div>
  )
}
