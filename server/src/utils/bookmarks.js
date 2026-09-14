// Pure mastery mapping for bookmark entries. progress is the user's
// Progress doc for the word, or null when never reviewed.
export function masteryFor(progress) {
  if (!progress) return { status: 'new', box: 0 }
  return {
    status: progress.status === 'mastered' ? 'mastered' : 'learning',
    box: progress.box || 1,
  }
}
