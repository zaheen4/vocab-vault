export const BOX_INTERVALS = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 }

export function nextReviewState(progress, correct) {
  const box = correct ? Math.min((progress.box || 1) + 1, 5) : 1
  return {
    box,
    streakCorrect: correct ? (progress.streakCorrect || 0) + 1 : 0,
    status: box === 5 ? 'mastered' : 'learning',
    lastReviewed: new Date(),
    reviewDueAfter: new Date(Date.now() + BOX_INTERVALS[box] * 86400000),
  }
}
