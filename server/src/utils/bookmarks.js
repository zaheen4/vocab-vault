export function masteryFor(progress) {
  if (!progress) return { status: 'new', box: 0 }
  return {
    status: progress.status === 'mastered' ? 'mastered' : 'learning',
    box: progress.box || 1,
  }
}
