// Classnames joiner with Tailwind conflict resolution: cn('px-4', 'px-3')
// -> 'px-3'. Later arguments win, so component call sites can safely
// override base styles without cascade-order guessing.
import { twMerge } from 'tailwind-merge'

export function cn(...parts) {
  return twMerge(parts.filter(Boolean).join(' '))
}
