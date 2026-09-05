// Tiered end-of-session messages with round-robin rotation.
// Each pool cycles without repeating until exhausted; position persists in
// localStorage per pool. Pure except for the counter store, which is
// injectable so rotation is unit-testable without a DOM.

export const POOLS = {
  perfect: [
    'Flawless victory! 🏆',
    'A perfect session! 🌟',
    'Unstoppable today! 🔥',
    'Textbook mastery! 📚',
    'Every single one! 🎯',
    'Brain: upgraded! 🧠',
    'Perfection suits you! ✨',
    'Nothing got past you! 🛡️',
    'Gold-star session! ⭐',
    'Certified word wizard! 🪄',
  ],
  levelup: [
    'Level up — grind paid off! 🎊',
    'New level, same sharp mind! ⭐',
    'Leveled up mid-session! 🚀',
    'The XP bar burst! 🎆',
    'Promotion earned! 🏅',
    'Bigger brain unlocked! 🧠',
    ({ level }) => (level ? `Level ${level} looks good on you! 😎` : 'Leveled up in style! 😎'),
    'Keep climbing! 🧗',
    'That ding never gets old! 🔔',
    'Stronger every session! 💪',
  ],
  combo: [
    ({ bestCombo }) => `${bestCombo}-answer streak — on fire! 🔥`,
    'That streak deserves applause! 👏',
    'Combo master in the house! 🎮',
    'You were in the zone! 🎯',
    ({ bestCombo }) => `${bestCombo} straight — unreal focus! ⚡`,
    'Momentum machine! 🚂',
    'Locked in! 🔒',
    'Rhythm: found! 🎵',
    "Couldn't buy a miss! 💰",
    'Streak energy! 🌪️',
  ],
  excellent: [
    'Excellent work! 🎉',
    'Sharp recall! 🧠',
    'Almost perfect! ✨',
    'So close to flawless! 🎯',
    'Your memory is showing off! 😎',
    'Strong session! 💪',
    'The boxes are filling up! 📦',
    'High-voltage brain! ⚡',
    'Smooth sailing! ⛵',
    'Burning through the deck! 🔥',
  ],
  good: [
    'Good progress! 👍',
    'Getting there! 🚀',
    'Solid session! 🧱',
    'Nice grind! 📈',
    'Above the line! 📊',
    'Slow and steady! 🐢',
    'Building momentum! 🛠️',
    'Keep stacking wins! 🥞',
    'Moving up! 🎢',
    'Brain gains! 🏋️',
  ],
  encouraging: [
    'Keep pushing! 💪',
    'Every review counts! 🌱',
    'Warming up! ☀️',
    'Stay with it! 🔁',
    'Progress is progress! 🐾',
    'One more round? 🔄',
    'Showing up is the hard part — done! ✅',
    'Halfway to hot! 🌡️',
    'Shake it off! 🎲',
    'Tomorrow-you says thanks! 🙏',
  ],
  comeback: [
    "Tough set — you'll get them next time! 💛",
    'Mistakes are data! 🧪',
    'Fresh start energy! 🌅',
    'Even masters blank sometimes! 🎭',
    'Rough waters, steady ship! ⚓',
    'Your future self is rooting for you! 📣',
    'Review, return, conquer! ⚔️',
    'No shame in the struggle! 🤝',
    'The words will yield! 🏰',
    'Courage counts double today! 🦁',
  ],
}

export const COMBO_THRESHOLD = 8

export function pickPool({ pct, bestCombo = 0, levelUp = false }) {
  if (pct >= 100) return 'perfect'
  if (levelUp) return 'levelup'
  if (bestCombo >= COMBO_THRESHOLD) return 'combo'
  if (pct >= 80) return 'excellent'
  if (pct >= 60) return 'good'
  if (pct >= 40) return 'encouraging'
  return 'comeback'
}

function webStore() {
  try {
    if (typeof localStorage !== 'undefined') return localStorage
  } catch {
    // fall through to memory store (node tests, privacy mode)
  }
  const mem = new Map()
  return {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
  }
}

export function createMemoryStore() {
  const mem = new Map()
  return {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
  }
}

function resolveVariant(variant, ctx) {
  return typeof variant === 'function' ? variant(ctx) : variant
}

// Returns the next message for a finished session. Call exactly once per
// session (e.g. when transitioning to the end screen) — every call advances
// the pool's rotation counter.
export function getSessionMessage(
  { correct = 0, total = 0, bestCombo = 0, levelUp = false, level = null } = {},
  store
) {
  const pct = total === 0 ? 0 : Math.round((correct / total) * 100)
  const poolName = pickPool({ pct, bestCombo, levelUp })
  const pool = POOLS[poolName]
  const s = store || webStore()
  const key = `vv_msg_${poolName}`
  let last = -1
  try {
    const raw = s.getItem(key)
    const parsed = raw === null ? NaN : parseInt(raw, 10)
    if (!Number.isNaN(parsed)) last = parsed
  } catch {
    last = -1
  }
  const next = (last + 1) % pool.length
  try {
    s.setItem(key, String(next))
  } catch {
    // rotation persistence is best-effort; message still resolves
  }
  return resolveVariant(pool[next], { correct, total, pct, bestCombo, levelUp, level })
}
