// Shared aggregation for the "words behind my progress" endpoints (`/due`,
// `/weak`). A progress row can outlive its word — the seed retires GregMat
// words by id, without touching per-user progress — so a plain `populate()`
// yields `null` and the route silently drops it *after* the limit was applied.
// That let deleted words occupy the batch window and inflate the total.
//
// `$lookup` + `$unwind` drops rows with no matching word before the total is
// counted and before the limit is applied, so ghosts can neither hide real
// cards nor show up in the count.
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

// `aggregate()` resolves to a one-element array: the `$facet` result, or `[]`
// when nothing matched.
export function readWordQueue(result) {
  const facet = Array.isArray(result) ? result[0] : undefined
  return {
    words: facet?.words ?? [],
    total: facet?.total?.[0]?.count ?? 0,
  }
}
