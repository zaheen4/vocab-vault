import Mascot from './art/Mascot'
import { cn } from '../utils/cn'

// Level-up celebration banner with Bolt as companion. Fires conditionally at
// call sites (level-up events only) so the mascot marks genuine payoffs.
export default function LevelUpBanner({ level, className = '' }) {
  return (
    <div
      className={cn(
        'animate-pop animate-glow flex items-center justify-center gap-3 rounded-lg border-2 border-accent bg-gold px-4 py-2 text-center text-sm font-bold text-primary dark:bg-accent/15 dark:text-accent',
        className
      )}
    >
      <Mascot size={44} />
      <span>🎊 Level up! You reached Level {level}</span>
    </div>
  )
}
