// Tiny classnames joiner: cn('a', cond && 'b') -> 'a b'.
// Note: this joins only — it does NOT dedupe conflicting Tailwind classes
// the way tailwind-merge would. When two classes collide, order them
// carefully (later utilities win in the cascade only if specificity ties,
// so prefer explicit conditional branches for conflicts).
export function cn(...parts) {
  return parts.filter(Boolean).join(' ')
}
