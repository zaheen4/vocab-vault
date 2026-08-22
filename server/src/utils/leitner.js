import { BOX_INTERVALS } from '../routes/progress.routes.js'

// Move a word through Leitner boxes based on answer quality.
// correct → box+1 (max 5), wrong → box 1.
// Status transitions: new → learning (first review), mastered (box 5).
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
