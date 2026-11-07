const QUEUE_FIELDS = {
  word: 1,
  reviewDueAfter: 1,
  streakCorrect: 1,
  lastReviewed: 1,
}

export function buildWordQueuePipeline({ match, sort, limit }) {
  return [
    { $match: match },
    {
      $lookup: {
        from: 'words',
        localField: 'wordId',
        foreignField: '_id',
        as: 'word',
      },
    },
    { $unwind: '$word' },
    { $project: QUEUE_FIELDS },
    {
      $facet: {
        total: [{ $count: 'count' }],
        words: [
          { $sort: sort },
          { $limit: limit },
          { $replaceRoot: { newRoot: '$word' } },
        ],
      },
    },
  ]
}

export function readWordQueue(result) {
  const facet = Array.isArray(result) ? result[0] : undefined
  return {
    words: facet?.words ?? [],
    total: facet?.total?.[0]?.count ?? 0,
  }
}
