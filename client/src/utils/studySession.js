export const BOX_LABELS = {
  1: 'Box 1',
  2: 'Box 2',
  3: 'Box 3',
  4: 'Box 4',
  5: 'Mastered',
}

export function boxLabel(box) {
  return BOX_LABELS[box] || `Box ${box}`
}

export function initialSessionTally() {
  return {
    correct: 0,
    total: 0,
    combo: 0,
    bestCombo: 0,
    xp: 0,
    newLearned: 0,
    caughtUp: 0,
    levelUp: false,
    level: null,
    levelEvent: null,
  }
}

export function tallyAnswer(tally, { correct, gamification = {} }) {
  const combo = correct ? tally.combo + 1 : 0
  return {
    correct: tally.correct + (correct ? 1 : 0),
    total: tally.total + 1,
    combo,
    bestCombo: Math.max(tally.bestCombo, combo),
    xp: tally.xp + (gamification.xpEarned || 0),
    newLearned: tally.newLearned + (gamification.newWordsLearned || 0),
    caughtUp: tally.caughtUp + (gamification.reviewsCaughtUp || 0),
    levelUp: tally.levelUp || Boolean(gamification.levelUp),
    level: gamification.level != null ? gamification.level : tally.level,
    levelEvent: gamification.levelUp
      ? { newLevel: gamification.level, xp: gamification.xp }
      : tally.levelEvent,
  }
}

export function sessionMessageInput(tally) {
  return {
    correct: tally.correct,
    total: tally.total,
    bestCombo: tally.bestCombo,
    levelUp: tally.levelUp,
    level: tally.level,
  }
}

export function sessionProgress(index, total) {
  if (!total) return 0
  return Math.round((index / total) * 100)
}
